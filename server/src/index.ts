import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import db from './db';
import { seedDatabase } from './seed';

// Routes
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import classRoutes from './routes/classes';
import attendanceRoutes from './routes/attendance';
import paymentRoutes from './routes/payments';
import pendingFeeRoutes from './routes/pendingFees';
import accountingRoutes from './routes/accounting';
import teacherRoutes from './routes/teachers';
import examRoutes from './routes/exams';
import materialRoutes from './routes/materials';
import messagingRoutes from './routes/messaging';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import auditRoutes from './routes/audit';
import dashboardRoutes from './routes/dashboard';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aggressive Cache-Control Header: Prevent browsers and proxies from serving stale data
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Ensure database is initialized with default users/roles in serverless environments (e.g. Vercel)
let initPromise: Promise<void> | null = null;
app.use(async (req, res, next) => {
  try {
    if ((!db.data.users || db.data.users.length === 0) && (!db.data.students || db.data.students.length === 0)) {
      if (!initPromise) {
        initPromise = seedDatabase().catch(err => {
          console.error('[DB Init Error]:', err);
          initPromise = null;
        });
      }
      await initPromise;
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
  next();
});

// Cache clearing & database synchronization endpoint
app.all(['/api/clear-cache', '/clear-cache', '/api/settings/clear-cache'], (req, res) => {
  try {
    db.reload();
    return res.json({
      success: true,
      message: 'Server cache cleared and database reloaded from disk.',
      timestamp: new Date().toISOString(),
      counts: {
        students: db.data.students.length,
        classes: db.data.classes.length,
        attendances: db.data.attendances.length,
        payments: db.data.payments.length,
        feeRecords: db.data.feeRecords.length,
        users: db.data.users.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reload database: ' + err.message });
  }
});

// Static files for uploaded materials / photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Register API Routes (support both /api/* and direct /* paths for serverless compatibility)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/students', '/students'], studentRoutes);
app.use(['/api/classes', '/classes'], classRoutes);
app.use(['/api/attendance', '/attendance'], attendanceRoutes);
app.use(['/api/payments', '/payments'], paymentRoutes);
app.use(['/api/pending-fees', '/pending-fees'], pendingFeeRoutes);
app.use(['/api/accounting', '/accounting'], accountingRoutes);
app.use(['/api/teachers', '/teachers'], teacherRoutes);
app.use(['/api/exams', '/exams'], examRoutes);
app.use(['/api/materials', '/materials'], materialRoutes);
app.use(['/api/messaging', '/messaging'], messagingRoutes);
app.use(['/api/reports', '/reports'], reportRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);
app.use(['/api/audit', '/audit'], auditRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);

// Health check and API ping endpoints
app.get(['/api/health', '/health', '/api'], (req, res) => {
  res.json({ status: 'ok', name: 'Class Accounting Management System (CAMS) API', time: new Date() });
});

// Serve frontend static build in production (Vite SPA)
const possibleClientDistPaths = [
  path.join(__dirname, '..', '..', 'client', 'dist'),
  path.join(__dirname, '..', '..', 'dist'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), 'dist')
];

const foundClientDist = possibleClientDistPaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (foundClientDist) {
  console.log(`[Static] Serving frontend SPA from: ${foundClientDist}`);
  app.use(express.static(foundClientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(foundClientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'ok', name: 'Class Accounting Management System (CAMS) API', time: new Date() });
  });
}

// Seed data and start server
async function startServer() {
  try {
    await seedDatabase();
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 CAMS API Server running on port ${PORT}`);
      console.log(`📡 Local Host:    http://localhost:${PORT}`);
      
      // Enumerate network interfaces for multi-PC and Android LAN access
      try {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        for (const netName of Object.keys(networkInterfaces)) {
          for (const net of networkInterfaces[netName] || []) {
            if (net.family === 'IPv4' && !net.internal) {
              console.log(`🌐 Network (LAN):  http://${net.address}:${PORT}`);
              console.log(`📱 Client App URL: http://${net.address}:3000 (Windows/Android)`);
            }
          }
        }
      } catch (e) {}
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start CAMS server:', error);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
