import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/notifications - User's notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const list = db.data.notifications.filter(n => !n.userId || n.userId === userId);
  return res.json(list.slice(0, 20));
});

// POST /api/notifications/mark-read - Mark all as read
router.post('/mark-read', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  db.data.notifications.forEach(n => {
    if (!n.userId || n.userId === userId) {
      n.isRead = true;
    }
  });
  db.save();
  return res.json({ message: 'Notifications marked as read' });
});

// POST /api/notifications/subscribe - PWA Push Subscription
router.post('/subscribe', authenticateToken, (req: AuthRequest, res: Response) => {
  const { endpoint, keys } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });

  // Store in memory / mock
  return res.json({ message: 'Push notifications registered successfully' });
});

export default router;
