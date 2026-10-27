# Guía de Despliegue en Hostinger (CareTech Games & Solitario PWA)

Esta guía detalla el proceso para publicar el **Portal de Juegos de CareTech** y el juego **Solitario Care PWA** en tu hosting de Hostinger bajo el dominio **`https://caretechservices.com`**.

---

## 🌐 URLs de Producción

- **Portal de Juegos**: `https://caretechservices.com/games/`
- **Juego Solitario PWA**: `https://caretechservices.com/games/solitario/` (y sincronizado en `/solitario/`)
- **Compra de Publicidad B2B**: `https://caretechservices.com/publicidad/` (y `/games/publicidad/`)
- **Portal de Donaciones B2C**: `https://caretechservices.com/donar/` (y `/games/donar/`)
- **Panel Administrativo en Vivo**: `https://caretechservices.com/games/admin/` (y `/admin/`)
- **Hub Principal**: `https://caretechservices.com`

---

## 📁 1. Estructura de Archivos en Hostinger

En el **Administrador de Archivos (File Manager)** de Hostinger, la estructura dentro de `public_html/` queda organizada de la siguiente manera:

```text
public_html/
├── index.html                    ← Hub Principal CareTech Services
├── styles.css / app.js           ← Estilos y lógica del cotizador principal
├── business/, health/, pets/...  ← Páginas por vertical
├── loyalty/                      ← Care Loyalty (Node.js)
├── publicidad/                   ← Portal B2B de anuncios y patrocinios
├── donar/                        ← Portal B2C de donaciones comunitarias
└── games/                        ← Carpeta del Portal de Juegos
    ├── index.html                ← Portal CareTech Games
    ├── api.php                   ← API PHP (activaciones, analítica y rotación)
    ├── admin/                    ← Panel de administración en vivo
    ├── publicidad/               ← Espejo sincronizado de publicidad
    ├── donar/                    ← Espejo sincronizado de donaciones
    ├── config/pricing.json       ← Tarifario publicitario
    └── solitario/                ← Solitario Care PWA (v1.4.5)
        ├── index.html            ← Interfaz, FTUX y modales
        ├── solitaire.js          ← Motor del juego y Web Audio
        ├── solitaire.css         ← Estilos del juego y cartas
        ├── care-ui.css           ← Sistema visual CareTech UI
        ├── care-platform.js      ← SDK de anuncios y telemetría
        ├── manifest.webmanifest  ← Configuración PWA
        ├── sw.js                 ← Service Worker PWA Offline First (v1.4.5)
        ├── register-pwa.js       ← Registro de Service Worker
        ├── offline.html          ← Pantalla offline de cortesía
        ├── icons/                ← Iconos PWA (192x192, 512x512)
        └── .htaccess             ← MIME Types y caché optimizada
```

---

## 🚀 2. Métodos de Publicación

### Opción A: Despliegue Automatizado por SSH (Recomendado)

Desde la terminal en tu máquina local:
```bash
cd caretech-games-pwa-deployment-v1
npm run deploy
```
Este comando compila el paquete `caretech-games.zip`, se conecta de forma segura a Hostinger vía SSH2/SFTP, sube los archivos y extrae en `public_html/` sincronizando automáticamente los permisos y todas las rutas.

### Opción B: Subida Manual de `caretech-games.zip`

1. En tu máquina local, compila el paquete:
   ```bash
   cd caretech-games-pwa-deployment-v1
   npm run build:zip
   ```
2. Sube `caretech-games.zip` a `public_html/` en el Administrador de Archivos de Hostinger y extráelo directamente.

---

### Opción B: Subir desde Cocos Creator (Si compilas tu propia versión Cocos)

1. Abre Cocos Creator con el proyecto `solitario-care-vp1/cocos-project`.
2. En el menú superior, ve a **Project** → **Build**.
3. Selecciona la plataforma **Web Mobile** y haz clic en **Build**.
4. En tu terminal:
   ```bash
   cd caretech-games-pwa-deployment-v1
   npm run prepare -- ../solitario-care-vp1/cocos-project/build/web-mobile
   ```
5. Sube la carpeta generada `dist/games/` a `public_html/games/` en Hostinger.

---

## 🧪 3. Pruebas Locales antes de Desplegar

Puedes probar todo el ecosistema (Portal + PWA + Service Worker) localmente:

```bash
cd caretech-games-pwa-deployment-v1
npm run serve
```

Abre en tu navegador:
- **Portal**: [http://localhost:8080/games/](http://localhost:8080/games/)
- **Solitario**: [http://localhost:8080/games/solitario/](http://localhost:8080/games/solitario/)

---

## ⚙️ 4. Verificaciones Clave Post-Despliegue

1. **HTTPS Activo**: Las PWAs y los Service Workers requieren conexión segura HTTPS. Verifica que `https://caretechservices.com` tenga su certificado SSL activo en Hostinger.
2. **Registro de Service Worker**:
   - Abre `https://caretechservices.com/games/solitario/` en Google Chrome.
   - Abre DevTools (`F12`) → Pestaña **Application** → **Service Workers**.
   - Verifica que el Service Worker aparezca en estado `activated and running` con `scope: https://caretechservices.com/games/solitario/`.
3. **Instalación PWA**:
   - **En Android (Chrome)**: Debe aparecer la opción o botón "Instalar aplicación".
   - **En iOS (Safari)**: Presiona el botón "Compartir" → "Añadir a pantalla de inicio".
4. **Modo Offline**:
   - En DevTools → Pestaña **Network** → Marca la casilla **Offline** y recarga la página. El juego debe cargar y ser completamente jugable sin conexión a internet.
5. **Aislamiento Total**:
   - El Service Worker solo intercepta `/games/solitario/`. Tu portal `/games/` y tu sitio raíz `caretechservices.com/` no son afectados ni sufren bloqueos de caché.

---

## 📞 Soporte CareTech

Para dudas de integración técnica:
- **Email**: `care@caretechservices.com`
- **WhatsApp Soporte**: `+57 316 473 4660`
- **Sitio Web**: `https://caretechservices.com`
