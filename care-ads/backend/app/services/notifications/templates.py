"""
Plantillas de Comunicación Multicanal (Email, WhatsApp, SMS)
para Care Ads Manager V1.0.
"""

from decimal import Decimal
from typing import Dict, Any


def render_weekly_report(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Genera el reporte de ejecución semanal con métricas IAB, segundos y estado de cumplimiento.
    """
    brand = data.get("brand_name", "Anunciante")
    order_code = data.get("order_code", "N/A")
    impressions = data.get("impressions", 0)
    seconds = data.get("seconds", 0)
    flight_end = data.get("flight_end", "N/A")
    audit_hash = data.get("contract_hash", "VERIFIED")[:16] + "..."
    portal_url = data.get("portal_url", "https://caretechservices.com/publicidad/portal/")
    
    # 1. WhatsApp Text
    whatsapp_text = (
        f"📊 *Reporte Semanal de Pauta — Care Ads*\n"
        f"Estimado equipo de *{brand}*:\n\n"
        f"Compartimos el rendimiento auditado de su campaña *{order_code}*:\n"
        f"👁️ *Impresiones IAB:* {impressions:,} visualizaciones válidas\n"
        f"⏱️ *Tiempo Efectivo Visible:* {seconds / 60:.1f} minutos ({seconds:,} s)\n"
        f"📅 *Vigencia hasta:* {flight_end}\n"
        f"🔒 *Sello Criptográfico:* `{audit_hash}`\n\n"
        f"🔗 *Consulte su reporte y certificado en vivo:* {portal_url}\n\n"
        f"— _CareTech Services SAS | Publicidad Transparente_"
    )

    # 2. SMS Text (Conciso <= 160 caracteres)
    sms_text = (
        f"CareTech Ads: {brand}, reporte semanal orden {order_code}: "
        f"{impressions:,} vistas validas ({seconds//60}m). "
        f"Ver certificado: {portal_url}"
    )[:160]

    # 3. HTML Email
    html_email = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #081325; color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ background: #0d1f3d; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 28px; }}
        .header {{ border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px; }}
        .brand {{ font-size: 20px; font-weight: 800; color: #06b6d4; }}
        .metric-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }}
        .metric-box {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 8px; text-align: center; }}
        .metric-val {{ font-size: 22px; font-weight: 700; color: #fff; }}
        .metric-lbl {{ font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-top: 4px; }}
        .btn {{ display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }}
        .hash-code {{ background: #040814; padding: 8px; font-family: monospace; font-size: 11px; color: #06b6d4; border-radius: 4px; word-break: break-all; margin-top: 10px; }}
        .footer {{ font-size: 12px; color: #64748b; margin-top: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">CARE ADS &bull; Reporte Semanal de Ejecución</div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Campaña: <strong>{order_code}</strong> | Cliente: <strong>{brand}</strong></div>
        </div>
        <p>Estimado anunciante, le presentamos el reporte consolidado de ejecución publicitaria correspondiente a la última semana:</p>
        
        <div class="metric-grid">
          <div class="metric-box">
            <div class="metric-val">{impressions:,}</div>
            <div class="metric-lbl">Impresiones IAB Validadas</div>
          </div>
          <div class="metric-box">
            <div class="metric-val">{seconds / 60:.1f} min</div>
            <div class="metric-lbl">Tiempo Efectivo en Pantalla</div>
          </div>
        </div>

        <p style="font-size: 13px; color: #cbd5e1;">Su pauta cumple estrictamente con el estándar IAB (≥50% del anuncio visible durante ≥1000ms en jugadores activos).</p>
        
        <div style="margin: 16px 0;">
          <div style="font-size: 12px; color: #94a3b8;">Hash Criptográfico de Integridad Contractual (SHA-256):</div>
          <div class="hash-code">{data.get("contract_hash", "SHA256-PENDING")}</div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="{portal_url}" class="btn">Abrir Portal y Descargar Certificado</a>
        </div>

        <div class="footer">
          CareTech Services SAS &bull; NIT 900.000.000-0 &bull; Soporte: publicidad@caretechservices.com<br>
          Bogotá D.C., Colombia
        </div>
      </div>
    </body>
    </html>
    """

    return {
        "subject": f"📊 Reporte Semanal de Pauta — Campaña {order_code} ({brand})",
        "email_html": html_email,
        "whatsapp_text": whatsapp_text,
        "sms_text": sms_text
    }


def render_renewal_notice(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Aviso de renovación antes de que expire la pauta, con descuento o prioridad garantizada.
    """
    brand = data.get("brand_name", "Anunciante")
    order_code = data.get("order_code", "N/A")
    flight_end = data.get("flight_end", "próximamente")
    renew_url = data.get("renew_url", "https://caretechservices.com/publicidad/?renew=" + order_code)

    whatsapp_text = (
        f"🔔 *Aviso de Próxima Renovación — Care Ads*\n"
        f"Estimado equipo de *{brand}*:\n\n"
        f"Su orden *{order_code}* finaliza el *{flight_end}*.\n"
        f"Para evitar que sus turnos de rotación sean asignados a lista de espera, "
        f"puede renovar su campaña ahora con prioridad garantizada:\n\n"
        f"👉 *Renovar en 1 Clic:* {renew_url}\n\n"
        f"Si requiere asesoría comercial o factura anticipada, responda directamente a este mensaje.\n"
        f"— _CareTech Services SAS_"
    )

    sms_text = (
        f"CareTech: {brand}, su pauta {order_code} vence {flight_end}. "
        f"Asegure su cupo y renueve aqui: {renew_url}"
    )[:160]

    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background:#081325; color:#fff; padding:24px;">
      <div style="max-width:550px; margin:0 auto; background:#0d1f3d; padding:28px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
        <h2 style="color:#f59e0b; margin-top:0;">🔔 Renovación de Campaña Publicitaria</h2>
        <p>Estimado equipo de <strong>{brand}</strong>,</p>
        <p>Le informamos que su orden <strong>{order_code}</strong> concluirá el próximo <strong>{flight_end}</strong>.</p>
        <p>Mantenga su presencia activa ante miles de jugadores diarios y preserve su slot preferencial en rotación:</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="{renew_url}" style="background:#10b981; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; font-size:15px; display:inline-block;">Renovar Pauta Publicitaria</a>
        </div>
        <p style="font-size:12px; color:#94a3b8;">CareTech Services SAS &bull; Departamento de Operaciones Publicitarias</p>
      </div>
    </body>
    </html>
    """

    return {
        "subject": f"🔔 Aviso de Renovación de Pauta — Campaña {order_code} ({brand})",
        "email_html": email_html,
        "whatsapp_text": whatsapp_text,
        "sms_text": sms_text
    }


def render_payment_invoice(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Confirmación de pago verificado y emisión de factura/recibo.
    """
    brand = data.get("brand_name", "Anunciante")
    order_code = data.get("order_code", "N/A")
    amount_usd = data.get("amount_usd", 0.0)
    payment_method = data.get("payment_method", "Pasarela")
    tx_ref = data.get("tx_ref", "TX-PENDING")

    whatsapp_text = (
        f"✅ *Pago Confirmado & Factura — Care Ads*\n"
        f"Estimado equipo de *{brand}*:\n\n"
        f"Hemos recibido satisfactoriamente su pago:\n"
        f"💵 *Monto:* ${amount_usd:.2f} USD\n"
        f"💳 *Medio:* {payment_method}\n"
        f"🔖 *Referencia:* `{tx_ref}`\n"
        f"📦 *Orden Asociada:* {order_code}\n\n"
        f"Su campaña ha sido autorizada para programación inmediata conforme al Contrato Marco.\n"
        f"— _CareTech Services SAS_"
    )

    sms_text = f"CareTech: Pago de ${amount_usd:.2f} USD recibido para la orden {order_code}. Ref: {tx_ref}. Gracias por su confianza."[:160]

    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background:#081325; color:#fff; padding:24px;">
      <div style="max-width:550px; margin:0 auto; background:#0d1f3d; padding:28px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
        <h2 style="color:#10b981; margin-top:0;">✅ Comprobante de Pago & Recibo</h2>
        <p>Estimado anunciante <strong>{brand}</strong>,</p>
        <p>Confirmamos la recepción efectiva de su pago para la campaña <strong>{order_code}</strong>:</p>
        <table style="width:100%; border-collapse:collapse; margin:18px 0; font-size:14px;">
          <tr><td style="padding:8px 0; color:#94a3b8;">Valor Pagado:</td><td style="text-align:right; font-weight:bold;">${amount_usd:.2f} USD</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">Medio de Pago:</td><td style="text-align:right;">{payment_method}</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">Referencia Transacción:</td><td style="text-align:right; font-family:monospace;">{tx_ref}</td></tr>
        </table>
        <p style="font-size:13px; color:#cbd5e1;">Su recibo fiscal y estado de cuenta quedan disponibles en su portal privado.</p>
      </div>
    </body>
    </html>
    """

    return {
        "subject": f"✅ Comprobante de Pago — Orden {order_code} (${amount_usd:.2f} USD)",
        "email_html": email_html,
        "whatsapp_text": whatsapp_text,
        "sms_text": sms_text
    }


def render_promo_offer(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Promoción de nuevos espacios, juegos o servicios complementarios.
    """
    brand = data.get("brand_name", "Anunciante")
    promo_title = data.get("promo_title", "Nuevo Espacio Publicitario Premium")
    promo_details = data.get("promo_details", "Ampliamos cobertura en nuevos juegos de mesa y puzles.")
    promo_url = data.get("promo_url", "https://caretechservices.com/publicidad/")

    whatsapp_text = (
        f"🚀 *Nuevos Servicios Publicitarios — Care Ads*\n"
        f"Hola *{brand}*:\n\n"
        f"Tenemos novedades para su marca en CareTech Services:\n"
        f"⭐ *{promo_title}*\n"
        f"{promo_details}\n\n"
        f"Aproveche tarifas preferenciales para anunciantes actuales:\n"
        f"👉 *Conozca los nuevos espacios:* {promo_url}\n\n"
        f"— _Equipo Comercial CareTech_"
    )

    sms_text = f"CareTech: {brand}, aproveche nuevas ubicaciones publicitarias con tarifa preferencial: {promo_url}"[:160]

    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background:#081325; color:#fff; padding:24px;">
      <div style="max-width:550px; margin:0 auto; background:#0d1f3d; padding:28px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
        <h2 style="color:#06b6d4; margin-top:0;">🚀 Nuevas Oportunidades de Publicidad</h2>
        <p>Estimado equipo de <strong>{brand}</strong>,</p>
        <p>{promo_details}</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="{promo_url}" style="background:#2563eb; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; font-size:14px; display:inline-block;">Explorar Nuevos Espacios</a>
        </div>
      </div>
    </body>
    </html>
    """

    return {
        "subject": f"🚀 Nuevas Oportunidades Publicitarias para {brand} en CareTech",
        "email_html": email_html,
        "whatsapp_text": whatsapp_text,
        "sms_text": sms_text
    }
