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

// GET /api/settings/backup - Export complete database JSON backup
router.get('/backup', authenticateToken, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response) => {
  return res.json(db.data);
});

export default router;
