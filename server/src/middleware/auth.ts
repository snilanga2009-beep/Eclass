import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: string;
    teacherId?: string | null;
    studentId?: string | null;
    parentId?: string | null;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'cams_super_secure_jwt_secret_key_2026_lk';
    const decoded = jwt.verify(token, secret) as any;
    
    // Find active user in database
    const user = db.data.users.find(u => u.id === decoded.userId);

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User account is deactivated or not found' });
    }

    const role = db.data.roles.find(r => r.id === user.roleId);

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: role?.name || 'STUDENT',
      teacherId: user.teacherId,
      studentId: user.studentId,
      parentId: user.parentId
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // SUPER_ADMIN has god-mode access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Permission denied. Required role: ${allowedRoles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};
