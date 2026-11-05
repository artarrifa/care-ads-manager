# 🎮 CareTech Services & CareGames Platform

Ecosistema integral de salud digital, fidelización de clientes y plataforma de juegos accesibles (**PWA Offline-First**) con teleasistencia de emergencia SOS, diseñado especialmente para adultos mayores, familias, comercios e instituciones de salud.

Desplegado en producción en **[caretechservices.com](https://caretechservices.com)** sobre infraestructura de **Hostinger**.

---

## 🌐 Enlaces Oficiales de Producción (Ecosistema de 6 Pilares)

| Módulo / División | URL de Producción | Descripción |
| :--- | :--- | :--- |
| **🏠 Hub Principal** | [caretechservices.com](https://caretechservices.com) | Portal central unificado que articula las 6 áreas estratégicas de CareTech Services. |
| **🩺 Care Health & Free EHR** | [caretechservices.com/health/](https://caretechservices.com/health/) | **División Flagship**: WeCare App (cifrado grado médico) y la herramienta interactiva **Historia Clínica Salvavidas (Free Online EHR)**. |
| **🕹️ Care Games** | [caretechservices.com/games/](https://caretechservices.com/games/) | Catálogo de estimulación cognitiva libre de ruidos con Teleasistencia SOS para adultos mayores. |
| **🃏 Solitario Care PWA** | [caretechservices.com/games/solitario/](https://caretechservices.com/games/solitario/) | Juego PWA de Solitario Klondike accesible, sin anuncios invasivos, con botón SOS integrado (sincronizado en [/solitario/](https://caretechservices.com/solitario/)). |
| **🏡 Care Real Estate** | [caretechservices.com/real-estate/](https://caretechservices.com/real-estate/) | PropTech y espacios residenciales seguros, arquitectura ergonómica y telemetría no invasiva para la tercera edad. |
| **💼 Care Business & Loyalty** | [caretechservices.com/business/](https://caretechservices.com/business/) | Soluciones B2B con producto estrella **Care Loyalty** (pases nativos en Apple Wallet y Google Wallet). |
| **🐾 Care Pets** | [caretechservices.com/pets/](https://caretechservices.com/pets/) | Bienestar y trazabilidad animal: carnet clínico veterinario digital y placa inteligente QR de auxilio. |
| **💻 Care Development** | [caretechservices.com/development/](https://caretechservices.com/development/) | Consultoría e ingeniería de software a medida, desarrollo Web/PWA, pasarelas de pago e infraestructura cloud. |
| **📣 Publicidad B2B** | [caretechservices.com/publicidad/](https://caretechservices.com/publicidad/) | Portal de patrocinios éticos con simulación interactiva de banners con 3 botones de conversión. |
| **❤️ Donaciones B2C** | [caretechservices.com/donar/](https://caretechservices.com/donar/) | Plataforma comunitaria de micro-donaciones ($1, $3, $5 USD) vía PayPal y tarjeta para sostener el proyecto libre de ruidos. |
| **📊 Panel Administrativo** | [caretechservices.com/games/admin/](https://caretechservices.com/games/admin/) | Monitor en tiempo real de usuarios registrados, activaciones por país y telemetría de clics. |

---

## 🏛️ Arquitectura de los 6 Pilares Estratégicos

### 1. 🩺 Care Health (División Flagship · Máxima Prioridad Visual)
- **WeCare App & Historia Clínica Confidencial:** Aplicación móvil y web de uso 100% privado con cifrado grado médico de extremo a extremo tipo diario personal. Sin agendas comerciales compartidas ni intermediarios. Detección automática de caídas con alertas y coordenadas GPS a contactos clave. Botón CTA directo: **"COMPRAR LICENCIA"** ($19.90 USD/año ≈ $79.900 COP) y enlace a la [App Store de Apple](https://apps.apple.com/co/app/wecareapp/id6673915367).
- **Historia Clínica Salvavidas (Free Online EHR):** Herramienta web inmediata 100% gratuita que genera una ficha médica de rescate (grupo sanguíneo, alergias críticas, medicamentos vitales y contacto SOS) con código QR para paramédicos y cuerpos de emergencia.

### 2. 🕹️ Care Games (Entretenimiento Cognitivo & Bienestar)
- Estimulación cognitiva de memoria de trabajo y agilidad mental sin temporizadores agobiantes.
- 100% libre de ruidos molestos ni anuncios que congelen la pantalla.
- Botón de **Teleasistencia SOS** en pantalla sincronizado con números nacionales oficiales (123, 112, 911) y WhatsApp familiar.
- PWA instalable con funcionamiento completo offline.

### 3. 🏡 Care Real Estate (PropTech & Senior Living)
- Soluciones inmobiliarias y espacios residenciales adaptados para adultos mayores.
- Sensores de presencia y detección pasiva de caídas sin cámaras invasivas.
- Formulario de captura de leads y lista de espera para inversores y familias.

### 4. 💼 Care Business (Care Loyalty & Soluciones B2B)
- **Care Loyalty Flagship:** Tarjetas y pases de lealtad en Apple Wallet y Google Wallet sin descargar apps pesadas.
- Notificaciones push basadas en geolocalización por proximidad comercial.
- Espacios publicitarios éticos con 14.5 minutos de atención real por sesión en CareGames.

### 5. 🐾 Care Pets (Bienestar & Trazabilidad Animal)
- Carnet clínico veterinario digitalizado.
- Placa inteligente QR para rescate inmediato y localización por WhatsApp.
- Recordatorios automáticos de tratamientos, vacunación y desparasitación.

### 6. 💻 Care Development (Software a Medida & Consultoría)
- Desarrollo web de alto rendimiento, aplicaciones PWA y móviles nativas.
- Integración de pasarelas de pago (PayPal, Wompi, Binance Pay) y telemetría médica.
- Auditoría de ciberseguridad y cumplimiento normativo en salud.

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

### 4. Almacenamiento Local Híbrido (IndexedDB y LocalStorage)
- **Ejecución 100% Directa en el Navegador:** Sin plugins de terceros, puentes nativos ni dependencias externas.
- **Auto-Guardado en Tiempo Real:** El estado completo de la partida activa (`tableau`, `foundations`, `stock`, `waste`, `score`, `moves`, `timeSeconds`, `drawMode`, y últimos 15 snapshots de `history` para Deshacer) se guarda automáticamente en cada interacción del jugador.
- **Reanudación Transparente:** Al reabrir la PWA o refrescar el navegador, el motor valida la integridad de las 52 cartas, restaura el tapete en la posición exacta y muestra un aviso visual suave: *"Partida anterior reanudada"*.
- **Sincronización Dual (LocalStorage + IndexedDB):**
  - **`LocalStorage` (`care_solitaire_saved_game`):** Lectura síncrona inmediata con 0 ms de latencia al cargar la interfaz.
  - **`IndexedDB` (`CareTechSolitaireDB`):** Espejo asíncrono estructurado para máxima durabilidad de datos y resistencia ante purgas del sistema operativo.
- **Protección de Ciclo de Vida Móvil:** Detecta eventos `beforeunload` y `visibilitychange` para salvar la partida en segundo plano al bloquear la pantalla o recibir llamadas.
- **Limpieza Inteligente:** La partida guardada se restablece al ganar (`triggerVictory()`) o al pulsar *"Nueva Partida"*, evitando partidas residuales o doble conteo de estadísticas.

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

## 💻 Ejecución y Desarrollo Local

Para probar y visualizar la plataforma en tu máquina local:

### 1. Servidor del Hub Principal y las 6 Subrutas
```bash
# Iniciar servidor local (Node.js nativo)
node server.js
# Acceder en: http://localhost:3000
```
Rutas locales disponibles:
- Hub Principal: `http://localhost:3000/`
- Care Health & Free EHR: `http://localhost:3000/health/`
- Care Real Estate: `http://localhost:3000/real-estate/`
- Care Business & Loyalty: `http://localhost:3000/business/`
- Care Pets: `http://localhost:3000/pets/`
- Care Development: `http://localhost:3000/development/`

### 2. Servidor Local del Portal de Juegos y PWA
```bash
cd caretech-games-pwa-deployment-v1
npm run serve
# Acceder en: http://localhost:8080/games/
```

---

## 🛠️ Estructura del Repositorio

```text
├── public/                               ← Hub Principal CareTech Services (HTML/CSS/JS)
│   ├── index.html                        ← Landing institucional (Hub Central de 6 Pilares)
│   ├── styles.css                        ← Sistema de diseño corporativo CareTech UI
│   ├── app.js                            ← Lógica de checkout, modales de compra y donaciones
│   ├── health/                           ← Área 1: Care Health & Free Online EHR Tool
│   ├── real-estate/                      ← Área 3: Care Real Estate (PropTech Senior Living)
│   ├── business/                         ← Área 4: Care Business & Care Loyalty en Wallets
│   ├── pets/                             ← Área 5: Care Pets (Bienestar & Carnet Animal)
│   └── development/                      ← Área 6: Care Development (Software a Medida)
├── server.js                             ← Servidor HTTP y API para el Hub y las 6 subrutas
├── package.json                          ← Dependencias del proyecto raíz
├── caretech-games-pwa-deployment-v1/     ← Paquete de producción CareGames
│   ├── portal/                           ← Portal de Juegos (/games/)
│   │   ├── index.html                    ← Catálogo de juegos cognitivos
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
│   │   ├── build-package.js              ← Compilador integral del paquete ZIP (6 pilares + subrutas)
│   │   ├── prepare-deploy.js             ← Generador de dist/games/
│   │   └── deploy-hostinger.js           ← Script de despliegue automático SSH2/SFTP
│   └── plugins/
│       └── caretech-games-platform/      ← Plugin WordPress para integración de anuncios
└── HOSTINGER_DEPLOYMENT.md               ← Guía técnica de despliegue en Hostinger
```

---

## 🚀 Despliegue Automatizado a Hostinger

Para compilar y publicar en producción todos los módulos (`/health/`, `/real-estate/`, `/business/`, `/pets/`, `/development/`, `/games/`, `/publicidad/`, `/donar/` y el Hub principal):

```bash
cd caretech-games-pwa-deployment-v1
npm run deploy
```

El script ejecuta automáticamente:
1. Compilación de dist con todos los portales, subrutas del Hub y PWA.
2. Generación del paquete comprimido `caretech-games.zip`.
3. Conexión segura por SSH y SFTP al servidor de Hostinger (`5.183.10.22:65002`).
4. Extracción remota, configuración de `DirectoryIndex index.html index.php` y sincronización de permisos (`chmod -R 755`).
5. Sincronización cruzada de rutas para que `/games/solitario/` y `/solitario/` permanezcan idénticas.

---

## 📜 Licencia & Derechos
© 2026 **CareTech Services**. Todos los derechos reservados.  
Plataforma de bienestar y software para la salud.
