import { Task, TaskPriority, TaskStatus, User } from '../types';

/**
 * Validates whether a manager can assign a task to a given employee.
 * Per AlMoosa HR specification:
 * - Assignee must be ACTIVE.
 * - Assignee's managerId must match the manager's id.
 * - Assignee cannot be a manager or admin.
 */
export function canAssignTask(assigner: User, employee: User): boolean {
  if (employee.status !== 'ACTIVE') return false;
  if (employee.role === 'ADMIN') return false;

  if (assigner.role === 'ADMIN') {
    return true;
  }

  if (assigner.role === 'MANAGER') {
    return employee.managerId === assigner.id;
  }

  return false;
}

/**
 * Enforces task content privacy:
 * - ADMIN has company-wide oversight: can view all tasks across the company.
 * - MANAGER can only view tasks they assigned OR tasks assigned to their active direct reports.
 * - EMPLOYEE can only view tasks assigned to themselves.
 */
export function canViewTask(user: User, task: Task, allUsers: User[]): boolean {
  if (user.role === 'ADMIN') {
    // Admin has full company-wide visibility across all departments
    return true;
  }

  if (user.role === 'EMPLOYEE') {
    return task.assignedToId === user.id;
  }

  if (user.role === 'MANAGER') {
    if (task.assignedById === user.id) return true;
    const directReportIds = allUsers
      .filter((u) => u.managerId === user.id && u.status === 'ACTIVE')
      .map((u) => u.id);
    return directReportIds.includes(task.assignedToId);
  }

  return false;
}

/**
 * Checks if a user is permitted to update a task's status or progress.
 */
export function canUpdateTask(user: User, task: Task): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'EMPLOYEE') {
    return task.assignedToId === user.id;
  }
  if (user.role === 'MANAGER') {
    return task.assignedById === user.id;
  }
  return false;
}

/**
 * Checks if a task is overdue relative to a reference time (or now).
 */
export function isTaskOverdue(dueDateIso: string, status: TaskStatus, referenceDate = new Date()): boolean {
  if (status === 'COMPLETED') return false;
  const due = new Date(dueDateIso).getTime();
  return referenceDate.getTime() > due;
}

/**
 * Calculates remaining hours or days until deadline.
 */
export function getDeadlineCountdown(dueDateIso: string, referenceDate = new Date()): {
  isOverdue: boolean;
  days: number;
  hours: number;
  minutes: number;
} {
  const diffMs = new Date(dueDateIso).getTime() - referenceDate.getTime();
  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((overdueMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((overdueMs / (1000 * 60)) % 60);
    return { isOverdue: true, days, hours, minutes };
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  return { isOverdue: false, days, hours, minutes };
}

/**
 * Formats date strictly in Asia/Riyadh AST (UTC+3)
 */
export function formatRiyadhDateTime(
  dateIso: string,
  locale: 'en' | 'ar' = 'en',
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  }
): string {
  try {
    const date = new Date(dateIso);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      ...options,
      timeZone: 'Asia/Riyadh',
    }).format(date);
  } catch {
    return dateIso;
  }
}

/**
 * Generates official WhatsApp share link with minimal secure metadata (wa.me link).
 * Notice: per spec, never includes confidential task content or passwords, only title and portal reference.
 */
export function generateWhatsAppShareUrl(
  taskTitle: string,
  taskId: string,
  appUrl: string,
  lang: 'en' | 'ar' = 'en'
): string {
  const safePortalLink = `${appUrl || 'https://hrtasks.almoosa.com'}?task=${taskId}`;
  const text =
    lang === 'ar'
      ? `مهمة جديدة عبر بوابة الموسى للموارد البشرية:\n"${taskTitle}"\nيرجى تسجيل الدخول للاطلاع على التفاصيل وإنجازها:\n${safePortalLink}`
      : `New HR Task via AlMoosa HR Portal:\n"${taskTitle}"\nPlease sign in to view details and update progress:\n${safePortalLink}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Filter tasks based on search query, status, priority, and category
 */
export function filterTasks(
  tasks: Task[],
  filters: {
    search?: string;
    status?: TaskStatus | 'ALL';
    priority?: TaskPriority | 'ALL';
    category?: string | 'ALL';
  }
): Task[] {
  return tasks.filter((task) => {
    if (filters.status && filters.status !== 'ALL' && task.status !== filters.status) {
      return false;
    }
    if (filters.priority && filters.priority !== 'ALL' && task.priority !== filters.priority) {
      return false;
    }
    if (filters.category && filters.category !== 'ALL' && task.category !== filters.category) {
      return false;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q) || task.titleAr.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q) || task.descriptionAr.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });
}
