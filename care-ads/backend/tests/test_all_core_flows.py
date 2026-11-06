import pytest
import pyotp
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Verifica que el servicio y API V1 estén saludables."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "Care Ads Manager" in data["service"]


@pytest.mark.asyncio
async def test_auth_login_and_2fa_workflow(client: AsyncClient):
    """Prueba flujo de login con contraseña y activación/verificación de 2FA."""
    # Resetear MFA del admin para idempotencia de la prueba
    from app.core.database import AsyncSessionLocal
    from app.models import User
    from sqlalchemy import select

    async with AsyncSessionLocal() as s:
        res_u = await s.execute(select(User).where(User.email == "admin@caretechservices.com"))
        u = res_u.scalar_one_or_none()
        if u:
            u.mfa_enabled = False
            await s.commit()

    # 1. Login inicial con contraseña
    res = await client.post("/api/v1/auth/login", json={
        "email": "admin@caretechservices.com",
        "password": "CareTech2026!AdminSecured"
    })
    assert res.status_code == 200
    data = res.json()
    token = data["access_token"]
    assert token is not None
    assert data["mfa_required"] is False

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Iniciar configuración de 2FA
    res_mfa = await client.post("/api/v1/auth/mfa/setup", headers=headers)
    assert res_mfa.status_code == 200
    mfa_data = res_mfa.json()
    secret = mfa_data["secret"]
    assert secret is not None
    assert mfa_data["qr_code_base64"].startswith("data:image/png;base64,")

    # 3. Generar código TOTP válido con pyotp y activar 2FA
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    res_verify = await client.post("/api/v1/auth/mfa/verify", headers=headers, json={"code": valid_code})
    assert res_verify.status_code == 200
    assert res_verify.json()["success"] is True

    # 4. Intentar login sin código 2FA -> debe requerir mfa_required = True
    res_login_mfa = await client.post("/api/v1/auth/login", json={
        "email": "admin@caretechservices.com",
        "password": "CareTech2026!AdminSecured"
    })
    assert res_login_mfa.status_code == 200
    assert res_login_mfa.json()["mfa_required"] is True

    # 5. Login enviando código 2FA válido -> acceso completo exitoso
    res_full_login = await client.post("/api/v1/auth/login", json={
        "email": "admin@caretechservices.com",
        "password": "CareTech2026!AdminSecured",
        "totp_code": totp.now()
    })
    assert res_full_login.status_code == 200
    assert res_full_login.json()["access_token"] is not None


@pytest.mark.asyncio
async def test_campaign_contract_and_lifecycle(client: AsyncClient):
    """
    Prueba que:
    1. Se rechaza creación de campaña si no se aceptan los términos contractuales.
    2. Al crearse, nace en CONTRACT_ACCEPTED y pago PENDING (sin salir al aire).
    3. Moderador/Admin la aprueba formalmente y pasa a ACTIVE (ON LINE).
    4. Moderador la pausa.
    """
    # 1. Rechazo sin aceptar términos
    res_bad = await client.post("/api/v1/campaigns/create", json={
        "company_name": "Empresa Sin Contrato",
        "advertiser_email": "test@sincontrato.com",
        "brand_name": "Test",
        "headline": "Test",
        "description": "Test",
        "web_url": "https://test.com",
        "game_id": "solitario",
        "placement_position": "top",
        "plan_id": "frecuente",
        "has_priority": False,
        "accept_terms": False
    })
    assert res_bad.status_code == 400

    # 2. Creación válida con contrato aceptado
    res_create = await client.post("/api/v1/campaigns/create", json={
        "company_name": "Clínica Vida Plena SAS",
        "advertiser_email": "contacto@vidaplena.com",
        "advertiser_phone": "+573105558899",
        "tax_id": "900.876.543-1",
        "country": "CO",
        "brand_name": "Clínica Vida Plena",
        "headline": "Atención Médica Inmediata",
        "description": "Consultas familiares sin esperas ni copagos adicionales.",
        "logo_url": "https://caretechservices.com/assets/logo.png",
        "web_url": "https://vidaplena.com",
        "game_id": "solitario",
        "placement_position": "top",
        "plan_id": "frecuente",
        "has_priority": False,
        "accept_terms": True,
        "terms_version": "v1.0-2026"
    })
    assert res_create.status_code == 201
    camp_data = res_create.json()["campaign"]
    order_id = camp_data["id"]
    assert camp_data["status"] == "CONTRACT_ACCEPTED"
    assert camp_data["payment_status"] == "PENDING"
    assert camp_data["total_usd"] == 35.0
    assert len(camp_data["contract_hash"]) == 64

    # 3. Obtener ID del admin para generar token de autorización
    from app.core.database import AsyncSessionLocal
    from app.models import User
    from sqlalchemy import select
    from app.core.security import create_access_token

    async with AsyncSessionLocal() as s:
        res_u = await s.execute(select(User).where(User.email == "admin@caretechservices.com"))
        admin_u = res_u.scalar_one()
        admin_uuid = str(admin_u.id)

    token = create_access_token(data={"sub": admin_uuid, "role": "SUPER_ADMIN", "email": "admin@caretechservices.com"})
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Aprobar la campaña y pasarla a ON LINE
    res_appr = await client.post(f"/api/v1/campaigns/{order_id}/approve", headers=headers)
    assert res_appr.status_code == 200
    assert res_appr.json()["new_status"] == "ACTIVE"

    # 5. Pausar la campaña
    res_pause = await client.post(f"/api/v1/campaigns/{order_id}/pause", headers=headers)
    assert res_pause.status_code == 200
    assert res_pause.json()["new_status"] == "PAUSED"


@pytest.mark.asyncio
async def test_delivery_engine_and_audit_integrity(client: AsyncClient):
    """
    Prueba que:
    1. El motor de entrega entrega un anuncio válido.
    2. La cadena de auditoría inmutable es verificada y pasa integridad criptográfica.
    """
    # 1. Petición de anuncio al Ad-Server
    res_ad = await client.get("/api/v1/delivery/ad?game=solitario&placement=top")
    assert res_ad.status_code == 200
    ad_data = res_ad.json()
    assert "headline" in ad_data
    assert "webUrl" in ad_data
    assert "slotMinute" in ad_data

    # 2. Ingesta de evento de impresión IAB
    res_evt = await client.post("/api/v1/delivery/events/batch", json=[{
        "decision_id": ad_data.get("decisionId"),
        "event_type": "ad_viewable",
        "viewable_duration_ms": 1250,
        "is_offline_sync": False
    }])
    assert res_evt.status_code == 200
    assert res_evt.json()["processed"] == 1

    # 3. Verificación de integridad criptográfica de auditoría
    from app.core.database import AsyncSessionLocal
    from app.models import User
    from sqlalchemy import select
    from app.core.security import create_access_token

    async with AsyncSessionLocal() as s:
        res_u = await s.execute(select(User).where(User.email == "admin@caretechservices.com"))
        admin_u = res_u.scalar_one()
        admin_uuid = str(admin_u.id)

    token = create_access_token(data={"sub": admin_uuid, "role": "SUPER_ADMIN", "email": "admin@caretechservices.com"})
    headers = {"Authorization": f"Bearer {token}"}

    res_audit = await client.get("/api/v1/admin/audit/verify", headers=headers)
    assert res_audit.status_code == 200
    audit_res = res_audit.json()
    assert audit_res["status"] == "INTEGRITY_VERIFIED_PASS"
    assert audit_res["success"] is True
    assert audit_res["total_events_checked"] > 0
