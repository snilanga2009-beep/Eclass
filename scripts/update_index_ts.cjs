const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'server', 'src', 'index.ts');
let code = fs.readFileSync(indexPath, 'utf8');

if (!code.includes("import faceRoutes from './routes/face';")) {
  code = code.replace(
    "import attendanceRoutes from './routes/attendance';",
    "import attendanceRoutes from './routes/attendance';\r\nimport faceRoutes from './routes/face';"
  );
}

if (!code.includes("app.use(['/api/face', '/face'], faceRoutes);")) {
  code = code.replace(
    "app.use(['/api/attendance', '/attendance'], attendanceRoutes);",
    "app.use(['/api/attendance', '/attendance'], attendanceRoutes);\r\napp.use(['/api/face', '/face'], faceRoutes);"
  );
}

fs.writeFileSync(indexPath, code, 'utf8');
console.log('index.ts updated with face routes');
