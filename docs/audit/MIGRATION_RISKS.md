# AUDITORÍA FASE 0 — EVALUACIÓN DE RIESGOS DE MIGRACIÓN
**Fecha:** 2026-11-06  
**Objetivo:** Identificar dependencias y riesgos al migrar desde el sistema de archivos JSON a Care Ads Manager V1.0  

---

## 1. Matriz de Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- | :--- |
| **Interrupción de Banners en Solitario Care** | Media | Alta | **Shadow Mode & Dual-Serving:** Mantener los endpoints legacy `/games/api.php?action=banners` y `/api/v1/games/ads` respondiendo sin alteraciones mientras el nuevo backend se valida en paralelo. |
| **Pérdida de Datos en JSON por Concurrencia** | Alta | Alta | **Migración Atómica a PostgreSQL:** Leer los JSON existentes (`campaigns.json`, `payments.json`) mediante un script de ingestión idempotente que pueble las tablas relacionales de PostgreSQL garantizando claves foráneas y deduplicación. |
| **Falsos Positivos en Métricas Offline** | Alta | Media | **Reconciliación de Eventos:** Marcar en la base de datos relacional los eventos recibidos con desfase temporal como `is_offline_sync: true` para no contabilizarlos erróneamente como impresiones en vivo garantizadas. |
| **Incompatibilidad con el Hosting Actual (Hostinger)** | Media | Alta | El backend de Hostinger compartido ejecuta PHP 8.x / LiteSpeed. Para el backend Python FastAPI + PostgreSQL se debe utilizar o bien un subdominio/VPS gestionado (Docker/Render/Fly.io/Hostinger VPS) o compilar un módulo de paridad seguro. |
| **Fraude por Alteración de Precios en Cliente** | Baja | Alta | Validar siempre el monto (`amountUsd` y `amountCop`) estrictamente en el backend desde el catálogo oficial de precios (`pricing.json`), ignorando cualquier valor alterado enviado en el payload del navegador. |

---

## 2. Requisitos de Retrocompatibilidad
1. El juego **Solitario Care** en las versiones ya instaladas en teléfonos de usuarios debe seguir recibiendo respuestas con la estructura esperada:
   ```json
   {
     "campaignId": "...",
     "brandName": "...",
     "headline": "...",
     "description": "...",
     "logo": "...",
     "webUrl": "...",
     "donationUrl": "...",
     "shopUrl": "...",
     "slotMinute": 14
   }
   ```
2. Cualquier cambio en la base de datos o el motor de decisión no debe romper los parámetros esperados por `care-platform.js`.
