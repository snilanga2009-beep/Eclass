import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/settings - Get all system settings
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const settingsObj: { [key: string]: string } = {};
  db.data.settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  return res.json(settingsObj);
});

// PUT /api/settings - Update system settings
router.put('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body; // { key: value }

    Object.keys(updates).forEach(key => {
      const existing = db.data.settings.find(s => s.key === key);
      if (existing) {
        existing.value = String(updates[key]);
        existing.updatedAt = new Date().toISOString();
      } else {
        db.data.settings.push({
          id: db.generateId(),
          key,
          value: String(updates[key]),
          category: 'GENERAL',
          updatedAt: new Date().toISOString()
        });
      }
    });

    db.save();
    await logAuditAction(req, 'SETTINGS_UPDATE', `Updated ${Object.keys(updates).length} system settings`);

    const settingsObj: { [key: string]: string } = {};
    db.data.settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    return res.json(settingsObj);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

import fs from 'fs';
import path from 'path';

// GET /api/settings/backup - Export complete database JSON backup
router.get('/backup', authenticateToken, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response) => {
  return res.json(db.data);
});

// POST /api/settings/restore - Restore complete database from backup file
router.post('/restore', authenticateToken, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const backupData = req.body;

    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ error: 'Invalid backup file content. Must be a valid JSON object.' });
    }

    // Safety checks: verify core tables exist
    const requiredArrays = ['users', 'students', 'classes', 'roles'];
    const missingKeys = requiredArrays.filter(k => !Array.isArray(backupData[k]));

    if (missingKeys.length > 0) {
      return res.status(400).json({ 
        error: `Invalid CAMS database backup format. Missing core datasets: ${missingKeys.join(', ')}` 
      });
    }

    // Ensure all standard arrays exist even if some tables were empty in the backup file
    const normalizedData: any = {
      roles: Array.isArray(backupData.roles) ? backupData.roles : [],
      permissions: Array.isArray(backupData.permissions) ? backupData.permissions : [],
      users: Array.isArray(backupData.users) ? backupData.users : [],
      parents: Array.isArray(backupData.parents) ? backupData.parents : [],
      students: Array.isArray(backupData.students) ? backupData.students : [],
      teachers: Array.isArray(backupData.teachers) ? backupData.teachers : [],
      subjects: Array.isArray(backupData.subjects) ? backupData.subjects : [],
      classes: Array.isArray(backupData.classes) ? backupData.classes : [],
      classStudents: Array.isArray(backupData.classStudents) ? backupData.classStudents : [],
      attendanceSessions: Array.isArray(backupData.attendanceSessions) ? backupData.attendanceSessions : [],
      attendances: Array.isArray(backupData.attendances) ? backupData.attendances : [],
      feeRecords: Array.isArray(backupData.feeRecords) ? backupData.feeRecords : [],
      payments: Array.isArray(backupData.payments) ? backupData.payments : [],
      paymentItems: Array.isArray(backupData.paymentItems) ? backupData.paymentItems : [],
      income: Array.isArray(backupData.income) ? backupData.income : [],
      expenses: Array.isArray(backupData.expenses) ? backupData.expenses : [],
      teacherPayments: Array.isArray(backupData.teacherPayments) ? backupData.teacherPayments : [],
      exams: Array.isArray(backupData.exams) ? backupData.exams : [],
      examResults: Array.isArray(backupData.examResults) ? backupData.examResults : [],
      learningMaterials: Array.isArray(backupData.learningMaterials) ? backupData.learningMaterials : [],
      smsLogs: Array.isArray(backupData.smsLogs) ? backupData.smsLogs : [],
      whatsappLogs: Array.isArray(backupData.whatsappLogs) ? backupData.whatsappLogs : [],
      notifications: Array.isArray(backupData.notifications) ? backupData.notifications : [],
      announcements: Array.isArray(backupData.announcements) ? backupData.announcements : [],
      documents: Array.isArray(backupData.documents) ? backupData.documents : [],
      auditLogs: Array.isArray(backupData.auditLogs) ? backupData.auditLogs : [],
      settings: Array.isArray(backupData.settings) ? backupData.settings : []
    };

    // Save pre-restore safety snapshot on the server
    try {
      const backupDir = path.join(__dirname, '..', '..', 'data', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const safetySnapshotPath = path.join(backupDir, `pre_restore_${Date.now()}.json`);
      fs.writeFileSync(safetySnapshotPath, JSON.stringify(db.data, null, 2), 'utf-8');
    } catch (snapshotErr) {
      console.warn('Pre-restore safety snapshot notice:', snapshotErr);
    }

    // Replace in-memory database and persist immediately to db.json and PostgreSQL
    db.data = normalizedData;
    db.save();

    await logAuditAction(req, 'DATABASE_RESTORE', `Restored database: ${normalizedData.students.length} students, ${normalizedData.payments.length} payments, ${normalizedData.classes.length} classes`);

    return res.json({
      success: true,
      message: 'Database backup restored successfully into system and synchronized with PostgreSQL.',
      summary: {
        studentsCount: normalizedData.students.length,
        usersCount: normalizedData.users.length,
        classesCount: normalizedData.classes.length,
        teachersCount: normalizedData.teachers.length,
        paymentsCount: normalizedData.payments.length,
        feeRecordsCount: normalizedData.feeRecords.length,
        attendancesCount: normalizedData.attendances.length,
        restoredAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Failed to restore backup:', error);
    return res.status(500).json({ error: error.message || 'Failed to restore database from backup file' });
  }
});

export default router;
