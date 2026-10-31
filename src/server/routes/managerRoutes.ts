import { Router, Response } from 'express';
import { db } from '../db/database';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireActive,
  requireRole,
  logAudit,
} from '../auth';
import { Task, TaskPriority, TaskCategory } from '../../types';
import { isTaskOverdue } from '../../utils/rbac';

const router = Router();

// Manager routes require authentication, ACTIVE status, and MANAGER or ADMIN role
router.use(authenticateToken);
router.use(requireActive);
router.use(requireRole('MANAGER', 'ADMIN'));

/**
 * GET /api/manager/team
 * Returns the list of direct reporting employees for the manager,
 * enriched with task statistics (total, pending, completed, overdue).
 */
router.get('/team', (req: AuthenticatedRequest, res: Response) => {
  const currentUser = req.user!;
  const managerId =
    currentUser.role === 'ADMIN' && req.query.managerId
      ? String(req.query.managerId)
      : currentUser.id;

  const allUsers = db.getPublicUsers();
  const allTasks = db.getTasks();

  const directReports = allUsers.filter(
    (u) => u.managerId === managerId && u.role === 'EMPLOYEE'
  );

  const teamWithStats = directReports.map((emp) => {
    const empTasks = allTasks.filter((t) => t.assignedToId === emp.id);
    const totalTasks = empTasks.length;
    const completedTasks = empTasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = empTasks.filter(
      (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD'
    ).length;
    const overdueTasks = empTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;

    return {
      employee: emp,
      stats: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
    };
  });

  return res.json({ team: teamWithStats });
});

/**
 * GET /api/manager/team/:employeeId/tasks
 * Validates that the requested employee is a direct report of this manager.
 * If unauthorized, logs a security audit violation and returns 403 Forbidden!
 */
router.get('/team/:employeeId/tasks', (req: AuthenticatedRequest, res: Response) => {
  const { employeeId } = req.params;
  const currentUser = req.user!;

  const targetEmployee = db.findUserById(employeeId);
  if (!targetEmployee) {
    return res.status(404).json({
      error: 'EmployeeNotFound',
      message: 'The requested employee was not found in the directory.',
    });
  }

  // Strict manager scope validation
  if (currentUser.role === 'MANAGER' && targetEmployee.managerId !== currentUser.id) {
    logAudit(
      req,
      'CROSS_MANAGER_UNAUTHORIZED_ACCESS',
      'محاولة وصول غير مصرح لبيانات موظف خارج الفريق',
      `Manager ${currentUser.name} (${currentUser.employeeId}) attempted to access tasks of ${targetEmployee.name} (${targetEmployee.employeeId}) who reports to ${targetEmployee.managerId || 'None'}`,
      `حاول المدير ${currentUser.nameAr} استعراض مهام الموظف ${targetEmployee.nameAr} التابع لمدير آخر`,
      'SECURITY',
      'DENIED',
      employeeId
    );

    return res.status(403).json({
      error: 'Forbidden',
      message:
        'Access Denied: You do not have authorization to view or manage tasks for this employee. This employee does not report to you.',
    });
  }

  const { passwordHash: _, ...safeEmployee } = targetEmployee;
  const employeeTasks = db.getTasksForEmployee(targetEmployee.id);

  return res.json({
    employee: safeEmployee,
    tasks: employeeTasks,
  });
});

/**
 * PUT /api/manager/team/:employeeId/tasks/reorder
 * Reorders tasks for an employee and persists the sequence.
 * Strictly checks manager-employee reporting relationship.
 */
router.put('/team/:employeeId/tasks/reorder', (req: AuthenticatedRequest, res: Response) => {
  const { employeeId } = req.params;
  const currentUser = req.user!;
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds)) {
    return res.status(400).json({
      error: 'InvalidRequest',
      message: 'taskIds array is required for reordering.',
    });
  }

  const targetEmployee = db.findUserById(employeeId);
  if (!targetEmployee) {
    return res.status(404).json({
      error: 'EmployeeNotFound',
      message: 'The requested employee was not found.',
    });
  }

  // Strict manager scope validation
  if (currentUser.role === 'MANAGER' && targetEmployee.managerId !== currentUser.id) {
    logAudit(
      req,
      'CROSS_MANAGER_UNAUTHORIZED_ACCESS',
      'محاولة إعادة ترتيب مهام موظف خارج الفريق',
      `Manager ${currentUser.name} attempted to reorder tasks for employee ${targetEmployee.name} belonging to another reporting line`,
      `حاول المدير ${currentUser.nameAr} إعادة ترتيب مهام الموظف ${targetEmployee.nameAr} خارج فريقه المعتمد`,
      'SECURITY',
      'DENIED',
      employeeId
    );

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: You can only reorder tasks for your authorized direct reports.',
    });
  }

  const reordered = db.reorderTasksForEmployee(employeeId, taskIds);

  logAudit(
    req,
    'TASK_REORDER',
    'إعادة ترتيب مهام الموظف',
    `Manager ${currentUser.name} reordered ${taskIds.length} tasks for direct report ${targetEmployee.name} (${targetEmployee.employeeId})`,
    `قام المدير ${currentUser.nameAr} بإعادة ترتيب ${taskIds.length} مهام للموظف التابع ${targetEmployee.nameAr}`,
    'TASK',
    'SUCCESS',
    employeeId
  );

  return res.json({
    tasks: reordered,
    message: 'Tasks reordered and persisted successfully',
  });
});

/**
 * POST /api/manager/team/:employeeId/tasks
 * Dedicated task allocation endpoint for an employee.
 * Validates reporting relationship before creating the task.
 */
router.post('/team/:employeeId/tasks', (req: AuthenticatedRequest, res: Response) => {
  const { employeeId } = req.params;
  const currentUser = req.user!;
  const {
    title,
    titleAr,
    description,
    descriptionAr,
    priority = 'MEDIUM',
    category = 'GENERAL',
    dueDate,
    specialInstructions,
  } = req.body;

  const targetEmployee = db.findUserById(employeeId);
  if (!targetEmployee) {
    return res.status(404).json({
      error: 'EmployeeNotFound',
      message: 'The requested employee was not found.',
    });
  }

  if (targetEmployee.status !== 'ACTIVE') {
    return res.status(400).json({
      error: 'EmployeeNotActive',
      message: `Cannot assign tasks to employee with status: ${targetEmployee.status}`,
    });
  }

  // Strict manager scope validation
  if (currentUser.role === 'MANAGER' && targetEmployee.managerId !== currentUser.id) {
    logAudit(
      req,
      'UNAUTHORIZED_TASK_ALLOCATION_ATTEMPT',
      'محاولة تكليف مهمة لموظف خارج الفريق',
      `Manager ${currentUser.name} attempted to allocate task to employee ${targetEmployee.name} belonging to another reporting line`,
      `حاول المدير ${currentUser.nameAr} تكليف الموظف ${targetEmployee.nameAr} خارج فريقه المعتمد`,
      'SECURITY',
      'DENIED',
      employeeId
    );

    return res.status(403).json({
      error: 'Forbidden',
      message:
        'Access Denied: You can only allocate tasks to your authorized direct reports.',
    });
  }

  if (!title || !description || !dueDate) {
    return res.status(400).json({
      error: 'MissingRequiredFields',
      message: 'Title, description, and due date are required',
    });
  }

  const taskId = `tsk-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
  const now = new Date().toISOString();

  const comments = [
    {
      id: `com-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content: 'Task created and allocated.',
      createdAt: now,
    },
  ];

  if (specialInstructions && specialInstructions.trim()) {
    comments.push({
      id: `com-${Date.now() + 1}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content: `Special Instructions: ${specialInstructions.trim()}`,
      createdAt: now,
    });
  }

  const newTask: Task = {
    id: taskId,
    title: title.trim(),
    titleAr: titleAr?.trim() || title.trim(),
    description: description.trim(),
    descriptionAr: descriptionAr?.trim() || description.trim(),
    assignedToId: targetEmployee.id,
    assignedById: currentUser.id,
    priority: priority as TaskPriority,
    status: 'ASSIGNED',
    category: category as TaskCategory,
    allocationDate: now,
    dueDate: new Date(dueDate).toISOString(),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    progress: 0,
    attachments: [],
    comments,
  };

  db.addTask(newTask);

  // Send instant in-app notification to the assigned employee
  db.addNotification({
    id: `notif-${Date.now()}`,
    recipientUserId: targetEmployee.id,
    taskId: newTask.id,
    title: 'New Task Assigned',
    titleAr: 'تم تكليفك بمهمة جديدة',
    message: `${currentUser.name} assigned you "${newTask.title}". Deadline: ${new Date(dueDate).toLocaleDateString()}`,
    messageAr: `قام ${currentUser.nameAr} بتكليفك بمهمة "${newTask.titleAr}". تاريخ الاستحقاق: ${new Date(dueDate).toLocaleDateString()}`,
    read: false,
    createdAt: now,
    type: 'ASSIGNMENT',
  });

  logAudit(
    req,
    'TASK_ALLOCATION',
    'تكليف مهمة جديدة',
    `Allocated task "${newTask.title}" to direct report ${targetEmployee.name} (${targetEmployee.employeeId})`,
    `تم تكليف المهمة "${newTask.titleAr}" إلى المرؤوس المباشر ${targetEmployee.nameAr}`,
    'TASK',
    'SUCCESS',
    newTask.id
  );

  return res.status(201).json({
    task: newTask,
    message: 'Task allocated successfully to direct report',
  });
});

export default router;
