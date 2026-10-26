# CareTech Games - Integración de Pagos (PayPal y Criptomonedas)

Este documento detalla la arquitectura de procesamiento de pagos para la plataforma de anunciantes de CareTech Games, utilizando **PayPal Website Payments** y **Binance Pay (Cripto)**.

---

## 1. Integración PayPal (USD / Internacional / Tarjetas Débito y Crédito)

PayPal procesa pagos internacionales directamente en **USD** (moneda base de los planes publicitarios: $1, $3, $15, $35, $60, $120 USD).
Permite pagos mediante:
- Tarjetas de Crédito y Débito (Visa, MasterCard, American Express, etc.)
- Saldo en cuenta PayPal
- Transferencia bancaria asociada a PayPal

### Configuración en PayPal Business (Website Payments):
Panel de control PayPal:
🔗 [https://www.paypal.com/businessmanage/account/website](https://www.paypal.com/businessmanage/account/website)

1. **Website Payment Preferences (Preferencias de pago en el sitio web):**
   - **Retorno Automático (Auto Return):** `Activado (On)`
   - **URL de Retorno:** `https://caretechservices.com/games/publicidad/?payment=success`
   - **Transferencia de datos de pago (PDT):** `Activado (On)`
   - **Cuenta PayPal opcional (PayPal Account Optional):** `Activado (On)` *(Permite a los usuarios pagar con tarjeta sin necesidad de crear cuenta PayPal)*.

2. **Instant Payment Notification (IPN / Notificación instantánea de pago):**
   - **URL de Notificación IPN:** `https://caretechservices.com/games/api.php?action=paypal_ipn`
   - **Mensajes IPN:** `Activado (On)`

### Variables de Configuración:
```json
{
  "paypalCurrency": "USD",
  "paypalMerchantEmail": "care@caretechservices.com",
  "paypalWebsitePreferencesUrl": "https://www.paypal.com/businessmanage/account/website"
}
```

### Flujo de Checkout PayPal:
1. El anunciante diseña su banner y selecciona su plan publicitario en `/games/publicidad/`.
2. Al pulsar **"Pagar con PayPal"**, se registra la campaña en `/games/api.php` y se genera el enlace oficial de checkout PayPal Website Payments:
   ```text
   https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=care@caretechservices.com&item_name=...&amount=...&currency_code=USD&custom=CAMP_ID&invoice=CAMP_ID&return=...&notify_url=...
   ```
3. El usuario completa el pago de forma segura en PayPal.
4. El servidor de PayPal notifica al webhook IPN (`/games/api.php?action=paypal_ipn`), el cual valida el pago mediante postback oficial (`cmd=_notify-validate`) y activa la campaña inmediatamente.

---

## 2. Integración Criptomonedas (Binance Pay / Crypto Provider)

Reutiliza el adaptador centralizado de CareTech (`CareExistingCryptoProvider`) basado en Binance Pay Merchant API (0% comisiones).

### Variables de Entorno Requeridas:
```env
BINANCE_PAY_API_KEY=tu_api_key_de_binance_merchant
BINANCE_PAY_SECRET_KEY=tu_secret_key_de_binance_merchant
BINANCE_PAY_BASE_URL=https://bpay.binanceapi.com
```

### Reglas de Integración:
1. **Firma HMAC-SHA512:** Se genera con el timestamp, nonce de 32 caracteres y payload JSON.
2. **Soporte Sandbox Automático:** Si las credenciales no están colocadas en `.env`, el backend activa automáticamente el modo sandbox interactivo con QR para pruebas sin interrupciones.
3. **Webhook Cripto (`POST /api/v1/games/payments/crypto/webhook`):** Valida la notificación oficial y activa la campaña en la cola de revisión.
