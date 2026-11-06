# AUDITORÍA FASE 0 — HALLAZGOS DE CIBERSEGURIDAD Y RIESGOS (OWASP)
**Fecha de Evaluación:** 2026-11-06  
**Clasificación:** Confidencial / Interno CareTech  
**Estándar de referencia:** OWASP Top 10 API Security & ASVS v4.0  

---

## 1. Resumen Ejecutivo de Vulnerabilidades

| ID | Vulnerabilidad | Severidad | Componente / Archivo | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Acceso no autenticado a Consola de Administración** | 🚨 **CRÍTICA** | `caretech-games-pwa-deployment-v1/portal/admin/index.html` | Cualquier usuario en internet que ingrese a `/games/admin/` puede ver métricas internas y telemetría de dispositivos. |
| **SEC-02** | **Sobreescritura no autorizada de Credenciales de Pasarelas** | 🚨 **CRÍTICA** | `caretech-games-pwa-deployment-v1/portal/api.php#L824-L865` (`action=save_epayco_config`) | Endpoint POST público sin autenticación ni token CSRF que permite a cualquier atacante sobreescribir las llaves de ePayco en `caretech-private/payments.php` y desviar pagos. |
| **SEC-03** | **Fuga de Métricas y Telemetría de Dispositivos** | ⚠️ **ALTA** | `caretech-games-pwa-deployment-v1/portal/api.php#L466` (`action=admin_stats`) | Endpoint GET sin token de sesión que expone hashes de dispositivos, User-Agents y eventos analíticos internos. |
| **SEC-04** | **Activación Prematura de Anuncios sin Pago Acreditado** | ⚠️ **ALTA** | `caretech-games-pwa-deployment-v1/portal/api.php#L600` | Al crearse la campaña, se inicializa con `status: 'ACTIVE'`, permitiendo que anuncios no pagados puedan ser servidos en los juegos antes de la conciliación. |
| **SEC-05** | **Almacenamiento en Archivos Planos JSON Concurrente** | ⚠️ **MEDIA** | `caretech-games-pwa-deployment-v1/portal/api.php#L51-L59` (`campaigns.json`, `payments.json`) | Riesgo de condición de carrera (*Race Condition*) en escrituras simultáneas (`file_put_contents` sin bloqueo exclusivo `LOCK_EX`), lo que puede causar pérdida silenciosa de registros de órdenes. |
| **SEC-06** | **Ausencia de Autenticación de Doble Factor (2FA / MFA)** | ⚠️ **MEDIA** | Consola Administrativa `/games/admin/` | No existe un esquema de credenciales administrativas con contraseñas seguras (Argon2id) ni 2FA basado en TOTP (Google Authenticator / Authy). |

---

## 2. Detalle Técnico y Evidencia Reproducible

### SEC-01: Exposición de `/games/admin/` sin barrera de autenticación
* **Evidencia:**  
  Al realizar una petición HTTP GET a `https://caretechservices.com/games/admin/`, el servidor retorna código HTTP 200 con el DOM completo del panel, sin requerir cabecera `Authorization`, cookie de sesión ni pantalla de login.
* **Mitigación requerida:**  
  Implementar una barrera de autenticación previa que verifique credenciales criptográficas y token de sesión firmado antes de renderizar la interfaz o responder a las llamadas de la API administrativa.

### SEC-02: Endpoint `action=save_epayco_config` expuesto públicamente
* **Evidencia en código:**
  ```php
  // api.php líneas 823-834
  if (($action === 'save_epayco_config' || strpos($requestUri, '/api/v1/payments/epayco/save-config') !== false) && $method === 'POST') {
      header('Content-Type: application/json');
      $raw = file_get_contents('php://input');
      $data = json_decode($raw, true) ?: [];
      $newPubKey   = trim($data['publicKey'] ?? '');
      $newPrivKey  = trim($data['privateKey'] ?? '');
      // Escribe directamente a $targetPath (payments.php) sin validar identidad del emisor
  ```
* **Impacto:**  
  Un atacante automatizado puede enviar un payload JSON con su propia llave pública y privada de ePayco, redirigiendo los cobros del comercio hacia su cuenta particular.
* **Mitigación requerida:**  
  Bloquear este endpoint inmediatamente con autorización de rol `SUPER_ADMIN` y token de sesión seguro con MFA.

### SEC-04: Inicialización en estado `ACTIVE` en lugar de `PENDING_PAYMENT`
* **Evidencia en código:**
  ```php
  // api.php líneas 582-603
  $newCampaign = [
      'id' => $campaignId,
      'brandName' => $data['brandName'] ?? 'Anunciante CareTech',
      ...
      'status' => 'ACTIVE', // <-- Vulnerabilidad de proceso financiero
      'createdAt' => date('Y-m-d H:i:s'),
  ```
* **Impacto:**  
  El ad-server toma campañas con `status: 'ACTIVE'`. Si un usuario llena el formulario y abandona la pasarela sin pagar, su anuncio entra en la rotación del juego.
* **Mitigación requerida:**  
  Cambiar el estado inicial a `PENDING_REVIEW` o `PENDING_PAYMENT`. Únicamente transicionar a `ACTIVE` tras la validación criptográfica del webhook de la pasarela o la aprobación manual auditada en el admin.
