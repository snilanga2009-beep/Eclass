import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// Static files for uploaded materials / photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pending-fees', pendingFeeRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Class Accounting Management System (CAMS) API', time: new Date() });
});

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
