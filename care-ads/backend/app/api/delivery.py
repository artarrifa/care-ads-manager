from fastapi import APIRouter, Depends, Query, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone
from app.core.database import get_db
from app.models import Placement, CampaignOrder, Creative, AdDecision, DeliveryEvent, CampaignStatus

router = APIRouter(prefix="/delivery", tags=["Motor de Entrega Publicitaria (Ad-Server)"])


class DeliveryEventPayload(BaseModel):
    decision_id: Optional[str] = None
    campaign_id: Optional[str] = None
    event_type: str  # "ad_viewable", "ad_click", "ad_donation_click", "ad_shop_click"
    viewable_duration_ms: int = 0
    is_offline_sync: bool = False
    timestamp: Optional[int] = None


@router.get("/ad")
async def get_ad(
    game: str = Query(..., description="ID del juego, ej: solitario"),
    placement: str = Query("top", description="Posición del banner: top o bottom"),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Motor de Decisión Publicitaria de Alta Velocidad:
    1. Verifica existencia del placement.
    2. Filtra campañas elegibles con status: 'ACTIVE'.
    3. Valida caducidad de vigencia (endDate). Si ya expiró, la marca COMPLETED automáticamente.
    4. Selecciona anuncio por rotación horaria determinista.
    5. Registra la decisión en ad_decisions y entrega el banner.
    """
    placement_code = f"{game}_{placement}"
    res = await db.execute(select(Placement).where(Placement.code == placement_code))
    plc = res.scalar_one_or_none()
    
    if not plc or not plc.is_active:
        return _get_fallback_ad(game, placement)

    now = datetime.now(timezone.utc)
    current_minute = now.minute

    # Consultar campañas activas para este placement
    stmt = (
        select(CampaignOrder, Creative)
        .join(Creative, Creative.order_id == CampaignOrder.id)
        .where(
            and_(
                CampaignOrder.placement_id == plc.id,
                CampaignOrder.status == CampaignStatus.ACTIVE
            )
        )
    )
    res = await db.execute(stmt)
    rows = res.all()

    active_matched = []
    for order, creative in rows:
        # Control de Caducidad Automática (Flight Date Control)
        if order.end_date and order.end_date < now:
            order.status = CampaignStatus.COMPLETED
            continue
        if order.start_date and order.start_date > now:
            continue
        active_matched.append((order, creative))

    if not active_matched:
        # Entregar anuncio institucional fallback
        return _get_fallback_ad(game, placement)

    # Rotación horaria determinista
    selected_index = current_minute % len(active_matched)
    selected_order, selected_creative = active_matched[selected_index]

    client_ip = request.client.host if request and request.client else "unknown"
    ua = request.headers.get("user-agent", "mobile") if request else "mobile"

    # Registrar decisión publicitaria
    decision = AdDecision(
        placement_id=plc.id,
        order_id=selected_order.id,
        creative_id=selected_creative.id,
        decision_time=now,
        client_ip=client_ip,
        ua_class="mobile" if "Mobile" in ua else "desktop",
        is_fallback=False
    )
    db.add(decision)
    await db.commit()

    return {
        "success": True,
        "decisionId": str(decision.id),
        "campaignId": selected_order.code,
        "brandName": selected_creative.title,
        "headline": selected_creative.title,
        "description": selected_creative.description,
        "logo": selected_creative.logo_url,
        "webUrl": selected_creative.web_url,
        "donationUrl": selected_creative.donation_url or "",
        "shopUrl": selected_creative.shop_url or "",
        "slotMinute": current_minute,
        "syncTime": int(now.timestamp())
    }


@router.post("/events/batch")
async def record_events_batch(
    events: List[DeliveryEventPayload],
    db: AsyncSession = Depends(get_db)
):
    """
    Ingesta por lotes de eventos telemétricos (impresiones visibles según estándar IAB, clics, interacciones).
    """
    count = 0
    now = datetime.now(timezone.utc)
    
    for evt in events:
        # Criterio IAB: Visible si estuvo al menos 1000ms continuo en pantalla
        is_iab_viewable = evt.viewable_duration_ms >= 1000 if evt.event_type == "ad_viewable" else False
        
        event_record = DeliveryEvent(
            decision_id=evt.decision_id if evt.decision_id else None,
            event_type=evt.event_type,
            is_viewable=is_iab_viewable,
            viewable_duration_ms=evt.viewable_duration_ms,
            timestamp_utc=now,
            is_offline_sync=evt.is_offline_sync
        )
        db.add(event_record)
        count += 1

    await db.commit()
    return {"success": True, "processed": count}


def _get_fallback_ad(game: str, placement: str):
    """Banners institucionales oficiales cuando no hay anunciantes privados activos."""
    if placement == "top":
        return {
            "success": True,
            "campaignId": "CAMP_CARE_LOYALTY",
            "brandName": "Care Loyalty",
            "headline": "Care Loyalty",
            "description": "Fidelidad digital en Apple & Google Wallet sin apps.",
            "logo": "https://caretechservices.com/assets/logo.png",
            "webUrl": "https://caretechservices.com/loyalty/",
            "donationUrl": "https://caretechservices.com/donar/",
            "shopUrl": "https://caretechservices.com/publicidad/",
            "slotMinute": datetime.now(timezone.utc).minute,
            "syncTime": int(datetime.now(timezone.utc).timestamp())
        }
    else:
        return {
            "success": True,
            "campaignId": "CAMP_CARE_INSTITUTIONAL",
            "brandName": "CareTech Services",
            "headline": "CareTech Services",
            "description": "Soluciones de software médico, teleasistencia y salud digital.",
            "logo": "https://caretechservices.com/assets/logo.png",
            "webUrl": "https://caretechservices.com",
            "donationUrl": "https://caretechservices.com/donar/",
            "shopUrl": "https://caretechservices.com/publicidad/",
            "slotMinute": datetime.now(timezone.utc).minute,
            "syncTime": int(datetime.now(timezone.utc).timestamp())
        }
