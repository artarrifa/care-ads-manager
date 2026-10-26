# CareTech Games - Especificación de API (API_SPEC.md)

Endpoints REST para la gestión de publicidad, pagos, entrega de anuncios y analítica.

---

## 1. Configuración y Precios

### `GET /api/v1/games/pricing`
Retorna la tabla de precios, planes activos, juegos y tasa de cambio COP.

### `GET /api/v1/games/availability?game=solitario&placement=top&plan=maximo`
Retorna los slots ocupados (0 a 60), cupos libres y estado de lista de espera (`WAITLISTED` o `AVAILABLE`).

---

## 2. Gestión de Campañas y Checkout

### `POST /api/v1/games/campaigns/create`
**Request Body:**
```json
{
  "brandName": "Mi Empresa Salud",
  "headline": "Descubre nuestra app de salud",
  "description": "Atención médica 24/7 en tu móvil",
  "logoUrl": "https://...",
  "webUrl": "https://miempresa.com",
  "donationUrl": "https://donar.miempresa.com",
  "shopUrl": "https://tienda.miempresa.com",
  "gameId": "solitario",
  "placement": "top",
  "planId": "maximo",
  "hasPriority": true,
  "advertiserEmail": "contacto@miempresa.com",
  "advertiserPhone": "+573001234567"
}
```

**Response:**
```json
{
  "success": true,
  "campaignId": "CAMP_1728392100_8472",
  "status": "PENDING_PAYMENT",
  "pricing": {
    "planPriceUsd": 120,
    "priorityFeeUsd": 120,
    "totalUsd": 240,
    "totalCop": 960000
  }
}
```

---

## 3. Pasarelas de Pago

### `POST /api/v1/games/payments/paypal/create`
Genera los parámetros y URL directa para checkout seguro con PayPal Website Payments / PayPal Standard (USD).

### `POST /api/v1/games/payments/paypal/ipn` (o `POST /games/api.php?action=paypal_ipn`)
Recibe y valida las notificaciones de pago instantáneo (IPN) de PayPal (configurado en https://www.paypal.com/businessmanage/account/website).

### `POST /api/v1/games/payments/crypto/create`
Genera la orden y QR de Binance Pay (o modo sandbox interactivo).

### `POST /api/v1/games/payments/crypto/webhook`
Webhook oficial HMAC-SHA512 para pagos cripto.

---

## 4. Entrega de Anuncios PWA (Live & Offline Sync)

### `GET /api/v1/ads/:game/:placement`
Retorna el anuncio activo para el slot del minuto actual.
- Cabecera `ETag` para optimización de ancho de banda.
- Si no hay anuncio activo contratado, entrega el banner institucional de CareTech.

**Response:**
```json
{
  "campaignId": "CAMP_DEFAULT_LOYALTY",
  "headline": "Care Loyalty",
  "description": "Fideliza a tus clientes con Apple & Google Wallet",
  "logo": "https://caretechservices.com/assets/logo.png",
  "webUrl": "https://caretechservices.com/loyalty/",
  "donationUrl": "https://caretechservices.com/donar/",
  "shopUrl": "https://caretechservices.com/tienda/",
  "slotMinute": 14,
  "syncTime": 1728392100
}
```

---

## 5. Analítica y Telemetría

### `POST /api/v1/analytics/track`
**Request Body:**
```json
{
  "events": [
    {
      "eventType": "new_device_activation",
      "gameId": "solitario",
      "timestamp": 1728392100
    },
    {
      "eventType": "ad_click",
      "gameId": "solitario",
      "campaignId": "CAMP_123",
      "placement": "top",
      "timestamp": 1728392105
    }
  ]
}
```
