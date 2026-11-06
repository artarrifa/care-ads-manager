import hashlib
import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import (
    CampaignOrder, DeliveryEvent, AuditEvent, User, UserRole, 
    CampaignStatus, PaymentStatus
)

router = APIRouter(prefix="/admin", tags=["Administración, Finanzas & Auditoría"])


@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(require_roles([
        UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.AUDITOR
    ])),
    db: AsyncSession = Depends(get_db)
):
    """
    Entrega métricas ejecutivas calculadas en tiempo real directamente desde PostgreSQL:
    - Ingresos totales contratados y cobrados.
    - Conteo de campañas por estado.
    - Impresiones visibles y clics totales.
    - CTR promedio.
    """
    # 1. Conteo de Campañas
    res = await db.execute(select(func.count(CampaignOrder.id)))
    total_campaigns = res.scalar() or 0

    res = await db.execute(select(func.count(CampaignOrder.id)).where(CampaignOrder.status == CampaignStatus.ACTIVE))
    active_campaigns = res.scalar() or 0

    res = await db.execute(select(func.count(CampaignOrder.id)).where(CampaignOrder.status == CampaignStatus.CONTRACT_ACCEPTED))
    pending_campaigns = res.scalar() or 0

    # 2. Finanzas (Ingresos USD y COP)
    res = await db.execute(select(func.sum(CampaignOrder.total_amount)))
    total_usd = float(res.scalar() or 0.0)

    res = await db.execute(select(func.sum(CampaignOrder.total_cop)))
    total_cop = float(res.scalar() or 0.0)

    # 3. Telemetría de Eventos (Impresiones y Clics)
    res = await db.execute(select(func.count(DeliveryEvent.id)))
    total_events = res.scalar() or 0

    res = await db.execute(
        select(func.count(DeliveryEvent.id)).where(DeliveryEvent.event_type == "ad_viewable")
    )
    impressions = res.scalar() or 0

    res = await db.execute(
        select(func.count(DeliveryEvent.id)).where(
            DeliveryEvent.event_type.in_(["ad_click", "ad_donation_click", "ad_shop_click"])
        )
    )
    total_clicks = res.scalar() or 0

    ctr = round((total_clicks / impressions * 100), 2) if impressions > 0 else 0.0

    return {
        "success": True,
        "metrics": {
            "campaigns": {
                "total": total_campaigns,
                "active_online": active_campaigns,
                "pending_review": pending_campaigns
            },
            "finance": {
                "total_contracted_usd": total_usd,
                "total_contracted_cop": total_cop,
                "currency": "USD"
            },
            "delivery": {
                "impressions_valid_iab": impressions,
                "total_clicks": total_clicks,
                "ctr_percentage": ctr,
                "total_events": total_events
            }
        }
    }


@router.get("/audit/verify")
async def verify_audit_chain(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.AUDITOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifica criptográficamente la integridad de la cadena de auditoría (Hash Chaining).
    Detecta si alguna fila en audit_events fue alterada o borrada manualmente.
    """
    res = await db.execute(select(AuditEvent).order_by(AuditEvent.timestamp_utc.asc()))
    events = res.scalars().all()

    if not events:
        return {"success": True, "status": "EMPTY", "message": "Cadena de auditoría sin eventos registrados."}

    last_hash = "GENESIS_HASH_CARE_ADS_2026"
    tampered_indices = []

    for idx, evt in enumerate(events):
        # 1. Verificar encadenamiento con el hash previo
        if evt.prev_hash != last_hash:
            tampered_indices.append({"index": idx, "id": str(evt.id), "reason": "Hash previo no coincide"})
        
        # 2. Recalcular el hash del evento actual
        raw_payload = (
            f"{evt.prev_hash}|"
            f"{evt.timestamp_utc.isoformat()}|"
            f"{evt.actor_id or 'SYSTEM'}|"
            f"{evt.action}|"
            f"{evt.resource_type}|"
            f"{evt.resource_id}|"
            f"{evt.note or ''}|"
            f"{json.dumps(evt.previous_state, sort_keys=True, default=str) if evt.previous_state else ''}|"
            f"{json.dumps(evt.new_state, sort_keys=True, default=str) if evt.new_state else ''}"
        )
        calculated_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

        if calculated_hash != evt.event_hash:
            tampered_indices.append({"index": idx, "id": str(evt.id), "reason": "Hash del evento alterado"})

        last_hash = evt.event_hash

    is_valid = len(tampered_indices) == 0

    return {
        "success": is_valid,
        "status": "INTEGRITY_VERIFIED_PASS" if is_valid else "INTEGRITY_COMPROMISED_FAIL",
        "total_events_checked": len(events),
        "tampered_events": tampered_indices
    }
