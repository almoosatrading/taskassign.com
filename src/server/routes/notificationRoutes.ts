import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateToken, AuthenticatedRequest } from '../auth';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/notifications
 * Returns notifications for currently logged in user
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const list = db.getNotifications(req.user!.id);
  return res.json({ notifications: list });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.markNotificationAsRead(id, req.user!.id);
  return res.json({ success: true });
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
router.post('/mark-all-read', (req: AuthenticatedRequest, res: Response) => {
  db.markAllNotificationsAsRead(req.user!.id);
  return res.json({ success: true });
});

export default router;
