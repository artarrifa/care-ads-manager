# Especificación de API REST — Care Ads Manager V1.0

Ruta Base: `/api/v1`  
Documentación Interactiva Swagger / OpenAPI: `/docs` y `/redoc`

---

## 1. Módulo de Autenticación & 2FA (`/api/v1/auth`)

### 1.1. Iniciar Sesión
- **Método / Ruta**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "admin@caretechservices.com",
    "password": "Password123!",
    "totp_code": "123456" // Requerido si MFA está activo
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "mfa_required": false
  }
  ```

### 1.2. Configuración de 2FA / TOTP
- **Método / Ruta**: `POST /auth/mfa/setup` (Bearer Token requerido)
- **Response 200 OK**:
  ```json
  {
    "secret": "JBSWY3DPEHPK3PXP",
    "otpauth_url": "otpauth://totp/CareAds:user?secret=...",
    "qr_code_base64": "data:image/png;base64,iVBORw0KGgo..."
  }
  ```

### 1.3. Verificación de 2FA
- **Método / Ruta**: `POST /auth/mfa/verify`
- **Request Body**: `{ "totp_code": "123456" }`
- **Response 200 OK**: `{ "status": "MFA_ENABLED", "message": "2FA verified and activated successfully" }`

---

## 2. Módulo de Campañas & Contratación (`/api/v1/campaigns`)

### 2.1. Crear Orden de Campaña con Aceptación Contractual
- **Método / Ruta**: `POST /campaigns/create` (Bearer Token requerido)
- **Request Body**:
  ```json
  {
    "placement_code": "solitario_top",
    "brand_name": "Clínica Santa Fe",
    "title": "Citas Médicas Prioritarias",
    "description": "Atención especializada 24 horas",
    "cta_text": "Agendar Cita",
    "target_url": "https://clinicasantafe.com.co",
    "logo_url": "https://caretechservices.com/img/csf-logo.png",
    "duration_weeks": 4,
    "has_priority": false,
    "amount_usd": 35.00,
    "terms_accepted": true
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "order_id": "b6a831e1-...",
    "order_code": "ORD-20261106-993A",
    "status": "CONTRACT_ACCEPTED",
    "contract_hash": "a4f8c2b..."
  }
  ```

### 2.2. Moderación de Campaña (Aprobación / Pausa / Rechazo)
- **Método / Ruta**: `POST /campaigns/{order_id}/moderate` (Rol: SUPER_ADMIN, AD_MODERATOR)
- **Request Body**:
  ```json
  {
    "action": "APPROVE", // "APPROVE" | "PAUSE" | "REJECT"
    "note": "Creatividad verificada cumple lineamientos de salud"
  }
  ```

---

## 3. Módulo de Entrega & Telemetría (`/api/v1/delivery`)

### 3.1. Solicitar Decisión Publicitaria
- **Método / Ruta**: `GET /delivery/decision?game=solitario&placement=top`
- **Response 200 OK**:
  ```json
  {
    "decision_id": "c1f7b2e3-...",
    "is_house_ad": false,
    "creative": {
      "title": "Clínica Santa Fe",
      "description": "Atención médica 24h",
      "cta_text": "Agendar Cita",
      "target_url": "https://clinicasantafe.com.co",
      "logo_url": "https://caretechservices.com/img/csf-logo.png"
    }
  }
  ```

### 3.2. Enviar Lote de Eventos IAB
- **Método / Ruta**: `POST /delivery/events`
- **Request Body**:
  ```json
  [
    {
      "decision_id": "c1f7b2e3-...",
      "event_type": "IMPRESSION",
      "viewable_percent": 100,
      "duration_seconds": 12,
      "viewport_width": 414,
      "viewport_height": 896
    }
  ]
  ```
- **Response 200 OK**: `{ "status": "RECORDED", "events_processed": 1 }`

---

## 4. Módulo Administrativo & Auditoría (`/api/v1/admin`)

### 4.1. Dashboard de Métricas y KPIs
- **Método / Ruta**: `GET /admin/dashboard` (Rol: SUPER_ADMIN, FINANCE_ADMIN)
- **Response 200 OK**:
  ```json
  {
    "total_campaigns": 5,
    "active_campaigns": 2,
    "total_revenue_usd": 70.00,
    "total_impressions_delivered": 1420
  }
  ```

### 4.2. Verificación de Integridad de la Cadena de Auditoría
- **Método / Ruta**: `GET /admin/audit/verify` (Rol: SUPER_ADMIN, AUDITOR)
- **Response 200 OK**:
  ```json
  {
    "status": "VERIFIED",
    "total_records_checked": 18,
    "message": "All audit events verified successfully. Hash chain intact."
  }
  ```
