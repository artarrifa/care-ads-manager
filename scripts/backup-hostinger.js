/**
 * Backup Hostinger - CareTech Services
 * Creates a compressed backup of domains/caretechservices.com/public_html
 * and downloads it to the local backups/ directory.
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

const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupFilename = `backup_caretechservices_${dateStr}.tar.gz`;
const remoteTempPath = `/tmp/${backupFilename}`;
const localBackupDir = path.resolve(__dirname, '../backups');
const localBackupPath = path.join(localBackupDir, backupFilename);

if (!fs.existsSync(localBackupDir)) {
  fs.mkdirSync(localBackupDir, { recursive: true });
}

console.log('=====================================================');
console.log('📦 INICIANDO RESPALDO COMPLETO DE HOSTINGER');
console.log(`🌐 Servidor: ${config.host}:${config.port} (${config.username})`);
console.log(`📁 Destino local: ${localBackupPath}`);
console.log('=====================================================');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ [1/4] Conexión SSH establecida con éxito.');

  // Step 1: Create remote compressed tar.gz
  const createArchiveCmd = `cd domains/caretechservices.com && tar --exclude='*.tar.gz' --exclude='*.zip' -czf ${remoteTempPath} public_html && ls -lh ${remoteTempPath}`;
  console.log('🗜️  [2/4] Generando archivo comprimido en el servidor remoto...');

  conn.exec(createArchiveCmd, (err, stream) => {
    if (err) {
      console.error('❌ Error creando archivo en el servidor:', err);
      conn.end();
      process.exit(1);
    }

    let stdout = '';
    stream.on('data', d => stdout += d.toString());
    stream.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Error al empaquetar en el servidor remoto. Código:', code);
        conn.end();
        process.exit(1);
      }

      console.log('✅ Archivo comprimido generado en el servidor:');
      console.log('   ' + stdout.trim());

      // Step 2: Download via SFTP
      console.log(`📥 [3/4] Descargando respaldo a ${localBackupPath}...`);
      conn.sftp((sftpErr, sftp) => {
        if (sftpErr) {
          console.error('❌ Error iniciando SFTP:', sftpErr);
          conn.end();
          process.exit(1);
        }

        sftp.fastGet(remoteTempPath, localBackupPath, (downloadErr) => {
          if (downloadErr) {
            console.error('❌ Error descargando archivo:', downloadErr);
            conn.end();
            process.exit(1);
          }

          const stats = fs.statSync(localBackupPath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`✅ Respaldo descargado exitosamente: ${sizeMB} MB`);

          // Step 3: Clean up remote file
          console.log('🧹 [4/4] Limpiando archivo temporal en el servidor...');
          conn.exec(`rm -f ${remoteTempPath}`, () => {
            console.log('=====================================================');
            console.log('🎉 RESPALDO COMPLETADO CON ÉXITO');
            console.log(`📂 Archivo local: ${localBackupPath}`);
            console.log(`📊 Tamaño: ${sizeMB} MB (${stats.size} bytes)`);
            console.log('=====================================================');
            conn.end();
            process.exit(0);
          });
        });
      });
    });
  });
});

conn.on('error', (err) => {
  console.error('❌ Error de conexión SSH:', err.message);
  process.exit(1);
});

conn.connect(config);
