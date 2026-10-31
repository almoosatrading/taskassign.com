import {
  AuditLog,
  NotificationItem,
  Task,
  TaskStatus,
  User,
  UserRole,
  AccountStatus,
} from '../types';

const TOKEN_KEY = 'almoosa_hr_token';

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
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error: any = new Error(data.message || data.error || 'Request failed');
      error.status = response.status;
      error.code = data.error;
      error.accountStatus = data.status;
      error.user = data.user;
      throw error;
    }

    return data as T;
  },

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  },

  async getMe() {
    return this.request<{ user: User }>('/api/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Users & Management
  async getUsers() {
    return this.request<{ users: User[] }>('/api/users');
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
  }) {
    return this.request<{ user: User; temporaryPassword: string; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: string, updates: Partial<User>) {
    return this.request<{ user: User; message: string }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateUserAvatar(id: string, avatar: string) {
    return this.request<{ user: User; message: string }>(`/api/users/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatar }),
    });
  },

  async updateUserStatus(id: string, status: AccountStatus, notes?: string) {
    return this.request<{ user: User; message: string }>(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async deleteUser(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getPendingApprovals() {
    return this.request<{ pendingApprovals: User[] }>('/api/users/approvals/pending');
  },

  async decideApproval(id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    return this.request<{ user: User; message: string }>(`/api/users/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  },

  async resetUserPassword(id: string) {
    return this.request<{ temporaryPassword: string; message: string }>(`/api/users/${id}/reset-password`, {
      method: 'POST',
    });
  },

  // Tasks
  async getTasks() {
    return this.request<{ tasks: Task[] }>('/api/tasks');
  },

  async getTask(id: string) {
    return this.request<{ task: Task }>(`/api/tasks/${id}`);
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
    return this.request<{ task: Task; message: string }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTaskStatus(id: string, status?: TaskStatus, progress?: number) {
    return this.request<{ task: Task }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, progress }),
    });
  },

  async addTaskComment(id: string, content: string) {
    return this.request<{ task: Task }>(`/api/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async addTaskAttachment(id: string, name: string, sizeBytes?: number) {
    return this.request<{ task: Task }>(`/api/tasks/${id}/attachments`, {
      method: 'POST',
      body: JSON.stringify({ name, sizeBytes }),
    });
  },

  // Manager Specific Endpoints
  async getManagerTeam(managerId?: string) {
    const query = managerId ? `?managerId=${encodeURIComponent(managerId)}` : '';
    return this.request<{
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
  },

  async getEmployeeTasksForManager(employeeId: string) {
    return this.request<{ employee: User; tasks: Task[] }>(
      `/api/manager/team/${encodeURIComponent(employeeId)}/tasks`
    );
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
    return this.request<{ task: Task; message: string }>(
      `/api/manager/team/${encodeURIComponent(employeeId)}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(taskData),
      }
    );
  },

  async reorderEmployeeTasks(employeeId: string, taskIds: string[]) {
    return this.request<{ tasks: Task[]; message: string }>(
      `/api/manager/team/${encodeURIComponent(employeeId)}/tasks/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify({ taskIds }),
      }
    );
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
