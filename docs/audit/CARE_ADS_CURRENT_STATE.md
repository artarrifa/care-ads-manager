# AUDITORÍA FASE 0 — ESTADO ACTUAL DE CARE ADS Y PUBLICIDAD
**Fecha de Auditoría:** 2026-11-06  
**Entorno auditado:** Repositorio `caretech-games` (`master` / `feature/care-ads-manager-v1`) y despliegue Hostinger en `https://caretechservices.com`  
**Equipo auditor:** Arquitectura de Software, Seguridad & Auditoría Financiera CareTech  

---

## 1. Inventario de Componentes y Código Activo

| Componente | Ruta en Repositorio / Servidor | Función Real Verificada | Evidencia |
| :--- | :--- | :--- | :--- |
| **SDK Publicitario en PWA** | `caretech-games-pwa-deployment-v1/templates/solitario/care-platform.js` | Inicializa y solicita banners (`initAds`, `syncAds`), almacena en `localStorage` (24h offline), captura clics y telemetría (`trackEvent`). | [care-platform.js#L184-L250](file:///Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games-pwa-deployment-v1/templates/solitario/care-platform.js#L184-L250) |
| **Juego PWA (Solitario Care)** | `caretech-games-pwa-deployment-v1/templates/solitario/index.html` | Renderiza slots DOM `#top-ad-banner` y `#bottom-ad-banner` sobre el tapete de juego. | [index.html#L220-L240](file:///Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games-pwa-deployment-v1/templates/solitario/index.html#L220-L240) |
| **Ad-Server & API Unificada** | `caretech-games-pwa-deployment-v1/portal/api.php` | Entrega de anuncios (`action=banners`), creación de campañas (`action=create_campaign`), webhooks de pago y telemetría de eventos. | [api.php#L300-L370](file:///Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games-pwa-deployment-v1/portal/api.php#L300-L370) |
| **Portal de Compra de Publicidad** | `public/publicidad/index.html` (y `portal/publicidad/index.html`) | Formulario autoservicio B2B para configuración de campañas, previsualización en vivo, carga dual de logo y checkout multimoneda. | [index.html#L685-L870](file:///Users/alexistarrifa/Documents/antigravity/clever-bardeen/public/publicidad/index.html#L685-L870) |
| **Consola de Administración** | `caretech-games-pwa-deployment-v1/portal/admin/index.html` | Interfaz visual actual (`/games/admin/`). Contiene KPIs de dispositivos y maqueta visual fija para moderación de anuncios. | [admin/index.html#L290-L335](file:///Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games-pwa-deployment-v1/portal/admin/index.html#L290-L335) |

---

## 2. Flujo de Solicitud, Selección y Rotación de Anuncios

### 2.1. Solicitud desde las PWA
* Al cargar el juego, `care-platform.js` ejecuta `initAds()`:
  1. Llama de inmediato a `syncAds()`.
  2. Activa un intervalo periódico cada 60 segundos (`setInterval(..., 60000)`).
* Consulta el endpoint HTTP:
  `GET /games/api.php?action=banners&game=solitario&placement=top` (y `bottom`).
* Soporta cabeceras de validación condicional `If-None-Match` (ETag) devolviendo `304 Not Modified` para ahorrar ancho de banda.

### 2.2. Algoritmo de Selección en el Servidor (`api.php`)
1. Carga `data/campaigns.json`.
2. Filtra campañas coincidentes donde:
   * `gameId === $game`
   * `placement === $placement`
   * `status IN ('ACTIVE', 'SCHEDULED', 'AUTHORIZED')`
3. Aplica rotación horaria determinista:
   `$index = $currentMinute % count($matched)`
4. Si no existen campañas de anunciantes activas que coincidan, entrega el banner institucional fallback (`CAMP_CARE_LOYALTY` o `CAMP_CARE_INSTITUTIONAL`).

### 2.3. Comportamiento Sin Conexión (Offline)
* Al recibir un banner válido, el SDK lo persiste en el `localStorage` del cliente bajo la clave `care_cached_ad_{gameId}_{placement}` junto a un timestamp.
* Si el dispositivo pierde internet (red inestable, modo avión), lee la caché local siempre que tenga una antigüedad menor a 24 horas (`maxOfflineAgeSeconds: 86400`).
* **Riesgo verificado:** No existe diferenciación formal en la base de datos entre impresiones servidas online e impresiones servidas offline; los eventos en cola se envían por lotes al recuperar la red.

---

## 3. Estado de la Administración y Brechas con la Realidad

1. **La consola actual es 80% Mockup:**
   * La "Cola de Moderación de Campañas" en `admin/index.html` tiene 2 filas HTML estáticas (*Care Loyalty* y *Clínica Santa Fe*).
   * Los botones de acción `[Aprobar]`, `[Pausar]` y `[Rechazar]` no tienen controladores `onclick` ni conexión a endpoints del backend.
   * La tabla de audiencia por país y rendimiento por juego muestra valores estáticos hardcodeados (ej. *11,272 Colombia, 35,200 Solitario*).
2. **Lo único dinámico hoy:**
   * La función `loadAdminStats()` consulta `/games/api.php?action=admin_stats` y actualiza los KPIs de dispositivos conectados y la tabla de dispositivos recientes (`devices.json`).
3. **Ausencia de Contratos Formales:**
   * El anunciante solo ingresa datos de contacto; no se genera un contrato marco ni una orden de compra descargable ni firmada electrónicamente. No hay hash ni registro inmutable.
4. **Vigencias sin Expiración Automática:**
   * Una vez creada una campaña, no existe un worker o cron job que verifique si ya transcurrieron los 7 o 30 días contratados. Permanece en el array indefinidamente hasta intervención manual.
