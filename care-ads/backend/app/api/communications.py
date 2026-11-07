"""
Endpoints de API para Comunicaciones Multicanal con Anunciantes (Email, WhatsApp, SMS).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models import (
    User, UserRole, CommunicationType, CommunicationChannel,
    ClientCommunication, CampaignOrder, CampaignStatus
)
from app.services.notifications.manager import CommunicationManager

router = APIRouter(prefix="/communications", tags=["Comunicaciones & Reportes al Cliente"])


class SendCommunicationRequest(BaseModel):
    advertiser_id: Optional[uuid.UUID] = None
    campaign_order_id: Optional[uuid.UUID] = None
    communication_type: CommunicationType
    channels: List[CommunicationChannel]
    custom_data: Optional[Dict[str, Any]] = None


class BatchWeeklyReportsRequest(BaseModel):
    channels: List[CommunicationChannel] = [
        CommunicationChannel.EMAIL,
        CommunicationChannel.WHATSAPP
    ]


@router.post("/send")
async def send_communication(
    req: SendCommunicationRequest,
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.SALES_MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Envía un comunicado específico (reporte semanal, renovación, pago, factura o promo)
    a través de Email, WhatsApp y/o SMS.
    """
    try:
        adv_id = req.advertiser_id
        if not adv_id and req.campaign_order_id:
            res_ord = await db.execute(select(CampaignOrder).where(CampaignOrder.id == req.campaign_order_id))
            ord_obj = res_ord.scalar_one_or_none()
            if ord_obj:
                adv_id = ord_obj.advertiser_id

        if not adv_id:
            raise ValueError("Se requiere advertiser_id o campaign_order_id válido.")

        results = await CommunicationManager.dispatch_communication(
            db=db,
            advertiser_id=adv_id,
            communication_type=req.communication_type,
            channels=req.channels,
            campaign_order_id=req.campaign_order_id,
            custom_data=req.custom_data,
            actor_id=current_user.id,
            actor_email=current_user.email
        )
        return {
            "success": True,
            "dispatches": results,
            "message": f"Comunicado {req.communication_type.value} despachado exitosamente."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al enviar comunicación: {str(e)}"
        )


@router.post("/batch/weekly")
async def dispatch_all_weekly_reports(
    req: BatchWeeklyReportsRequest,
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Dispara automáticamente los reportes semanales de ejecución para todas las campañas activas.
    """
    stmt = select(CampaignOrder).where(CampaignOrder.status == CampaignStatus.ACTIVE)
    res = await db.execute(stmt)
    active_orders = res.scalars().all()

    dispatched_count = 0
    errors = []

    for order in active_orders:
        try:
            await CommunicationManager.dispatch_communication(
                db=db,
                advertiser_id=order.advertiser_id,
                communication_type=CommunicationType.WEEKLY_REPORT,
                channels=req.channels,
                campaign_order_id=order.id,
                actor_id=current_user.id,
                actor_email=current_user.email
            )
            dispatched_count += 1
        except Exception as ex:
            errors.append({"order_id": str(order.id), "error": str(ex)})

    return {
        "success": True,
        "total_active_campaigns": len(active_orders),
        "dispatched_successfully": dispatched_count,
        "errors": errors
    }


@router.get("/history/{order_id}")
async def get_order_communication_history(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna el historial completo de mensajes enviados a una campaña por Email, WhatsApp y SMS.
    """
    stmt = (
        select(ClientCommunication)
        .where(ClientCommunication.campaign_order_id == order_id)
        .order_by(desc(ClientCommunication.created_at))
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    return [
        {
            "id": str(r.id),
            "type": r.communication_type.value,
            "channel": r.channel.value,
            "recipient": r.recipient,
            "subject": r.subject,
            "status": r.status.value,
            "provider_message_id": r.provider_message_id,
            "sent_at": r.sent_at.isoformat() if r.sent_at else None,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]


@router.get("/overview")
async def get_communications_overview(
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Métricas consolidadas de comunicaciones enviadas por canal.
    """
    stmt = select(ClientCommunication)
    res = await db.execute(stmt)
    all_comms = res.scalars().all()

    by_channel = {"EMAIL": 0, "WHATSAPP": 0, "SMS": 0}
    by_type = {}

    for c in all_comms:
        by_channel[c.channel.value] = by_channel.get(c.channel.value, 0) + 1
        by_type[c.communication_type.value] = by_type.get(c.communication_type.value, 0) + 1

    return {
        "total_communications_sent": len(all_comms),
        "by_channel": by_channel,
        "by_type": by_type
    }
