/**
 * AlMoosa Trading Company - HR Task Manager
 * Core Type Definitions
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED';

export type TaskCategory =
  | 'HR_ONBOARDING'
  | 'DOCUMENTATION'
  | 'COMPLIANCE'
  | 'PROCUREMENT'
  | 'MARKETING'
  | 'OPERATIONS'
  | 'GENERAL';

export interface User {
  id: string;
  name: string;
  nameAr: string;
  employeeId: string;
  email: string;
  role: UserRole;
  department: string;
  departmentAr: string;
  jobTitle: string;
  jobTitleAr: string;
  managerId: string | null;
  avatar: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  mustChangePassword?: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedById: string;
  uploadedByName: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  assignedToId: string;
  assignedById: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  progress: number; // 0 - 100
  attachments: TaskAttachment[];
  comments: TaskComment[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  actionAr: string;
  details: string;
  detailsAr: string;
  category: 'AUTH' | 'TASK' | 'DIRECTORY' | 'SECURITY';
  status: 'SUCCESS' | 'DENIED';
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
  type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'DEADLINE_ALERT' | 'SYSTEM';
}

export type Language = 'en' | 'ar';
