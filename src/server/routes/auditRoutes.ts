import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../auth';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/audit-logs
 * Admin only: Access immutable security & audit trail
 */
router.get('/audit-logs', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { category, status, search } = req.query;
  let logs = db.getAuditLogs();

  if (category && category !== 'ALL') {
    logs = logs.filter((l) => l.category === category);
  }

  if (status && status !== 'ALL') {
    logs = logs.filter((l) => l.status === status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    logs = logs.filter(
      (l) =>
        l.actorName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.ipAddress.includes(q)
    );
  }

  return res.json({ auditLogs: logs });
});

/**
 * GET /api/analytics
 * Returns system-wide HR KPIs & metrics
 */
router.get('/analytics', (req: AuthenticatedRequest, res: Response) => {
  const users = db.getPublicUsers();
  const tasks = db.getTasks();

  const totalEmployees = users.filter((u) => u.role === 'EMPLOYEE').length;
  const totalManagers = users.filter((u) => u.role === 'MANAGER').length;
  const activeAccounts = users.filter((u) => u.status === 'ACTIVE').length;
  const pendingApprovals = users.filter((u) => u.status === 'PENDING_APPROVAL').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'NEW').length;
  const nowTime = new Date().getTime();
  const overdueTasks = tasks.filter((t) => t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < nowTime).length;

  const onTimeRate = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  // Breakdown by category
  const tasksByCategory: Record<string, number> = {};
  tasks.forEach((t) => {
    tasksByCategory[t.category] = (tasksByCategory[t.category] || 0) + 1;
  });

  // Breakdown by priority
  const tasksByPriority = {
    URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
    HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
    LOW: tasks.filter((t) => t.priority === 'LOW').length,
  };

  return res.json({
    metrics: {
      totalEmployees,
      totalManagers,
      activeAccounts,
      pendingApprovals,
      suspendedCount,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      onTimeRate,
      tasksByCategory,
      tasksByPriority,
    },
  });
});

export default router;
