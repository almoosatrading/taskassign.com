import { Router, Response } from 'express';
import { db } from '../db/database';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireActive,
  requireRole,
  logAudit,
} from '../auth';
import { Task, TaskPriority, TaskStatus, TaskCategory } from '../../types';

const router = Router();

// All task routes require authentication and an ACTIVE account status
router.use(authenticateToken);
router.use(requireActive);

/**
 * GET /api/tasks
 * Strictly authorized role-based task listing:
 * - Admin: view all tasks across company
 * - Manager: view tasks assigned to or created for their active direct reports
 * - Employee: view strictly only tasks assigned to their own user ID
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const currentUser = req.user!;
  const allTasks = db.getTasks();
  const allUsers = db.getUsers();

  if (currentUser.role === 'ADMIN') {
    return res.json({ tasks: allTasks });
  }

  if (currentUser.role === 'MANAGER') {
    const directReportIds = allUsers
      .filter((u) => u.managerId === currentUser.id && u.status === 'ACTIVE')
      .map((u) => u.id);

    const teamTasks = allTasks.filter(
      (t) => t.assignedById === currentUser.id || directReportIds.includes(t.assignedToId)
    );
    return res.json({ tasks: teamTasks });
  }

  // Employee: strictly personal tasks only
  const personalTasks = allTasks.filter((t) => t.assignedToId === currentUser.id);
  return res.json({ tasks: personalTasks });
});

/**
 * GET /api/tasks/:id
 * Strict task privacy enforcement:
 * - Out-of-scope access returns 404 (to avoid confirming task existence) and logs an audit violation!
 */
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;
  const task = db.findTaskById(id);

  if (!task) {
    return res.status(404).json({ error: 'TaskNotFound', message: 'Task not found' });
  }

  // Authorization check
  let authorized = false;

  if (currentUser.role === 'ADMIN') {
    authorized = true;
  } else if (currentUser.role === 'MANAGER') {
    const allUsers = db.getUsers();
    const isDirectReport = allUsers.some(
      (u) => u.id === task.assignedToId && u.managerId === currentUser.id
    );
    authorized = task.assignedById === currentUser.id || isDirectReport;
  } else if (currentUser.role === 'EMPLOYEE') {
    authorized = task.assignedToId === currentUser.id;
  }

  if (!authorized) {
    // Record security audit log for cross-employee unauthorized query attempt
    logAudit(
      req,
      'TASK_PRIVACY_CHECK',
      'فحص خصوصية المهام',
      `Unauthorized attempt by ${currentUser.name} (${currentUser.role}) to access task ${id} assigned to ${task.assignedToId}. Access blocked with 404.`,
      `محاولة غير مصرح بها للوصول للمهمة ${id} الموكلة لموظف آخر. تم الحجب.`,
      'SECURITY',
      'DENIED',
      id
    );

    // Return 404 per specification: confirming existence is itself a leak
    return res.status(404).json({ error: 'TaskNotFound', message: 'Task not found' });
  }

  return res.json({ task });
});

/**
 * POST /api/tasks
 * Manager only (or Admin): Create and allocate task to authorized direct report
 * Backend strictly validates that the assigned employee reports to this manager!
 */
router.post('/', requireRole('MANAGER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const currentUser = req.user!;
  const {
    title,
    titleAr,
    description,
    descriptionAr,
    assignedToId,
    priority = 'MEDIUM',
    category = 'GENERAL',
    dueDate,
  } = req.body;

  if (!title || !description || !assignedToId || !dueDate) {
    return res.status(400).json({
      error: 'MissingRequiredFields',
      message: 'Title, description, assigned employee, and due date are required',
    });
  }

  // Find the assignee
  const assignee = db.findUserById(assignedToId);
  if (!assignee) {
    return res.status(404).json({ error: 'EmployeeNotFound', message: 'Assigned employee does not exist' });
  }

  // Verify assignee is active
  if (assignee.status !== 'ACTIVE') {
    return res.status(400).json({
      error: 'EmployeeNotActive',
      message: `Cannot assign tasks to employee with status: ${assignee.status}`,
    });
  }

  // CRITICAL REQUIREMENT: Validate employee-manager reporting relationship
  if (currentUser.role === 'MANAGER' && assignee.managerId !== currentUser.id) {
    logAudit(
      req,
      'TASK_SCOPE_VIOLATION',
      'انتهاك نطاق تكليف المهام',
      `Manager ${currentUser.name} attempted to allocate task to employee ${assignee.name} who reports to ${assignee.managerId}`,
      `حاول المدير ${currentUser.nameAr} تكليف موظف يتبع مديراً آخر`,
      'SECURITY',
      'DENIED'
    );

    return res.status(403).json({
      error: 'InvalidManagerScope',
      message: 'A manager can only allocate tasks to their own direct reports assigned by Admin.',
    });
  }

  const taskId = `tsk-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
  const now = new Date().toISOString();

  const newTask: Task = {
    id: taskId,
    title: title.trim(),
    titleAr: titleAr?.trim() || title.trim(),
    description: description.trim(),
    descriptionAr: descriptionAr?.trim() || description.trim(),
    assignedToId,
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
    comments: [
      {
        id: `com-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        content: 'Task created and allocated.',
        createdAt: now,
      },
    ],
  };

  db.addTask(newTask);

  // Send instant in-app notification to the assigned employee
  db.addNotification({
    id: `notif-${Date.now()}`,
    recipientUserId: assignedToId,
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
    `Allocated task "${newTask.title}" to ${assignee.name} (${assignee.employeeId}), Due: ${newTask.dueDate}`,
    `تم تكليف المهمة "${newTask.titleAr}" إلى ${assignee.nameAr}`,
    'TASK',
    'SUCCESS',
    newTask.id
  );

  return res.status(201).json({ task: newTask, message: 'Task allocated successfully' });
});

/**
 * PATCH /api/tasks/:id/status
 * Update task progress and status
 */
router.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;
  const { status, progress } = req.body;

  const task = db.findTaskById(id);
  if (!task) return res.status(404).json({ error: 'TaskNotFound' });

  // Only the assigned employee or manager (or Admin) can update
  const isAssignee = task.assignedToId === currentUser.id;
  const isManager = task.assignedById === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isAssignee && !isManager && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to update this task' });
  }

  const updates: Partial<Task> = {};
  if (status !== undefined) updates.status = status as TaskStatus;
  if (progress !== undefined) updates.progress = Number(progress);

  if (status === 'COMPLETED') {
    updates.completedAt = new Date().toISOString();
    updates.progress = 100;
  }

  const updatedTask = db.updateTask(id, updates);

  // Notify counterpart
  const recipientId = isAssignee ? task.assignedById : task.assignedToId;
  const now = new Date().toISOString();

  db.addNotification({
    id: `notif-${Date.now()}`,
    recipientUserId: recipientId,
    taskId: task.id,
    title: 'Task Status Updated',
    titleAr: 'تحديث حالة المهمة',
    message: `${currentUser.name} updated "${task.title}" to ${status || task.status} (${updates.progress ?? task.progress}%)`,
    messageAr: `قام ${currentUser.nameAr} بتحديث حالة المهمة "${task.titleAr}" إلى ${status || task.status}`,
    read: false,
    createdAt: now,
    type: 'STATUS_CHANGE',
  });

  logAudit(
    req,
    'TASK_UPDATE',
    'تحديث حالة المهمة',
    `Updated task ${task.id} to status ${status || task.status}, progress: ${updates.progress ?? task.progress}%`,
    `تحديث حالة المهمة ${task.id} إلى ${status || task.status}`,
    'TASK',
    'SUCCESS',
    task.id
  );

  return res.json({ task: updatedTask });
});

/**
 * POST /api/tasks/:id/comments
 * Add discussion comment
 */
router.post('/:id/comments', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  const task = db.findTaskById(id);
  if (!task) return res.status(404).json({ error: 'TaskNotFound' });

  const isAssignee = task.assignedToId === currentUser.id;
  const isManager = task.assignedById === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isAssignee && !isManager && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const newComment = {
    id: `com-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedTask = db.updateTask(id, {
    comments: [...task.comments, newComment],
  });

  // Notify counterpart
  const recipientId = isAssignee ? task.assignedById : task.assignedToId;
  db.addNotification({
    id: `notif-${Date.now()}`,
    recipientUserId: recipientId,
    taskId: task.id,
    title: 'New Comment on Task',
    titleAr: 'تعليق جديد على المهمة',
    message: `${currentUser.name}: "${content.trim().slice(0, 80)}"`,
    messageAr: `أضاف ${currentUser.nameAr} تعليقاً على المهمة`,
    read: false,
    createdAt: new Date().toISOString(),
    type: 'STATUS_CHANGE',
  });

  return res.status(201).json({ task: updatedTask });
});

/**
 * POST /api/tasks/:id/attachments
 * Add file attachment record
 */
router.post('/:id/attachments', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;
  const { name, sizeBytes = 1048576, type = 'application/pdf' } = req.body;

  if (!name) return res.status(400).json({ error: 'File name is required' });

  const task = db.findTaskById(id);
  if (!task) return res.status(404).json({ error: 'TaskNotFound' });

  const isAssignee = task.assignedToId === currentUser.id;
  const isManager = task.assignedById === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isAssignee && !isManager && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const newAtt = {
    id: `att-${Date.now()}`,
    name,
    sizeBytes,
    type,
    url: '#',
    uploadedAt: new Date().toISOString(),
    uploadedById: currentUser.id,
    uploadedByName: currentUser.name,
  };

  const updatedTask = db.updateTask(id, {
    attachments: [...task.attachments, newAtt],
  });

  logAudit(
    req,
    'ATTACHMENT_UPLOAD',
    'إرفاق ملف',
    `Attached document ${name} (${sizeBytes} bytes) to task ${task.id}`,
    `تم إرفاق المستند ${name} بالمهمة ${task.id}`,
    'TASK',
    'SUCCESS',
    task.id
  );

  return res.status(201).json({ task: updatedTask });
});

export default router;
