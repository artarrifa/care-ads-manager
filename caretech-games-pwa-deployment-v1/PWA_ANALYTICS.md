# CareTech Games - Analítica PWA, Detección de País y Métricas de Clics

Este documento define la arquitectura de métricas no invasivas y privacidad para CareTech Games.

---

## 1. Métricas de Activación e Instalación PWA

Debido a que navegadores como iOS/Safari no siempre disparan eventos explícitos de instalación, se implementa una métrica universal y comparable:

### A. `new_device_activation`
- Se registra una única vez por dispositivo cuando:
  1. El usuario entra al juego por primera vez.
  2. El Service Worker precachea los recursos base.
  3. La base de datos IndexedDB se inicializa localmente.
  4. La flag local `care_games_activated = true` se guarda en IndexedDB.

### B. `pwa_installed`
- Se dispara cuando el navegador soporta y emite el evento nativo:
  ```javascript
  window.addEventListener('appinstalled', () => {
    trackEvent('pwa_installed', { game: 'solitario' });
  });
  ```

---

## 2. Detección de País sin GPS

Para proteger la privacidad de los usuarios y no solicitar permisos de geolocalización intrusivos:
1. En la primera llamada de activación o al cargar la página, el backend lee la cabecera enviada por el CDN / Edge:
   - Cloudflare: `CF-IPCountry`
   - Proxies: `X-Country-Code` o `GEOIP_COUNTRY_CODE`
   - Fallback: `CO` / `ES` / `US` / `MX` / `OTHER`
2. **Privacidad:** Nunca se almacena la dirección IP completa en la base de datos de analítica, únicamente el código ISO de 2 letras (ej. `CO`, `ES`, `US`).

---

## 3. Desglose de Clics por Tipo

Para maximizar el valor comercial entregado al anunciante, cada banner registra 3 eventos de interacción distintos:

| Evento | Descripción | Destino Comercial |
| :--- | :--- | :--- |
| `ad_impression` | Vista de 60s en pantalla | Métricas de alcance y CPM |
| `ad_click` | Clic en enlace web principal | Landing page / Sitio web |
| `ad_donation_click` | Clic en botón de donación | Colecta / Vaki / PayPal / Causa social |
| `ad_shop_click` | Clic en oferta o tienda online | Conversión de venta directa / Checkout |

---

## 4. Filosofía Local-First / PWA
- **Modo Offline:** El juego nunca detiene su ejecución ni bloquea la interfaz si no hay internet.
- **Cola de Eventos Offline:** Los eventos de analítica se acumulan en IndexedDB y se sincronizan en batch en la siguiente reconexión mediante `navigator.sendBeacon` o `fetch`.
- **Caché de Anuncios:** Los anuncios se guardan en IndexedDB con timestamp. Si la última sincronización es menor a 24 horas, se pueden mostrar offline. Si supera las 24 horas, los anuncios se ocultan de forma limpia sin afectar la jugabilidad.
