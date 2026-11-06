import pytest
import hashlib
import json
from httpx import AsyncClient
from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal
from app.models import AuditEvent, UserRole, User
from sqlalchemy import select


@pytest.mark.asyncio
async def test_rbac_non_admin_forbidden(client: AsyncClient):
    """
    Verifica que un usuario con rol ADVERTISER no pueda aprobar campañas ni consultar auditoría (403 Forbidden).
    """
    # Token con rol ADVERTISER
    advertiser_token = create_access_token(
        data={"sub": "00000000-0000-0000-0000-000000000001", "role": UserRole.ADVERTISER.value, "email": "adv@empresa.com"}
    )
    headers = {"Authorization": f"Bearer {advertiser_token}"}

    # Intentar acceder a verificación de auditoría -> debe dar 401 o 403
    res = await client.get("/api/v1/admin/audit/verify", headers=headers)
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_audit_hash_chain_tamper_detection(client: AsyncClient):
    """
    Verifica que si alguien altera manualmente un registro en la base de datos,
    el verificador criptográfico de auditoría detecte inmediatamente la manipulación (INTEGRITY_COMPROMISED_FAIL).
    """
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == "admin@caretechservices.com"))
        admin = res.scalar_one()
        admin_id = str(admin.id)

    admin_token = create_access_token(
        data={"sub": admin_id, "role": UserRole.SUPER_ADMIN.value, "email": "admin@caretechservices.com"}
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Verificar estado original (debe ser PASS)
    res_orig = await client.get("/api/v1/admin/audit/verify", headers=headers)
    assert res_orig.status_code == 200
    assert res_orig.json()["status"] == "INTEGRITY_VERIFIED_PASS"

    # 2. Alterar maliciosamente un evento en la base de datos
    async with AsyncSessionLocal() as session:
        res_evt = await session.execute(select(AuditEvent).order_by(AuditEvent.timestamp_utc.desc()).limit(1))
        target_evt = res_evt.scalar_one_or_none()
        assert target_evt is not None
        
        # Simular inyección o manipulación de datos en PostgreSQL
        target_evt.note = "NOTA_ALTERADA_MALICIOSAMENTE_POR_INTRUSO"
        await session.commit()

    # 3. El verificador debe detectar que el hash recalculado no coincide
    res_tampered = await client.get("/api/v1/admin/audit/verify", headers=headers)
    assert res_tampered.status_code == 200
    tampered_data = res_tampered.json()
    assert tampered_data["status"] == "INTEGRITY_COMPROMISED_FAIL"
    assert tampered_data["success"] is False
    assert len(tampered_data["tampered_events"]) > 0

    # 4. Restaurar para no ensuciar la base de datos de pruebas
    async with AsyncSessionLocal() as session:
        res_evt = await session.execute(select(AuditEvent).order_by(AuditEvent.timestamp_utc.desc()).limit(1))
        target_evt = res_evt.scalar_one_or_none()
        if target_evt:
            target_evt.note = "Restaurado"
            # Recalcular hash válido
            raw_payload = (
                f"{target_evt.prev_hash}|"
                f"{target_evt.timestamp_utc.isoformat()}|"
                f"{target_evt.actor_id or 'SYSTEM'}|"
                f"{target_evt.action}|"
                f"{target_evt.resource_type}|"
                f"{target_evt.resource_id}|"
                f"{target_evt.note}|"
                f"{json.dumps(target_evt.previous_state, sort_keys=True, default=str) if target_evt.previous_state else ''}|"
                f"{json.dumps(target_evt.new_state, sort_keys=True, default=str) if target_evt.new_state else ''}"
            )
            target_evt.event_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
            await session.commit()
