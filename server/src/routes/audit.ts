import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/audit - List audit trail logs
router.get('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res: Response) => {
  const { action, search } = req.query;
  let logs = [...db.data.auditLogs];

  if (action && action !== 'ALL') {
    logs = logs.filter(l => l.action === action);
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    logs = logs.filter(l => 
      (l.userName && l.userName.toLowerCase().includes(q)) ||
      l.action.toLowerCase().includes(q) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  }

  return res.json(logs.slice(0, 100));
});

export default router;
