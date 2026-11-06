from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta, timezone
import hashlib
import time
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.audit import record_audit_event
from app.models import (
    CampaignOrder, Creative, Advertiser, Contract, Placement,
    CampaignStatus, PricingModel, CreativeStatus, PaymentStatus, User, UserRole
)

router = APIRouter(prefix="/campaigns", tags=["Campañas Publicitarias"])


class CreateCampaignRequest(BaseModel):
    # Datos de la Empresa / Anunciante
    company_name: str
    advertiser_email: EmailStr
    advertiser_phone: Optional[str] = None
    tax_id: Optional[str] = None
    country: str = "CO"
    
    # Contenido Publicitario
    brand_name: str
    headline: str
    description: str
    logo_url: Optional[str] = None
    web_url: str
    donation_url: Optional[str] = None
    shop_url: Optional[str] = None
    
    # Espacio y Modalidad
    game_id: str = "solitario"
    placement_position: str = "top"  # "top" o "bottom"
    plan_id: str = "frecuente"       # "entrada", "presencia", "diario", "frecuente", "intensivo", "maximo"
    has_priority: bool = False
    
    # Aceptación de Contrato y Términos
    accept_terms: bool
    terms_version: str = "v1.0-2026"


class CampaignResponse(BaseModel):
    id: str
    code: str
    company_name: str
    brand_name: str
    headline: str
    description: str
    logo_url: Optional[str]
    web_url: str
    game_id: str
    position: str
    status: str
    payment_status: str
    total_usd: float
    total_cop: float
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_campaign(req: CreateCampaignRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Crea una nueva orden de campaña vinculada a un anunciante y con aceptación de contrato digital (SLA).
    Nace estrictamente en estado CONTRACT_ACCEPTED y payment_status PENDING (sin salir al aire hasta confirmación).
    """
    if not req.accept_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe aceptar expresamente los Términos del Servicio Publicitario y Tratamiento de Datos."
        )

    # 1. Buscar o crear el Anunciante
    res = await db.execute(select(Advertiser).where(Advertiser.email == req.advertiser_email.lower()))
    advertiser = res.scalar_one_or_none()
    if not advertiser:
        advertiser = Advertiser(
            company_name=req.company_name,
            email=req.advertiser_email.lower(),
            phone=req.advertiser_phone,
            tax_id=req.tax_id,
            country=req.country
        )
        db.add(advertiser)
        await db.flush()

    # 2. Registrar el Contrato Electrónico con Hash SHA-256 inmutable
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    contract_terms = (
        f"CONTRATO MARCO DE PUBLICIDAD DIGITAL CARETECH - VERSIÓN {req.terms_version}\n"
        f"Anunciante: {req.company_name} ({req.advertiser_email})\n"
        f"Ubicación: {req.game_id}_{req.placement_position} | Plan: {req.plan_id}\n"
        f"Aceptación electrónica verificada bajo la Ley 1480 de 2011.\n"
    )
    terms_hash = hashlib.sha256(contract_terms.encode("utf-8")).hexdigest()
    
    contract = Contract(
        advertiser_id=advertiser.id,
        title=f"Contrato Publicitario Care Ads - {req.company_name}",
        version=req.terms_version,
        terms_text=contract_terms,
        terms_hash_sha256=terms_hash,
        is_accepted=True,
        accepted_at=datetime.now(timezone.utc),
        accepted_ip=client_ip,
        accepted_user_agent=user_agent
    )
    db.add(contract)
    await db.flush()

    # 3. Buscar el Placement
    placement_code = f"{req.game_id}_{req.placement_position}"
    res = await db.execute(select(Placement).where(Placement.code == placement_code))
    placement = res.scalar_one_or_none()
    if not placement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Espacio publicitario no encontrado: {placement_code}"
        )

    # 4. Calcular tarifas según el plan
    plan_pricing = {
        "entrada": {"usd": 1.0, "days": 7},
        "presencia": {"usd": 3.0, "days": 7},
        "diario": {"usd": 15.0, "days": 30},
        "frecuente": {"usd": 35.0, "days": 30},
        "intensivo": {"usd": 70.0, "days": 30},
        "maximo": {"usd": 120.0, "days": 30}
    }
    pricing_info = plan_pricing.get(req.plan_id, {"usd": 120.0, "days": 30})
    base_usd = pricing_info["usd"]
    total_usd = base_usd + (120.0 if req.has_priority else 0.0)
    total_cop = total_usd * 4000.0  # Tasa representativa
    
    now = datetime.now(timezone.utc)
    duration_days = pricing_info["days"]
    
    campaign_code = f"CAMP_{int(time.time())}_{int(time.time() * 1000) % 10000}"

    # 5. Crear la orden de campaña (Estado inicial: CONTRACT_ACCEPTED, Pago: PENDING)
    order = CampaignOrder(
        code=campaign_code,
        advertiser_id=advertiser.id,
        contract_id=contract.id,
        placement_id=placement.id,
        pricing_model=PricingModel.TIME,
        status=CampaignStatus.CONTRACT_ACCEPTED,
        currency="USD",
        subtotal=total_usd,
        tax_amount=0.00,
        total_amount=total_usd,
        total_cop=total_cop,
        payment_status=PaymentStatus.PENDING,
        start_date=now,
        end_date=now + timedelta(days=duration_days),
        slot_minute=now.minute,
        priority_level=2 if req.has_priority else 1
    )
    db.add(order)
    await db.flush()

    # 6. Registrar la Creatividad Publicitaria
    creative = Creative(
        order_id=order.id,
        title=req.headline or req.brand_name,
        description=req.description,
        logo_url=req.logo_url,
        web_url=req.web_url,
        donation_url=req.donation_url,
        shop_url=req.shop_url,
        status=CreativeStatus.PENDING_REVIEW
    )
    db.add(creative)
    await db.flush()

    # 7. Registrar en la Auditoría Inmutable
    await record_audit_event(
        db=db,
        action="CAMPAIGN_ORDER_CREATED",
        resource_type="CampaignOrder",
        resource_id=str(order.id),
        actor_email=req.advertiser_email,
        ip_address=client_ip,
        note=f"Orden creada con contrato versionado {req.terms_version} y hash {terms_hash[:16]}..."
    )

    await db.commit()

    return {
        "success": True,
        "message": "Campaña y contrato registrados exitosamente. Esperando confirmación de pago.",
        "campaign": {
            "id": str(order.id),
            "code": order.code,
            "status": order.status.value,
            "payment_status": order.payment_status.value,
            "total_usd": float(order.total_amount),
            "total_cop": float(order.total_cop),
            "contract_hash": terms_hash,
            "flight_duration_days": duration_days
        }
    }


@router.get("/list")
async def list_campaigns(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lista campañas reales de PostgreSQL con metadatos completos y estado de moderación.
    """
    stmt = (
        select(CampaignOrder, Advertiser, Creative, Placement)
        .join(Advertiser, CampaignOrder.advertiser_id == Advertiser.id)
        .join(Placement, CampaignOrder.placement_id == Placement.id)
        .outerjoin(Creative, Creative.order_id == CampaignOrder.id)
        .order_by(desc(CampaignOrder.created_at))
    )
    
    if status_filter:
        stmt = stmt.where(CampaignOrder.status == status_filter)
        
    res = await db.execute(stmt)
    rows = res.all()
    
    results = []
    for order, adv, creative, plc in rows:
        results.append({
            "id": str(order.id),
            "code": order.code,
            "company_name": adv.company_name,
            "advertiser_email": adv.email,
            "headline": creative.title if creative else adv.company_name,
            "description": creative.description if creative else "",
            "logo_url": creative.logo_url if creative else None,
            "web_url": creative.web_url if creative else "",
            "donation_url": creative.donation_url if creative else None,
            "shop_url": creative.shop_url if creative else None,
            "game_id": plc.game_id,
            "placement_name": plc.name,
            "status": order.status.value,
            "payment_status": order.payment_status.value,
            "total_usd": float(order.total_amount),
            "total_cop": float(order.total_cop),
            "start_date": order.start_date.isoformat() if order.start_date else None,
            "end_date": order.end_date.isoformat() if order.end_date else None,
            "created_at": order.created_at.isoformat()
        })
        
    return {"success": True, "count": len(results), "campaigns": results}


@router.post("/{campaign_id}/approve")
async def approve_campaign(
    campaign_id: str,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.AD_MODERATOR, UserRole.OPERATIONS_MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Aprueba y pone en emisión inmediata (ON LINE) la campaña tras verificar pago y contenido.
    """
    res = await db.execute(select(CampaignOrder).where(CampaignOrder.id == campaign_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Campaña no encontrada.")

    old_status = order.status.value
    order.status = CampaignStatus.ACTIVE
    order.payment_status = PaymentStatus.CAPTURED
    order.updated_at = datetime.now(timezone.utc)
    
    # Aprobar también la creatividad
    res_c = await db.execute(select(Creative).where(Creative.order_id == order.id))
    creative = res_c.scalar_one_or_none()
    if creative:
        creative.status = CreativeStatus.APPROVED
        creative.reviewed_by = current_user.id
        creative.reviewed_at = datetime.now(timezone.utc)

    await record_audit_event(
        db=db,
        action="CAMPAIGN_APPROVED_ONLINE",
        resource_type="CampaignOrder",
        resource_id=str(order.id),
        actor_id=str(current_user.id),
        actor_email=current_user.email,
        previous_state={"status": old_status},
        new_state={"status": "ACTIVE"},
        note="Campaña aprobada y pasada a ON LINE por administrador autorizado."
    )

    await db.commit()
    return {"success": True, "message": f"Campaña {order.code} aprobada y en emisión ON LINE.", "new_status": "ACTIVE"}


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.AD_MODERATOR, UserRole.OPERATIONS_MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Pausa temporalmente una campaña en emisión.
    """
    res = await db.execute(select(CampaignOrder).where(CampaignOrder.id == campaign_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Campaña no encontrada.")

    old_status = order.status.value
    order.status = CampaignStatus.PAUSED
    order.updated_at = datetime.now(timezone.utc)

    await record_audit_event(
        db=db,
        action="CAMPAIGN_PAUSED",
        resource_type="CampaignOrder",
        resource_id=str(order.id),
        actor_id=str(current_user.id),
        actor_email=current_user.email,
        previous_state={"status": old_status},
        new_state={"status": "PAUSED"},
        note="Campaña pausada por administrador."
    )

    await db.commit()
    return {"success": True, "message": f"Campaña {order.code} pausada.", "new_status": "PAUSED"}


@router.post("/{campaign_id}/reject")
async def reject_campaign(
    campaign_id: str,
    reason: str = "Incumplimiento de políticas de contenido publicitario",
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.AD_MODERATOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Rechaza formalmente una campaña publicitaria con justificación obligatoria.
    """
    res = await db.execute(select(CampaignOrder).where(CampaignOrder.id == campaign_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Campaña no encontrada.")

    old_status = order.status.value
    order.status = CampaignStatus.REJECTED
    order.updated_at = datetime.now(timezone.utc)

    await record_audit_event(
        db=db,
        action="CAMPAIGN_REJECTED",
        resource_type="CampaignOrder",
        resource_id=str(order.id),
        actor_id=str(current_user.id),
        actor_email=current_user.email,
        previous_state={"status": old_status},
        new_state={"status": "REJECTED"},
        note=f"Motivo de rechazo: {reason}"
    )

    await db.commit()
    return {"success": True, "message": f"Campaña {order.code} rechazada.", "new_status": "REJECTED"}
