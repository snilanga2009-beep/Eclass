import db from '../db';
import { AuthRequest } from './auth';

export const logAuditAction = async (
  req: AuthRequest,
  action: string,
  details?: string
) => {
  try {
    const entry = {
      id: db.generateId(),
      userId: req.user?.id || null,
      userName: req.user?.name || 'System / Guest',
      userRole: req.user?.role || 'SYSTEM',
      action,
      details: details || null,
      ipAddress: req?.ip || (req?.headers?.['x-forwarded-for'] as string) || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'Unknown Agent',
      createdAt: new Date().toISOString()
    };
    db.data.auditLogs.unshift(entry);
    if (db.data.auditLogs.length > 500) {
      db.data.auditLogs.pop();
    }
    db.save();
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
