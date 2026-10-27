/**
 * Automated deployment script to Hostinger caretechservices.com via SSH2 & SFTP
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// Credentials come only from the environment (never commit them). Prefer an SSH key over a password.
const required = ['HOSTINGER_HOST', 'HOSTINGER_USER'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length || !(process.env.HOSTINGER_SSH_KEY || process.env.HOSTINGER_PASSWORD)) {
  console.error(`Faltan variables: ${[...missing, 'HOSTINGER_SSH_KEY o HOSTINGER_PASSWORD'].join(', ')}`);
  process.exit(1);
}
const config = {
  host: process.env.HOSTINGER_HOST,
  port: Number(process.env.HOSTINGER_PORT || 65002),
  username: process.env.HOSTINGER_USER,
  ...(process.env.HOSTINGER_SSH_KEY
    ? { privateKey: require('fs').readFileSync(process.env.HOSTINGER_SSH_KEY) }
    : { password: process.env.HOSTINGER_PASSWORD }),
  readyTimeout: 30000
};

const zipLocalPath = path.resolve(__dirname, '../caretech-games.zip');
const pluginZipLocalPath = path.resolve(__dirname, '../caretech-games-platform-plugin.zip');
const remoteZipPath = 'domains/caretechservices.com/public_html/caretech-games.zip';
const remotePluginZipPath = 'domains/caretechservices.com/public_html/wp-content/plugins/caretech-games-platform-plugin.zip';
const remoteExtractDir = 'domains/caretechservices.com/public_html';

console.log('🚀 Conectando a Hostinger (caretechservices.com)...');
console.log(`📁 Usando archivo local: ${zipLocalPath}`);

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida con éxito.');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('❌ Error abriendo sesión SFTP:', err);
      conn.end();
      process.exit(1);
    }

    console.log(`📤 [1/2] Subiendo ${zipLocalPath} -> ${remoteZipPath}...`);
    const readStream = fs.createReadStream(zipLocalPath);
    const writeStream = sftp.createWriteStream(remoteZipPath);

    writeStream.on('close', () => {
      console.log('✅ Paquete caretech-games.zip transferido exitosamente.');

      // Also upload WordPress plugin if exists
      if (fs.existsSync(pluginZipLocalPath)) {
        console.log(`📤 [2/2] Subiendo Plugin WP ${pluginZipLocalPath} -> ${remotePluginZipPath}...`);
        const pRead = fs.createReadStream(pluginZipLocalPath);
        const pWrite = sftp.createWriteStream(remotePluginZipPath);

        pWrite.on('close', () => {
          console.log('✅ Plugin WordPress transferido exitosamente.');
          runRemoteExtraction(conn);
        });

        pWrite.on('error', (err) => {
          console.warn('⚠️ No se pudo subir plugin WP directamente, continuando con paquete games:', err.message);
          runRemoteExtraction(conn);
        });

        pRead.pipe(pWrite);
      } else {
        runRemoteExtraction(conn);
      }
    });

    writeStream.on('error', (err) => {
      console.error('❌ Error escribiendo archivo remoto:', err);
      conn.end();
      process.exit(1);
    });

    readStream.pipe(writeStream);
  });
});

function runRemoteExtraction(conn) {
  const cmd = `cd ${remoteExtractDir} && unzip -o caretech-games.zip && rm -f caretech-games.zip && (cp -rf games/solitario . 2>/dev/null || true) && chmod -R 755 games health real-estate business pets development solitario publicidad donar && chmod 644 index.html styles.css app.js && (grep -q "DirectoryIndex index.html index.php" .htaccess || sed -i '1s/^/DirectoryIndex index.html index.php\\n/' .htaccess) && (cd wp-content/plugins && unzip -o caretech-games-platform-plugin.zip 2>/dev/null && rm -f caretech-games-platform-plugin.zip || true) && echo "DEPLOY_COMPLETED_SUCCESSFULLY"`;
  console.log(`🔧 Ejecutando extracción remota: ${cmd}`);

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('❌ Error ejecutando comando remoto:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code, signal) => {
      console.log(`🎉 Despliegue completado con código de salida: ${code}`);
      conn.end();
      process.exit(code === 0 ? 0 : 1);
    }).on('data', (data) => {
      console.log('STDOUT: ' + data.toString().trim());
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data.toString().trim());
    });
  });
}

conn.on('error', (err) => {
  console.error('❌ Error de conexión SSH:', err.message);
  process.exit(1);
});

conn.connect(config);
