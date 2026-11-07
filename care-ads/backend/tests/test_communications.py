"""
Pruebas Automatizadas del Módulo de Comunicaciones y Reportes al Cliente
(Email, WhatsApp, SMS, Auditoría y Renovaciones).
"""

import pytest
from httpx import AsyncClient
from app.models import UserRole, CommunicationType, CommunicationChannel


@pytest.mark.asyncio
async def test_communications_multichannel_flow(client: AsyncClient):
    """
    Verifica el flujo completo de envío multicanal:
    1. Login como Super Admin
    2. Crear una orden de prueba para obtener advertiser_id y campaign_order_id
    3. Enviar comunicado multicanal (Email, WhatsApp, SMS)
    4. Consultar historial de mensajes y verificar persistencia en PostgreSQL
    5. Disparar batch de reportes semanales
    """
    # 1. Login Super Admin
    res_login = await client.post("/api/v1/auth/login", json={
        "email": "admin@caretechservices.com",
        "password": "CareTech2026!AdminSecured"
    })
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Crear una campaña para tener un anunciante y orden reales
    res_create = await client.post("/api/v1/campaigns/create", json={
        "company_name": "Seguros del Valle S.A.",
        "advertiser_email": "contacto@segurosdelvalle.com.co",
        "advertiser_phone": "+573001234567",
        "brand_name": "Seguros del Valle",
        "headline": "Pólizas de Salud 24/7",
        "description": "Cobertura médica integral familiar",
        "web_url": "https://segurosdelvalle.com.co",
        "game_id": "solitario",
        "placement_position": "top",
        "plan_id": "frecuente",
        "accept_terms": True
    }, headers=headers)
    assert res_create.status_code == 201
    order_data = res_create.json()["campaign"]
    order_id = order_data["id"]

    # Consultar detalle para obtener advertiser_id
    from app.core.database import AsyncSessionLocal
    from app.models import CampaignOrder
    from sqlalchemy import select
    import uuid

    async with AsyncSessionLocal() as s:
        res_o = await s.execute(select(CampaignOrder).where(CampaignOrder.id == uuid.UUID(order_id)))
        order_obj = res_o.scalar_one()
        adv_id = str(order_obj.advertiser_id)

    # 3. Enviar comunicado multicanal (Reporte Semanal)
    res_send = await client.post("/api/v1/communications/send", json={
        "advertiser_id": adv_id,
        "campaign_order_id": order_id,
        "communication_type": "WEEKLY_REPORT",
        "channels": ["EMAIL", "WHATSAPP", "SMS"],
        "custom_data": {
            "impressions": 2840,
            "seconds": 170400
        }
    }, headers=headers)
    assert res_send.status_code == 200
    send_data = res_send.json()
    assert send_data["success"] is True
    assert len(send_data["dispatches"]) == 3  # Email, WhatsApp, SMS

    # 4. Consultar historial de comunicaciones para la orden
    res_hist = await client.get(f"/api/v1/communications/history/{order_id}", headers=headers)
    assert res_hist.status_code == 200
    history = res_hist.json()
    assert len(history) == 3
    channels_received = {h["channel"] for h in history}
    assert channels_received == {"EMAIL", "WHATSAPP", "SMS"}

    # 5. Enviar aviso de renovación
    res_renew = await client.post("/api/v1/communications/send", json={
        "advertiser_id": adv_id,
        "campaign_order_id": order_id,
        "communication_type": "RENEWAL_NOTICE",
        "channels": ["WHATSAPP", "EMAIL"]
    }, headers=headers)
    assert res_renew.status_code == 200

    # 6. Consultar resumen global
    res_overview = await client.get("/api/v1/communications/overview", headers=headers)
    assert res_overview.status_code == 200
    overview = res_overview.json()
    assert overview["total_communications_sent"] >= 5
    assert overview["by_channel"]["EMAIL"] >= 2
    assert overview["by_channel"]["WHATSAPP"] >= 2
    assert overview["by_channel"]["SMS"] >= 1
