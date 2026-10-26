# Guía de Despliegue en Hostinger (CareTech Games & Solitario PWA)

Esta guía detalla el proceso para publicar el **Portal de Juegos de CareTech** y el juego **Solitario Care PWA** en tu hosting de Hostinger bajo el dominio **`https://caretechservices.com`**.

---

## 🌐 URLs de Producción

- **Portal de Juegos**: `https://caretechservices.com/games/`
- **Juego Solitario PWA**: `https://caretechservices.com/games/solitario/`

---

## 📁 1. Estructura de Archivos en Hostinger

En el **Administrador de Archivos (File Manager)** de Hostinger, la estructura dentro de `public_html/` quedará organizada de la siguiente manera:

```text
public_html/
├── index.html                    ← Tu sitio web principal de CareTech (¡no se modifica!)
├── loyalty/                      ← Care Loyalty (si está instalado)
└── games/                        ← Carpeta del Portal de Juegos
    ├── index.html                ← Portal CareTech Games
    ├── .htaccess                 ← Reglas de seguridad y caché del portal
    └── solitario/                ← Solitario Care PWA
        ├── index.html            ← Interfaz y motor del juego
        ├── manifest.webmanifest  ← Configuración PWA
        ├── sw.js                 ← Service Worker aislado (/games/solitario/)
        ├── register-pwa.js       ← Script de registro del SW y updates
        ├── offline.html          ← Pantalla offline de cortesía
        ├── icons/                ← Iconos PWA (192x192, 512x512, SVG/PNG)
        ├── .htaccess             ← MIME Types (WASM, JSON, Manifest) y Cache-Control
        └── [assets / audio / js] ← Recursos del juego
```

---

## 🚀 2. Métodos de Publicación

### Opción A: Subir el archivo `caretech-games.zip` (Recomendado y más rápido)

1. En tu máquina local, ejecuta el script de empaquetado si realizaste cambios:
   ```bash
   cd caretech-games-pwa-deployment-v1
   npm run prepare
   ```
   *(También puedes usar directamente el archivo listo `caretech-games.zip` generado).*

2. Ingresa a **[hPanel de Hostinger](https://hpanel.hostinger.com/)**.
3. Selecciona tu dominio `caretechservices.com` y abre **Administrador de Archivos (File Manager)**.
4. Entra a la carpeta `public_html/`.
5. Si no existe la carpeta `games`, créala (`public_html/games/`) y entra en ella.
6. Haz clic en el botón **Subir (Upload)** y sube `caretech-games.zip`.
7. Haz clic derecho sobre el archivo subido y selecciona **Extraer (Extract)** dentro de `public_html/games/`.
8. Asegúrate de que los archivos (`index.html`, `.htaccess`, carpeta `solitario/`) queden directamente en `public_html/games/`.
9. ¡Listo! Puedes borrar el archivo `.zip` para ahorrar espacio.

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
