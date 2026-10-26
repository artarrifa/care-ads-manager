# Guía de Despliegue en Hostinger (Node.js) - Care Loyalty

Esta guía te muestra paso a paso cómo desplegar la aplicación de **Care Loyalty** en tu dominio **`https://caretechservices.com/loyalty/`** en Hostinger hPanel, con soporte completo para pagos con **Binance Pay (Criptomonedas 0% comisión)** y atención comercial por **WhatsApp**.

---

## 1. Configuración de la Aplicación en Hostinger hPanel

1. Ingresa a **[hPanel de Hostinger](https://hpanel.hostinger.com/websites?websiteType=nodejs)**.
2. Selecciona **Sitios Web** (Websites) > **Administrar** sobre `caretechservices.com`.
3. Entra en la sección **Node.js** de tu panel de hosting:
   - **Node.js Version**: Selecciona `v18.x`, `v20.x` o versión LTS más reciente.
   - **Application Mode**: `Production`.
   - **Application Root**: `/public_html/loyalty` (o la subcarpeta designada para la ruta `/loyalty`).
   - **Application Startup File**: `server.js`.
   - **Application URL**: `https://caretechservices.com/loyalty`

---

## 2. Variables de Entorno en Hostinger

En la sección **Environment Variables** (o editando directamente el archivo [`.env`](file:///Users/alexistarrifa/Documents/antigravity/clever-bardeen/.env)):

```env
PORT=3000
WHATSAPP_NUMBER=573164734660
SUPPORT_EMAIL=care@caretechservices.com
DEMO_URL=https://www.caretechapps.com/dashboard
APP_BASE_URL=https://caretechservices.com/loyalty

# ==========================================
# CREDENCIALES BINANCE PAY (Merchant API)
# ==========================================
# Obtén tus claves en: https://merchant.binance.com
BINANCE_PAY_API_KEY=tu_api_key_de_binance_merchant
BINANCE_PAY_SECRET_KEY=tu_secret_key_de_binance_merchant
BINANCE_PAY_BASE_URL=https://bpay.binanceapi.com

# ==========================================
# CREDENCIALES PAYPAL (Checkout REST API)
# ==========================================
# Obtén tus claves (Client ID & Secret) en:
# https://www.paypal.com/mep/merchantapps/setup/checkout/apicredentials
PAYPAL_MODE=sandbox # 'sandbox' para pruebas o 'live' para producción
PAYPAL_CLIENT_ID=tu_paypal_client_id
PAYPAL_CLIENT_SECRET=tu_paypal_client_secret
```

> **Nota:** Si aún no colocas las claves de Binance Pay o PayPal en `.env`, la aplicación funcionará automáticamente en modo **Sandbox / Demo interactivo**, permitiendo probar la generación de órdenes, los botones y el flujo completo sin errores.

---

## 3. Subir los Archivos a Hostinger

1. Comprime los siguientes archivos del proyecto en un archivo `.zip`:
   - `server.js`
   - `package.json`
   - `.env`
   - Carpeta `public/` (con `index.html`, `styles.css`, `app.js`)
2. En Hostinger hPanel, abre el **Administrador de Archivos (File Manager)**.
3. Dirígete a la carpeta destino (`public_html/loyalty` o tu raíz).
4. Haz clic en **Subir (Upload)**, sube el archivo `.zip` y selecciona **Extraer (Extract)**.
5. En la sección **Node.js** de hPanel, haz clic en **Run `npm install`** y luego en **Start / Restart Application**.

---

## 4. Medios de Pago y Conversiones por Región

| Región | Moneda Fiat | Equivalente Cripto (Binance Pay) | Métodos Locales & Globales |
| :--- | :--- | :--- | :--- |
| **Colombia 🇨🇴** | COP $39.900 / $69.900 / $149.900 | **9.90 / 19.90 / 39.90 USDT** | PSE, Nequi, Bancolombia (Wompi) + Binance Pay |
| **Europa 🇪🇺** | €9,90 / €19,90 / €39,90 EUR | **9.90 / 19.90 / 39.90 USDT** | SEPA, Tarjetas, Apple Pay, Google Pay + Binance Pay |
| **USA / Global 🇺🇸** | $9.90 / $19.90 / $39.90 USD | **9.90 / 19.90 / 39.90 USDT** | Tarjetas de Crédito/Débito, Stripe + Binance Pay |
| **México 🇲🇽** | $199 / $399 / $799 MXN | **9.90 / 19.90 / 39.90 USDT** | Tarjetas, SPEI + Binance Pay |

---

## 5. Webhooks de Confirmación de Pagos

El servidor incluye automáticamente los endpoints para recibir notificaciones automáticas:
- **Binance Pay Webhook URL:** `https://caretechservices.com/loyalty/api/binance-pay/webhook` (Valida firma HMAC-SHA512).
- **PayPal Webhook URL:** `https://caretechservices.com/loyalty/api/paypal/webhook` (Eventos `PAYMENT.CAPTURE.COMPLETED` y `CHECKOUT.ORDER.APPROVED`).
