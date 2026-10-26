/**
 * CareTech Games - Local Development & Testing Server
 * Serves http://localhost:8080/games/ and http://localhost:8080/games/solitario/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_GAMES = path.join(ROOT_DIR, 'dist', 'games');

// Auto-run prepare if dist/games does not exist
if (!fs.existsSync(DIST_GAMES)) {
  console.log('⚡ dist/games/ no encontrado. Ejecutando prepare-deploy...');
  execSync('node scripts/prepare-deploy.js', { cwd: ROOT_DIR, stdio: 'inherit' });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];

  // Redirect root to /games/
  if (reqUrl === '/' || reqUrl === '') {
    res.writeHead(302, { Location: '/games/' });
    res.end();
    return;
  }

  // Ensure request is inside /games/
  if (!reqUrl.startsWith('/games')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found - Only /games/ is served');
    return;
  }

  // Strip leading /games/
  let subPath = reqUrl.substring('/games'.length);
  if (subPath.startsWith('/')) subPath = subPath.substring(1);

  let filePath = path.join(DIST_GAMES, subPath);

  // If directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    // Try if asking for /games/solitario without trailing slash
    if (fs.existsSync(filePath + '/index.html')) {
      res.writeHead(301, { Location: reqUrl + '/' });
      res.end();
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Set Service Worker allowed header if sw.js
  const headers = { 'Content-Type': contentType };
  if (filePath.endsWith('sw.js')) {
    headers['Service-Worker-Allowed'] = '/games/solitario/';
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log('🎮 ===================================================');
  console.log('🚀 CareTech Games Server en ejecución');
  console.log(`🌐 Portal:    http://localhost:${PORT}/games/`);
  console.log(`🃏 Solitario: http://localhost:${PORT}/games/solitario/`);
  console.log('🎮 ===================================================');
});
