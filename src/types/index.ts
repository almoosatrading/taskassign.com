/**
 * AlMoosa Trading Company - Secure HR Task Manager
 * Core Full-Stack Type Definitions
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type AccountStatus =
  | 'INVITED'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'
  | 'PENDING'
  | 'UNDER_REVIEW';

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
  status: AccountStatus;
  mustChangePassword?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  createdBy?: string | null;
  approvedBy?: string | null;
  approvalDate?: string | null;
  approvalNotes?: string | null;
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
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
  allocationDate?: string; // ISO
  dueDate: string; // ISO
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  progress: number; // 0 - 100
  position?: number; // Sorting sequence for employee task order
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
  targetRecordId?: string | null;
  category: 'AUTH' | 'TASK' | 'DIRECTORY' | 'APPROVAL' | 'SECURITY';
  status: 'SUCCESS' | 'DENIED';
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId?: string;
  userId?: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  taskId?: string | null;
  read: boolean;
  createdAt: string;
  readDate?: string | null;
  type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'APPROVAL' | 'DEADLINE_ALERT' | 'SYSTEM';
}

export type Language = 'en' | 'ar';

export interface AuthResponse {
  token: string;
  user: User;
}
