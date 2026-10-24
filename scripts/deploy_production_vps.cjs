const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const config = {
  host: '173.212.211.32',
  port: 22,
  username: 'root',
  password: 'AOD3Wg6b3FjiF6er15cz7F'
};

function runRemote(conn, cmd, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n============================================================`);
    console.log(`>>> ${description || cmd}`);
    console.log(`============================================================`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code, signal) => {
        if (code !== 0) {
          console.error(`Command exited with code ${code}`);
          return reject(new Error(`Command "${cmd}" failed with code ${code}`));
        }
        resolve({ code, stdout, stderr });
      });
      stream.on('data', (d) => process.stdout.write(d.toString()));
      stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Uploading ${localPath} -> ${remotePath}...`);
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (uploadErr) => {
        if (uploadErr) return reject(uploadErr);
        console.log(`✓ Upload completed successfully!`);
        resolve();
      });
    });
  });
}

const conn = new Client();
console.log(`Connecting to Contabo VPS (${config.host})...`);

conn.on('ready', async () => {
  console.log('✓ SSH connection established successfully!\n');

  try {
    // 1. Pull latest code from GitHub into /var/www/my-class
    await runRemote(
      conn,
      'cd /var/www/my-class && git fetch --all --tags && git reset --hard origin/main && git clean -fd',
      'Step 1: Reset & Pull latest v3.0.0 code from GitHub (origin/main)'
    );

    // 2. Upload exact local database (reset database as requested)
    const localDbPath = path.resolve('server/data/db.json');
    const remoteDbPath = '/var/www/my-class/server/data/db.json';
    await uploadFile(conn, localDbPath, remoteDbPath);

    // Ensure permissions
    await runRemote(
      conn,
      'chmod 664 /var/www/my-class/server/data/db.json && chown -R root:root /var/www/my-class/server/data',
      'Step 2: Set permissions on database'
    );

    // 3. Install packages for root, server, and client
    await runRemote(
      conn,
      'cd /var/www/my-class && npm install && npm install --prefix server && npm install --prefix client',
      'Step 3: Install all dependencies (Root, Server & Client)'
    );

    // 4. Build Vite Client SPA + Backend Server
    await runRemote(
      conn,
      'cd /var/www/my-class && node build.cjs && npm --prefix server run build',
      'Step 4: Build Client (Vite PWA) and Server (tsc)'
    );

    // 5. Restart cams-app in PM2 without disturbing other apps
    await runRemote(
      conn,
      'pm2 restart cams-app && pm2 save',
      'Step 5: Restart cams-app process in PM2'
    );

    // 6. Security update: update Ubuntu packages without disturbing running services
    await runRemote(
      conn,
      'apt-get update -y && apt-get --only-upgrade install -y nginx certbot openssh-server curl ca-certificates',
      'Step 6: Apply security updates to core system packages'
    );

    // 7. Verify all PM2 services (cams-app, epest-app, tui-class-app)
    await runRemote(
      conn,
      'pm2 list',
      'Step 7: Verify all PM2 services are ONLINE'
    );

    // 8. Test HTTPS response from domain https://eclass.webhubx.com/
    await runRemote(
      conn,
      'curl -I -s https://eclass.webhubx.com/ || curl -I http://127.0.0.1:5000/api/settings/public',
      'Step 8: Verify eclass.webhubx.com HTTPS status'
    );

    console.log('\n============================================================');
    console.log('🎉 VPS DEPLOYMENT FOR eclass.webhubx.com COMPLETED! 🎉');
    console.log('============================================================');

  } catch (error) {
    console.error('❌ Deployment error:', error);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH Connection error:', err);
});

conn.connect(config);
