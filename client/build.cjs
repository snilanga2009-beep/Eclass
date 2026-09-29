const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Build] Current working directory:', process.cwd());

if (fs.existsSync('./client/package.json')) {
  // Running from project root
  console.log('[Build] Detected project root. Building client via --prefix client...');
  execSync('npm run build --prefix client', { stdio: 'inherit' });

  // Guarantee dist exists at both ./dist and ./client/dist
  if (fs.existsSync('./client/dist') && !fs.existsSync('./dist')) {
    try {
      fs.cpSync('./client/dist', './dist', { recursive: true });
      console.log('[Build] Synced ./client/dist -> ./dist');
    } catch (err) {
      console.warn('[Build] Warning syncing dist:', err.message);
    }
  }
} else {
  // Running from inside client/ directory
  console.log('[Build] Detected client directory. Running standard build...');
  execSync('npm run build', { stdio: 'inherit' });

  // Guarantee dist exists at both ./dist and ./client/dist
  if (fs.existsSync('./dist') && !fs.existsSync('./client/dist')) {
    try {
      fs.mkdirSync('./client', { recursive: true });
      fs.cpSync('./dist', './client/dist', { recursive: true });
      console.log('[Build] Synced ./dist -> ./client/dist');
    } catch (err) {
      console.warn('[Build] Warning syncing dist:', err.message);
    }
  }
}

console.log('[Build] All assets built successfully!');
