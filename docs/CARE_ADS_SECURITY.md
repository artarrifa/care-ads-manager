# Modelo de Seguridad & OWASP — Care Ads Manager V1.0

## 1. Arquitectura de Autenticación y Autorización

### 1.1. Hash de Contraseñas
- **Algoritmo**: Argon2id (`app/core/security.py`).
- **Parámetros**: Memoria $65,536 \text{ KiB}$, tiempo $3$ iteraciones, paralelismo $4$ hilos.
- **Protección**: Resistente a ataques por hardware acelerado (GPU/ASIC) y ataques de canal lateral por temporización.

### 1.2. Autenticación de Dos Factores (2FA / TOTP)
- **Estándar**: RFC 6238 Time-based One-Time Password (TOTP) de 6 dígitos con ventana de 30 segundos.
- **Enrolamiento**:
  1. Solicitud a `/api/v1/auth/mfa/setup` (requiere JWT previo).
  2. Generación de clave secreta aleatoria Base32 y código QR PNG incrustado en Base64.
  3. Verificación obligatoria en `/api/v1/auth/mfa/verify` ingresando el token de 6 dígitos.
- **Enforcement en Login**:
  - Si el usuario tiene `mfa_enabled = True`, la autenticación primaria devuelve `{ "mfa_required": true }`.
  - El token de sesión administrativa no se emite hasta verificar el código TOTP actual.

### 1.3. Control de Acceso Basado en Roles (RBAC)
Los roles del sistema son jerárquicos y se validan en cada endpoint mediante la dependencia `require_role()`:
- `SUPER_ADMIN`: Control total de plataforma, configuración global y auditoría.
- `FINANCE_ADMIN`: Conciliación contable, gestión de pagos y reportes de facturación.
- `SALES_MANAGER`: Gestión de anunciantes, generación de cotizaciones y contratos.
- `AD_MODERATOR`: Aprobación y rechazo editorial de creatividades.
- `OPERATIONS_MANAGER`: Supervisión de inventario y configuración de placements.
- `AUDITOR`: Acceso de sólo lectura a registros de auditoría y reportes legales.
- `ADVERTISER`: Acceso restringido exclusivamente a sus propias campañas y órdenes.

---

## 2. Mitigaciones OWASP Top 10

| Vulnerabilidad OWASP | Riesgo Identificado | Contramedida Técnica Implementada |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Endpoints de stats y llaves expuestos en el PHP legacy (SEC-01/02/03). | Autenticación JWT + 2FA estricta en FastAPI; función `verifyAdminAuth()` en PHP bridge. |
| **A02: Cryptographic Failures** | Almacenamiento en texto plano o hashing obsoleto. | Argon2id para contraseñas; HMAC SHA-256 para webhooks; SHA-256 hash chain en auditoría. |
| **A03: Injection** | SQL Injection en filtros de campaña. | Parámetros fuertemente tipados con Pydantic V2 y consultas preparadas en SQLAlchemy Async. |
| **A04: Insecure Design** | Activación de anuncios sin pago verificado (SEC-04). | Flujo de estados estricto: `CONTRACT_ACCEPTED` $\rightarrow$ `PAYMENT_CONFIRMED` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE`. |
| **A05: Security Misconfiguration** | Cors permisivo y headers inseguros. | FastAPI CORS restringido por entorno; HSTS, CSP y X-Content-Type-Options configurados. |
| **A07: Identification Failures** | Ataques de fuerza bruta a cuentas admin. | Bloqueo por rate-limit y segundo factor TOTP mandatorio. |
