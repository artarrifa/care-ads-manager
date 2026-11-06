/**
 * Build & Package script for CareTech Services & CareGames
 * Packages:
 * - Root Hub Homepage (public/index.html, styles.css, app.js)
 * - Games Portal (/games/)
 * - B2B Publicidad (/publicidad/)
 * - Donaciones (/donar/)
 * into caretech-games.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPLOY_DIR = path.resolve(__dirname, '..');
const ROOT_WORKSPACE = path.resolve(DEPLOY_DIR, '..');
const PUBLIC_DIR = path.join(ROOT_WORKSPACE, 'public');
const DIST_DIR = path.join(DEPLOY_DIR, 'dist');
const PORTAL_DIR = path.join(DEPLOY_DIR, 'portal');

console.log('📦 Iniciando compilación del paquete de producción CareTech Services...');

// 1. Prepare games portal
execSync('node scripts/prepare-deploy.js', { cwd: DEPLOY_DIR, stdio: 'inherit' });

// 2. Copy Root Hub files from public/ into dist/
console.log('📄 [1/3] Copiando Hub Principal (index.html, styles.css, app.js)...');
fs.copyFileSync(path.join(PUBLIC_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
fs.copyFileSync(path.join(PUBLIC_DIR, 'styles.css'), path.join(DIST_DIR, 'styles.css'));
fs.copyFileSync(path.join(PUBLIC_DIR, 'app.js'), path.join(DIST_DIR, 'app.js'));

// 3. Copy subroutes (health, real-estate, business, pets, development, publicidad, donar) into dist/
console.log('📣 [2/3] Copiando las 6 subrutas y secciones corporativas...');
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Subrutas del ecosistema desde public/
copyDirRecursive(path.join(PUBLIC_DIR, 'health'), path.join(DIST_DIR, 'health'));
copyDirRecursive(path.join(PUBLIC_DIR, 'real-estate'), path.join(DIST_DIR, 'real-estate'));
copyDirRecursive(path.join(PUBLIC_DIR, 'business'), path.join(DIST_DIR, 'business'));
copyDirRecursive(path.join(PUBLIC_DIR, 'pets'), path.join(DIST_DIR, 'pets'));
copyDirRecursive(path.join(PUBLIC_DIR, 'development'), path.join(DIST_DIR, 'development'));

// Secciones auxiliares y Portal Unificado de Pagos desde portal/
copyDirRecursive(path.join(PORTAL_DIR, 'publicidad'), path.join(DIST_DIR, 'publicidad'));
copyDirRecursive(path.join(PORTAL_DIR, 'donar'), path.join(DIST_DIR, 'donar'));
copyDirRecursive(path.join(PORTAL_DIR, 'pagos'), path.join(DIST_DIR, 'pagos'));
fs.copyFileSync(path.join(PORTAL_DIR, 'api.php'), path.join(DIST_DIR, 'api.php'));
fs.copyFileSync(path.join(PORTAL_DIR, 'api.php'), path.join(DIST_DIR, 'games', 'api.php'));

// Sincronizar en public/ para consistencia local
copyDirRecursive(path.join(PORTAL_DIR, 'pagos'), path.join(PUBLIC_DIR, 'pagos'));
copyDirRecursive(path.join(PORTAL_DIR, 'donar'), path.join(PUBLIC_DIR, 'donar'));
copyDirRecursive(path.join(PORTAL_DIR, 'publicidad'), path.join(PUBLIC_DIR, 'publicidad'));

// 4. Create caretech-games.zip
console.log('🗜️  [3/3] Comprimiendo caretech-games.zip...');
const zipDeployPath = path.join(DEPLOY_DIR, 'caretech-games.zip');
const zipRootPath = path.join(ROOT_WORKSPACE, 'caretech-games.zip');

if (fs.existsSync(zipDeployPath)) fs.unlinkSync(zipDeployPath);
if (fs.existsSync(zipRootPath)) fs.unlinkSync(zipRootPath);

execSync('zip -r ../caretech-games.zip index.html styles.css app.js api.php games health real-estate business pets development publicidad donar pagos', {
  cwd: DIST_DIR,
  stdio: 'inherit'
});

fs.copyFileSync(zipDeployPath, zipRootPath);
console.log('✅ Paquete caretech-games.zip generado exitosamente con el Hub y los 6 pilares:');
console.log(`   📂 ${zipDeployPath}`);
console.log(`   📂 ${zipRootPath}`);
