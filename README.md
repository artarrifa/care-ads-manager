# 🎮 CareTech Services & CareGames Platform

Ecosistema integral de salud digital, fidelización de clientes y plataforma de juegos accesibles (**PWA Offline-First**) con teleasistencia de emergencia SOS, diseñado especialmente para adultos mayores, familias e instituciones de salud.

Desplegado en producción en **[caretechservices.com](https://caretechservices.com)** sobre infraestructura de **Hostinger**.

---

## 🌐 Enlaces Oficiales de Producción

| Módulo / Sección | URL de Producción | Descripción |
| :--- | :--- | :--- |
| **🏠 Hub Principal** | [caretechservices.com](https://caretechservices.com) | Portal corporativo de CareTech Services con cotizador inteligente de software médico. |
| **🕹️ Portal CareGames** | [caretechservices.com/games/](https://caretechservices.com/games/) | Catálogo de juegos cognitivos y accesibles para adultos mayores. |
| **🃏 Solitario Care PWA** | [caretechservices.com/games/solitario/](https://caretechservices.com/games/solitario/) | Juego PWA de Solitario Klondike accesible, sin ruidos molestos, con botón SOS integrado. (Sincronizado también en [/solitario/](https://caretechservices.com/solitario/)). |
| **📣 Publicidad B2B** | [caretechservices.com/publicidad/](https://caretechservices.com/publicidad/) | Tienda de pautas y patrocinios de marca con vista previa de banners interactivos (3 botones). |
| **❤️ Donaciones B2C** | [caretechservices.com/donar/](https://caretechservices.com/donar/) | Plataforma comunitaria de donaciones ($1, $3, $5 USD) vía PayPal y tarjeta para sostener el proyecto. |
| **📊 Panel Administrativo** | [caretechservices.com/games/admin/](https://caretechservices.com/games/admin/) | Monitor en tiempo real de usuarios registrados, activaciones por país y telemetría de clics. |
| **💳 Care Loyalty** | [caretechservices.com/loyalty/](https://caretechservices.com/loyalty/) | Plataforma de fidelización digital en Apple & Google Wallet sin apps. |

---

## 🃏 Solitario Care PWA (Características Técnicas)

### 1. Experiencia de Primera Vez (FTUX Onboarding Senior)
- **Modal de Bienvenida Cálido:** Detección de primera visita mediante `localStorage`. Presenta los pilares: *Cero Ruidos*, *Cartas Grandes* y *Botón SOS*.
- **Configuración SOS Inteligente:** Detecta automáticamente el país por zona horaria/idioma y fija el número de emergencia oficial correspondiente:
  - 🇨🇴 Colombia: `123`
  - 🇪🇸 España / Europa: `112`
  - 🇺🇸 Estados Unidos / 🇨🇦 Canadá / 🇲🇽 México / 🇦🇷 Argentina: `911`
  - 🇨🇱 Chile: `133`
  - 🇵🇪 Perú: `105`
- Permite vincular el WhatsApp del familiar o cuidador con un formulario ágil y sin contraseñas.
- Badge interactivo *"Configurar"* en la barra superior mientras no se haya guardado un contacto personalizado.

### 2. Barra y Botón de Emergencia SOS
- **Llamada Telefónica Rápida:** Marca directamente al número nacional oficial o al contacto configurado.
- **Alertas de Auxilio por WhatsApp y SMS:** Solicitud con geolocalización GPS automática (`https://maps.google.com/?q={lat},{lng}`) para rescate rápido del adulto mayor si se desorienta o se siente mal.

### 3. Ajustes y Personalización Accesible
- **5 Fondos de Mesa (Temas Care):** *Care Green (Oficial)*, *Care Blue*, *Caoba (Wood)*, *Púrpura Imperial* y *Alto Contraste*.
- **5 Reversos de Baraja:** *Azul Clásico*, *Rojo Imperial*, *Esmeralda*, *Cyber Black* y *Dorado Vintage* con redibujado instantáneo de las cartas en la mesa (`render()`).
- **Botón Toggle de Efectos de Sonido:**
  - Control de un solo toque: `[ 🔊 Activado ]` (verde) / `[ 🔇 Silencio ]` (gris).
  - Desbloqueo Web Audio al primer toque de la pantalla (`pointerdown`, `touchstart`) y melodía acústica inmediata de confirmación al activar.
- **Configuración de WhatsApp SOS con Botón de Guardado:** Pre-carga el número guardado, incluye botón `[ Guardar ]` con mensaje de confirmación verde (*"✓ Guardado"*) y acceso al asistente completo.
- **Botón Senior de Cierre:** Botón grande y de alto contraste `[ ✓ Listo / Guardar y Volver al Juego ]` (52px de altura).

---

## 📣 Sistema Publicitario Interactivo B2B (3 Botones)

Los banners patrocinados superior (`#top-ad-banner`) e inferior (`#bottom-ad-banner`) respetan la concentración del jugador sin videos ruidosos ni pantallas emergentes agresivas. Incluyen 3 botones directos:

1. 🌐 **Web:** Redirige al sitio web de la marca patrocinadora.
2. ❤️ **Donar:** Conduce a [caretechservices.com/donar/](https://caretechservices.com/donar/) para apoyo voluntario con PayPal/Tarjeta.
3. 🛒 **Anunciar:** Conduce a [caretechservices.com/publicidad/](https://caretechservices.com/publicidad/) para que nuevos negocios contraten pautas.

---

## 📊 Arquitectura de Telemetría y Registro de Usuarios

### Modelo Híbrido: Local-First + Backend Seguro
- **Local-First en el Navegador:**
  - `care_device_install_id`: Identificador UUID único por dispositivo.
  - `care_user_name`: Nombre del jugador (ej. *"Abuela Rosa"*).
  - `care_solitaire_stats`: Partidas jugadas, partidas ganadas, rachas, mejor tiempo y récord. Visible al tocar el trofeo dorado **"Partidas"** en el dock inferior.
- **Servidor Central (`portal/api.php`):**
  - **Activaciones (`/games/api.php?action=activate`):** Registro seguro en `data/devices.json` con hash de instalación, país detectado por CDN (Cloudflare/Hostinger), tipo de dispositivo (Móvil/PC) y estado de instalación PWA.
  - **Eventos (`/games/api.php?action=events`):** Registro por lotes no bloqueante en `data/analytics.json` para impresiones y clics.
  - **Telemetría en Vivo (`/games/api.php?action=admin_stats`):** Alimenta el panel [caretechservices.com/games/admin/](https://caretechservices.com/games/admin/) con contadores de hoy, total de dispositivos activos y tabla en vivo de jugadores.

---

## 🛠️ Estructura del Repositorio

```text
├── public/                               ← Hub Principal CareTech Services (HTML/CSS/JS)
│   ├── index.html                        ← Landing institucional & cotizador
│   ├── styles.css                        ← Estilos del Hub
│   ├── app.js                            ← Lógica de cotización y navegación
│   └── [business, health, pets, etc.]    ← Landing pages especializadas por vertical
├── server.js                             ← Servidor Express (Care Loyalty & API Webhooks)
├── package.json                          ← Dependencias Node.js
├── caretech-games-pwa-deployment-v1/     ← Paquete de producción CareGames
│   ├── portal/                           ← Portal de Juegos (/games/)
│   │   ├── index.html                    ← Catálogo de juegos
│   │   ├── api.php                       ← API backend en PHP (banners, activaciones, analítica)
│   │   ├── publicidad/                   ← Tienda comercial de pautas (/publicidad/)
│   │   ├── donar/                        ← Portal de donaciones comunitarias (/donar/)
│   │   ├── admin/                        ← Panel de administración en vivo (/games/admin/)
│   │   └── config/pricing.json           ← Precios de planes publicitarios
│   ├── templates/solitario/              ← Motor del juego Solitario Care PWA
│   │   ├── index.html                    ← Tablero Klondike, FTUX, Banners y Modales
│   │   ├── solitaire.js                  ← Motor de juego, Web Audio y lógica de cartas
│   │   ├── solitaire.css                 ← Estilos visuales del juego y cartas
│   │   ├── care-ui.css                   ← Sistema de diseño oficial CareTech UI
│   │   ├── care-platform.js              ← SDK de rotación de anuncios y telemetría
│   │   ├── sw.js                         ← Service Worker PWA Offline First (v1.4.5)
│   │   ├── register-pwa.js               ← Registro de SW y prompt de instalación
│   │   └── manifest.webmanifest          ← Manifiesto PWA para instalación como app
│   ├── scripts/
│   │   ├── build-package.js              ← Compilador integral del paquete ZIP
│   │   ├── prepare-deploy.js             ← Generador de dist/games/
│   │   └── deploy-hostinger.js           ← Script de despliegue automático SSH2/SFTP
│   └── plugins/
│       └── caretech-games-platform/      ← Plugin WordPress para integración de anuncios
└── HOSTINGER_DEPLOYMENT.md               ← Guía técnica de Node.js en Hostinger
```

---

## 🚀 Despliegue Automatizado a Hostinger

Para compilar y publicar en producción todos los módulos (`/games/`, `/solitario/`, `/publicidad/`, `/donar/`, `/admin/` y el Hub principal):

```bash
cd caretech-games-pwa-deployment-v1
npm run deploy
```

El script ejecuta automáticamente:
1. Compilación de dist con todos los portales y PWA.
2. Generación del paquete comprimido `caretech-games.zip`.
3. Conexión segura por SSH y SFTP al servidor de Hostinger (`5.183.10.22:65002`).
4. Extracción remota y sincronización de permisos (`chmod -R 755`).
5. Sincronización cruzada de rutas para que `/games/solitario/` y `/solitario/` permanezcan idénticas.

---

## 📜 Licencia & Derechos
© 2026 **CareTech Services**. Todos los derechos reservados.  
Plataforma de bienestar y software para la salud.
