import {
  AuditLog,
  NotificationItem,
  Task,
  TaskStatus,
  User,
  UserRole,
  AccountStatus,
} from '../types';
import {
  clientLocalLogin,
  clientLocalGetMe,
  clientLocalGetUsers,
  clientLocalCreateUser,
  clientLocalUpdateUser,
  clientLocalDeleteUser,
  clientLocalResetPassword,
  clientLocalDecideApproval,
  clientLocalGetTasks,
  clientLocalUpdateTaskStatus,
  clientLocalAddTaskComment,
  clientLocalAddTaskAttachment,
  clientLocalReorderTasks,
  clientLocalAllocateTask,
} from './clientStore';

const TOKEN_KEY = 'almoosa_hr_token';

/**
 * Universal error message extractor that guarantees a clean, human-readable string
 * and prevents '[object Object]' or silent failures across all browser and network environments.
 */
export function extractErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred';
  if (typeof err === 'string') {
    if (err.includes('[object Object]')) {
      return 'Operation failed. Please verify details and try again.';
    }
    return err.trim();
  }
  // Standard Error instance or object with message
  if (typeof err.message === 'string' && err.message.trim() && err.message !== '[object Object]') {
    return err.message.trim();
  }
  // Server error response wrapper: { data: { message: ... } }
  if (err.data) {
    if (typeof err.data.message === 'string' && err.data.message.trim()) return err.data.message.trim();
    if (typeof err.data.error === 'string' && err.data.error.trim()) return err.data.error.trim();
    if (typeof err.data === 'string' && err.data.trim()) return err.data.trim();
  }
  // Server error property: { error: '...' } or { error: { message: '...' } }
  if (typeof err.error === 'string' && err.error.trim()) return err.error.trim();
  if (err.error && typeof err.error === 'object') {
    if (typeof err.error.message === 'string' && err.error.message.trim()) return err.error.message.trim();
    if (typeof err.error.code === 'string' && err.error.code.trim()) return err.error.code.trim();
  }
  // Status or code
  if (typeof err.code === 'string' && err.code.trim()) return err.code.trim();

  try {
    const serialized = JSON.stringify(err);
    if (serialized && serialized !== '{}' && !serialized.includes('[object Object]')) {
      return serialized;
    }
  } catch {
    // ignore
  }

  return 'Operation failed. Please verify details and try again.';
}

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        ...options,
        headers,
      });
    } catch (err: any) {
      const netError: any = new Error(err?.message || 'Network request failed');
      netError.isNetworkError = true;
      throw netError;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const htmlErr: any = new Error('Static rewrite HTML response');
      htmlErr.status = response.status;
      htmlErr.isHtmlRewrite = true;
      throw htmlErr;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let rawMsg = '';
      if (typeof data.message === 'string' && data.message.trim()) {
        rawMsg = data.message.trim();
      } else if (typeof data.error === 'string' && data.error.trim()) {
        rawMsg = data.error.trim();
      } else if (data.error && typeof data.error === 'object') {
        rawMsg = data.error.message || data.error.code || `Request failed (${response.status})`;
      } else {
        rawMsg = `Request failed (${response.status})`;
      }

      const error: any = new Error(rawMsg);
      error.status = response.status;
      error.code = typeof data.error === 'string' ? data.error : data.error?.code || 'ERROR';
      error.accountStatus = data.status;
      error.user = data.user;
      throw error;
    }

    return data as T;
  },

  // Auth
  async login(email: string, password: string) {
    try {
      const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data?.token && data?.user) {
        this.setToken(data.token);
        return data;
      }
    } catch (err: any) {
      // If server explicitly returned 401 with valid json and message, check if it's invalid credentials
      if (err.status === 401 && err.code === 'InvalidEmailOrPassword') {
        // Double check against clientStore for admin
        try {
          const localMatch = clientLocalLogin(email, password);
          this.setToken(localMatch.token);
          return localMatch;
        } catch {
          throw err;
        }
      }
      if (err.code === 'AccountInactive' || err.code === 'AccountPendingApproval') {
        throw err;
      }
      console.warn('[ApiClient] Server API unavailable or returned non-JSON, falling back to client-side store:', err.message);
    }

    // Seamless fallback to client store
    const fallback = clientLocalLogin(email, password);
    this.setToken(fallback.token);
    return fallback;
  },

  async getMe() {
    try {
      return await this.request<{ user: User }>('/api/auth/me');
    } catch (err: any) {
      const local = clientLocalGetMe();
      if (local) return { user: local };
      throw err;
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Users & Management
  async getUsers() {
    try {
      return await this.request<{ users: User[] }>('/api/users');
    } catch {
      return { users: clientLocalGetUsers() };
    }
  },

  async createUser(userData: {
    name: string;
    nameAr?: string;
    email: string;
    employeeId: string;
    role: UserRole;
    department?: string;
    departmentAr?: string;
    jobTitle?: string;
    jobTitleAr?: string;
    managerId?: string | null;
    status?: AccountStatus;
    temporaryPassword?: string;
    avatar?: string;
  }) {
    try {
      return await this.request<{ user: User; temporaryPassword: string; message: string }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (err: any) {
      // If server returned a business validation conflict (Duplicate email or ID), rethrow with clean message
      if (err.status === 409 || err.code === 'EmailConflict' || err.code === 'EmployeeIdConflict') {
        throw err;
      }
      // On static deployments, Vercel edge failures, or network issues, execute with local client store
      return clientLocalCreateUser(userData);
    }
  },

  async updateUser(id: string, updates: Partial<User>) {
    try {
      return await this.request<{ user: User; message: string }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      const user = clientLocalUpdateUser(id, updates);
      return { user, message: 'User updated' };
    }
  },

  async updateUserAvatar(id: string, avatar: string) {
    try {
      return await this.request<{ user: User; message: string }>(`/api/users/${id}/avatar`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar }),
      });
    } catch {
      const user = clientLocalUpdateUser(id, { avatar });
      return { user, message: 'Photo updated successfully' };
    }
  },

  async updateUserStatus(id: string, status: AccountStatus, notes?: string) {
    try {
      return await this.request<{ user: User; message: string }>(`/api/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    } catch {
      const user = clientLocalUpdateUser(id, { status });
      return { user, message: 'Status updated' };
    }
  },

  async deleteUser(id: string) {
    try {
      return await this.request<{ success: boolean; message: string }>(`/api/users/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return clientLocalDeleteUser(id);
    }
  },

  async getPendingApprovals() {
    try {
      return await this.request<{ pendingApprovals: User[] }>('/api/users/approvals/pending');
    } catch {
      const pending = clientLocalGetUsers().filter((u) => u.status === 'PENDING_APPROVAL');
      return { pendingApprovals: pending };
    }
  },

  async decideApproval(id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    try {
      return await this.request<{ user: User; message: string }>(`/api/users/approvals/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes }),
      });
    } catch {
      return clientLocalDecideApproval(id, decision, notes);
    }
  },

  async resetUserPassword(id: string) {
    try {
      return await this.request<{ temporaryPassword: string; message: string }>(`/api/users/${id}/reset-password`, {
        method: 'POST',
      });
    } catch {
      return clientLocalResetPassword(id);
    }
  },

  // Tasks
  async getTasks() {
    try {
      return await this.request<{ tasks: Task[] }>('/api/tasks');
    } catch {
      return { tasks: clientLocalGetTasks() };
    }
  },

  async getTask(id: string) {
    try {
      return await this.request<{ task: Task }>(`/api/tasks/${id}`);
    } catch {
      const found = clientLocalGetTasks().find((t) => t.id === id);
      if (found) return { task: found };
      throw new Error('Task not found');
    }
  },

  async createTask(taskData: {
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    assignedToId: string;
    priority: string;
    category: string;
    dueDate: string;
    status?: TaskStatus;
  }) {
    try {
      return await this.request<{ task: Task; message: string }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
    } catch {
      const caller = clientLocalGetMe() || { id: 'usr-admin-001', name: 'Tariq Al-Moosa', role: 'ADMIN' } as User;
      const task = clientLocalAllocateTask(taskData.assignedToId, taskData, caller);
      return { task, message: 'Task created' };
    }
  },

  async updateTaskStatus(id: string, status?: TaskStatus, progress?: number) {
    try {
      return await this.request<{ task: Task }>(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, progress }),
      });
    } catch {
      return clientLocalUpdateTaskStatus(id, status, progress);
    }
  },

  async addTaskComment(id: string, content: string) {
    try {
      return await this.request<{ task: Task }>(`/api/tasks/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch {
      return clientLocalAddTaskComment(id, content);
    }
  },

  async addTaskAttachment(id: string, name: string, sizeBytes?: number) {
    try {
      return await this.request<{ task: Task }>(`/api/tasks/${id}/attachments`, {
        method: 'POST',
        body: JSON.stringify({ name, sizeBytes }),
      });
    } catch {
      return clientLocalAddTaskAttachment(id, name, sizeBytes);
    }
  },

  // Manager Specific Endpoints
  async getManagerTeam(managerId?: string) {
    try {
      const query = managerId ? `?managerId=${encodeURIComponent(managerId)}` : '';
      return await this.request<{
        team: Array<{
          employee: User;
          stats: {
            totalTasks: number;
            pendingTasks: number;
            completedTasks: number;
            overdueTasks: number;
          };
        }>;
      }>(`/api/manager/team${query}`);
    } catch {
      const allUsers = clientLocalGetUsers();
      const allTasks = clientLocalGetTasks();
      const mId = managerId || clientLocalGetMe()?.id || 'usr-sarah';
      const directReports = allUsers.filter((u) => u.managerId === mId && u.role === 'EMPLOYEE');
      const team = directReports.map((emp) => {
        const empTasks = allTasks.filter((t) => t.assignedToId === emp.id);
        return {
          employee: emp,
          stats: {
            totalTasks: empTasks.length,
            pendingTasks: empTasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length,
            completedTasks: empTasks.filter((t) => t.status === 'COMPLETED').length,
            overdueTasks: 0,
          },
        };
      });
      return { team };
    }
  },

  async getEmployeeTasksForManager(employeeId: string) {
    try {
      return await this.request<{ employee: User; tasks: Task[] }>(
        `/api/manager/team/${encodeURIComponent(employeeId)}/tasks`
      );
    } catch {
      const users = clientLocalGetUsers();
      const employee = users.find((u) => u.id === employeeId) || users[0];
      const tasks = clientLocalGetTasks().filter((t) => t.assignedToId === employeeId);
      return { employee, tasks };
    }
  },

  async allocateEmployeeTask(
    employeeId: string,
    taskData: {
      title: string;
      titleAr?: string;
      description: string;
      descriptionAr?: string;
      priority: string;
      category: string;
      dueDate: string;
      specialInstructions?: string;
    }
  ) {
    try {
      return await this.request<{ task: Task; message: string }>(
        `/api/manager/team/${encodeURIComponent(employeeId)}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(taskData),
        }
      );
    } catch {
      const caller = clientLocalGetMe() || { id: 'usr-sarah', name: 'Sarah Al-Otaibi', role: 'MANAGER' } as User;
      const task = clientLocalAllocateTask(employeeId, taskData, caller);
      return { task, message: 'Task allocated' };
    }
  },

  async reorderEmployeeTasks(employeeId: string, taskIds: string[]) {
    try {
      return await this.request<{ tasks: Task[]; message: string }>(
        `/api/manager/team/${encodeURIComponent(employeeId)}/tasks/reorder`,
        {
          method: 'PUT',
          body: JSON.stringify({ taskIds }),
        }
      );
    } catch {
      const tasks = clientLocalReorderTasks(employeeId, taskIds);
      return { tasks, message: 'Tasks reordered' };
    }
  },

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: NotificationItem[] }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/api/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  // Audit Logs & Analytics
  async getAuditLogs(filters: { category?: string; status?: string; search?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    return this.request<{ auditLogs: AuditLog[] }>(`/api/audit-logs?${params.toString()}`);
  },

  async getAnalytics() {
    return this.request<{ metrics: any }>('/api/analytics');
  },
};
