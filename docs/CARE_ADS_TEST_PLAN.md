# Plan de Pruebas & Matriz de Validación — Care Ads Manager V1.0

## 1. Estrategia de Aseguramiento de Calidad (QA)
Siguiendo la Regla Absoluta de la directriz:
*"No declares una funcionalidad implementada, integrada, probada, segura o desplegada si no existe evidencia técnica reproducible de ello."*

Todas las funciones críticas de negocio se encuentran cubiertas por suites automatizadas con `pytest` y `pytest-asyncio` en `care-ads/backend/tests/`.

---

## 2. Matriz de Casos de Prueba Automatizados

| ID de Prueba | Archivo de Prueba | Módulo Evaluado | Criterio de Éxito | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | `test_all_core_flows.py` | Health Check | `GET /health` responde 200 con `status: healthy` y conexión a PostgreSQL. | **PASSED** |
| **TEST-02** | `test_all_core_flows.py` | Autenticación & 2FA | Login Argon2id, enrolamiento TOTP, generación QR PNG base64, validación de token y login secundario con 2FA activo. | **PASSED** |
| **TEST-03** | `test_all_core_flows.py` | Ciclo de Vida & Contrato | Rechazo de órdenes sin aceptación de términos; creación con `contract_hash`; moderación por Super Admin (`APPROVED`, `PAUSED`). | **PASSED** |
| **TEST-04** | `test_all_core_flows.py` | Motor de Decisión & IAB | Entrega de anuncio activo; registro de impresiones IAB (100% visibilidad, 12s); auditoría automática generada. | **PASSED** |
| **TEST-05** | `test_security_and_rbac.py` | RBAC & Permisos | Usuario con rol `ADVERTISER` recibe `403 FORBIDDEN` al intentar consultar `/admin/audit/verify`. | **PASSED** |
| **TEST-06** | `test_security_and_rbac.py` | Detección de Fraude en Auditoría | Alteración manual deliberada de un campo en la base de datos es detectada inmediatamente por el algoritmo de hash chain SHA-256 (`TAMPER_DETECTED`). | **PASSED** |

---

## 3. Ejecución y Reproducibilidad
Para reproducir la totalidad de pruebas automatizadas:

```bash
cd care-ads/backend
PYTHONPATH=. uv run pytest -v
```

Resultado verificado:
```
tests/test_all_core_flows.py::test_health_check PASSED [ 16%]
tests/test_all_core_flows.py::test_auth_login_and_2fa_workflow PASSED [ 33%]
tests/test_all_core_flows.py::test_campaign_contract_and_lifecycle PASSED [ 50%]
tests/test_all_core_flows.py::test_delivery_engine_and_audit_integrity PASSED [ 66%]
tests/test_security_and_rbac.py::test_rbac_non_admin_forbidden PASSED [ 83%]
tests/test_security_and_rbac.py::test_audit_hash_chain_tamper_detection PASSED [100%]
============================== 6 passed in 0.55s ===============================
```
