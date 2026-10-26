/**
 * CareTech Games - Automated Deployment Preparer
 * Builds dist/games/ ready for Hostinger public_html/games/
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTAL_SRC = path.join(ROOT_DIR, 'portal');
const TEMPLATE_SOLITARIO_SRC = path.join(ROOT_DIR, 'templates', 'solitario');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const GAMES_DIST = path.join(DIST_DIR, 'games');
const SOLITARIO_DIST = path.join(GAMES_DIST, 'solitario');

// Helper to copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function run() {
  console.log('🚀 Preparando paquete de despliegue CareTech Games...');

  // 1. Clean and initialize dist/games/
  if (fs.existsSync(GAMES_DIST)) {
    fs.rmSync(GAMES_DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(SOLITARIO_DIST, { recursive: true });

  // 2. Copy Portal files (/games/)
  console.log('📦 [1/3] Copiando portal de juegos (/games/)...');
  copyDirRecursive(PORTAL_SRC, GAMES_DIST);

  // 3. Process Solitario Game (/games/solitario/)
  const customBuildPath = process.argv[2];
  if (customBuildPath && fs.existsSync(path.resolve(customBuildPath))) {
    const resolvedPath = path.resolve(customBuildPath);
    console.log(`📦 [2/3] Integrando build externo de Cocos Creator desde: ${resolvedPath}...`);
    copyDirRecursive(resolvedPath, SOLITARIO_DIST);

    // Overlay PWA configuration on top of Cocos build
    console.log('✨ Inyectando capa PWA y Service Worker sobre build Cocos...');
    const pwaFiles = [
      'manifest.webmanifest',
      'sw.js',
      'register-pwa.js',
      'offline.html',
      '.htaccess'
    ];
    pwaFiles.forEach((file) => {
      const srcFile = path.join(TEMPLATE_SOLITARIO_SRC, file);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(SOLITARIO_DIST, file));
      }
    });

    // Copy icons
    copyDirRecursive(path.join(TEMPLATE_SOLITARIO_SRC, 'icons'), path.join(SOLITARIO_DIST, 'icons'));

    // Inject register-pwa.js into Cocos index.html if not present
    const cocosIndex = path.join(SOLITARIO_DIST, 'index.html');
    if (fs.existsSync(cocosIndex)) {
      let content = fs.readFileSync(cocosIndex, 'utf8');
      if (!content.includes('register-pwa.js')) {
        content = content.replace('</body>', '  <script src="register-pwa.js"></script>\n</body>');
        if (!content.includes('manifest.webmanifest')) {
          content = content.replace('</head>', '  <link rel="manifest" href="/games/solitario/manifest.webmanifest">\n</head>');
        }
        fs.writeFileSync(cocosIndex, content, 'utf8');
      }
    }
  } else {
    console.log('📦 [2/3] Empaquetando Solitario Care PWA Standalone...');
    copyDirRecursive(TEMPLATE_SOLITARIO_SRC, SOLITARIO_DIST);
  }

  // 4. Verification & Summary
  console.log('✅ [3/3] Paquete de despliegue generado con éxito en:');
  console.log(`   📂 ${GAMES_DIST}`);
  console.log('\nEstructura lista para subir a public_html/games/ en Hostinger:');
  console.log('  ├── index.html          (Portal /games/)');
  console.log('  ├── .htaccess           (Portal config)');
  console.log('  └── solitario/          (Juego PWA /games/solitario/)');
  console.log('      ├── index.html');
  console.log('      ├── manifest.webmanifest');
  console.log('      ├── sw.js');
  console.log('      ├── register-pwa.js');
  console.log('      ├── offline.html');
  console.log('      ├── icons/');
  console.log('      └── .htaccess');
}

run();
