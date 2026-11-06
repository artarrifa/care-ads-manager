# AUDITORÍA FASE 0 — INVENTARIO DE DATOS EXISTENTES
**Fecha de Inventario:** 2026-11-06  
**Ámbito:** Estructuras de datos, almacenes JSON y variables de sesión  

---

## 1. Almacenes de Datos Activos (Directorio `data/`)

| Archivo | Ubicación en Servidor | Formato | Contenido | Esquema Clave |
| :--- | :--- | :--- | :--- | :--- |
| `campaigns.json` | `public_html/games/data/campaigns.json` | JSON Array | Órdenes de publicidad y metadatos de banners | `id`, `brandName`, `headline`, `description`, `logoUrl`, `webUrl`, `donationUrl`, `shopUrl`, `gameId`, `placement`, `planId`, `hasPriority`, `paymentMethod`, `totalUsd`, `totalCop`, `advertiserEmail`, `advertiserPhone`, `status`, `createdAt`, `assignedSlotMinute` |
| `payments.json` | `public_html/games/data/payments.json` | JSON Array | Registro de intenciones de pago y transacciones | `reference`, `service`, `brandName`, `planId`, `amountUsd`, `amountCop`, `customerEmail`, `customerPhone`, `paymentMethod`, `status`, `createdAt` |
| `devices.json` | `public_html/games/data/devices.json` | JSON Array | Dispositivos únicos PWA registrados | `installIdHash`, `gameId`, `uaClass`, `standalone`, `country`, `registeredAt` |
| `analytics.json` | `public_html/games/data/analytics.json` | JSON Array (límite rotativo de 5.000 eventos) | Telemetría cruda de eventos | `eventType`, `gameId`, `placement`, `campaignId`, `timestamp` |

---

## 2. Almacenes de Datos en el Cliente (Navegador / LocalStorage PWA)

| Clave en LocalStorage | Finalidad | Tiempo de Vida |
| :--- | :--- | :--- |
| `care_cached_ad_{gameId}_{placement}` | Almacena el último banner JSON devuelto por la API para visualización sin conexión. | 24 horas (`maxOfflineAgeSeconds: 86400`). |
| `care_etag_{gameId}_{placement}` | Hash ETag para consultas HTTP condicionales (`If-None-Match`). | Persistente hasta actualización del servidor. |
| `care_telemetry_queue_{gameId}` | Cola de eventos de clics e impresiones pendientes de sincronizar con el servidor. | Se vacía al completarse el lote en `events/batch`. |

---

## 3. Configuración y Secretos Privados

| Recurso | Ubicación | Datos Sensibles Almacenados |
| :--- | :--- | :--- |
| `payments.php` | `caretech-private/payments.php` | Credenciales ePayco (`pCustIdCliente`, `publicKey`, `privateKey`, `pKey`), Binance Pay (`apiKey`, `secretKey`). |
| `paypal.php` | `caretech-private/paypal.php` | Credenciales PayPal REST API (`clientId`, `clientSecret`, `mode`). |
| `.env` (Raíz) | Repositorio local | Credenciales de despliegue SSH Hostinger, Wompi y PayPal Live. |
