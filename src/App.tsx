/**
 * AlMoosa Trading Company - HR Task Manager
 * Internal Secure Full-Stack Role-Based Task Management Portal
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ListTodo,
  Users,
  Shield,
  BarChart3,
  Plus,
  Search,
  Lock,
  ArrowUpDown,
  Building,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FolderTree,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Language, Task, TaskCategory, TaskPriority, TaskStatus, User, UserRole, AuditLog, NotificationItem } from './types';
import { translations } from './i18n/translations';
import { apiClient } from './api/client';
import { Header } from './components/Header';
import { TaskCard } from './components/TaskCard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { AuditLogViewer } from './components/AuditLogViewer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LoginView } from './components/LoginView';
import { ManagerManagement } from './components/ManagerManagement';
import { AccountApprovalView } from './components/AccountApprovalView';
import { TaskCalendarView } from './components/TaskCalendarView';
import { ManagerDashboardView } from './components/ManagerDashboardView';
import { EmployeeDashboardView } from './components/EmployeeDashboardView';
import { ManagerTeamAllocationView } from './components/ManagerTeamAllocationView';
import { canViewTask, isTaskOverdue, generateWhatsAppShareUrl } from './utils/rbac';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  // Set HTML dir attribute dynamically for RTL / LTR
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Application Data State
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<User[]>([]);

  // Navigation tab based on role
  type TabKey = 'DASHBOARD' | 'TASKS' | 'CALENDAR' | 'DIRECTORY' | 'MANAGERS' | 'APPROVALS' | 'AUDIT_LOGS' | 'ANALYTICS';
  const [activeTab, setActiveTab] = useState<TabKey>('TASKS');

  // Dedicated Employee Task Allocation View State (/manager/team/:employeeId/tasks)
  const [selectedEmployeeForAllocation, setSelectedEmployeeForAllocation] = useState<User | null>(null);
  const [isAccessDeniedForEmployee, setIsAccessDeniedForEmployee] = useState(false);

  // Task filtering & search state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL' | 'OVERDUE'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'DUE_ASC' | 'DUE_DESC' | 'PRIORITY'>('DUE_ASC');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Show auto-dismissing feedback banner
  const notifyFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Refresh all application data according to active role permissions
  const loadAppData = useCallback(async () => {
    try {
      const [fetchedUsers, fetchedTasks, fetchedNotifs] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getTasks(),
        apiClient.getNotifications(),
      ]);
      setUsers(fetchedUsers.users);
      setTasks(fetchedTasks.tasks);
      setNotifications(fetchedNotifs.notifications);

      // Admin-only endpoints
      if (apiClient.getToken()) {
        try {
          const logs = await apiClient.getAuditLogs();
          setAuditLogs(logs.auditLogs);
        } catch {
          // Non-admin will receive 403, ignore silently
        }
        try {
          const approvals = await apiClient.getPendingApprovals();
          setPendingApprovals(approvals.pendingApprovals);
        } catch {
          // Non-admin will receive 403, ignore silently
        }
      }
    } catch (err: any) {
      console.error('Failed to load application data:', err);
    }
  }, []);

  // Initial authentication check
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      const token = apiClient.getToken();
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const meRes = await apiClient.getMe();
        setCurrentUser(meRes.user);
        await loadAppData();
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        apiClient.clearToken();
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, [loadAppData]);

  // Handle successful login
  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setActiveTab('TASKS');
    await loadAppData();
  };

  // Handle logout
  const handleSignOut = () => {
    apiClient.clearToken();
    setCurrentUser(null);
    setSelectedTask(null);
    setShowCreateModal(false);
    setSelectedEmployeeForAllocation(null);
    setIsAccessDeniedForEmployee(false);
    window.history.pushState(null, '', '/');
  };

  // Handle navigation to dedicated employee task allocation view (/manager/team/:employeeId/tasks)
  const handleSelectEmployeeForAllocation = (employee: User | null) => {
    setSelectedEmployeeForAllocation(employee);
    setIsAccessDeniedForEmployee(false);
    if (employee) {
      window.history.pushState(null, '', `/manager/team/${employee.id}/tasks`);
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  // Dedicated task allocation API call for an employee
  const handleAllocateEmployeeTask = async (
    employeeId: string,
    taskData: {
      title: string;
      titleAr?: string;
      description: string;
      descriptionAr?: string;
      priority: TaskPriority;
      category: any;
      dueDate: string;
      specialInstructions?: string;
    }
  ) => {
    try {
      const res = await apiClient.allocateEmployeeTask(employeeId, taskData);
      setTasks((prev) => [res.task, ...prev]);
      notifyFeedback(
        language === 'ar'
          ? 'تم تكليف المهمة بنجاح وإشعار الموظف التابع'
          : 'Task successfully assigned to direct report & notification sent'
      );
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to allocate task', 'error');
      throw err;
    }
  };

  // Reorder tasks for employee (persisted to backend via PUT /api/manager/team/:employeeId/tasks/reorder)
  const handleReorderTasks = async (employeeId: string, taskIds: string[]) => {
    try {
      const res = await apiClient.reorderEmployeeTasks(employeeId, taskIds);
      setTasks((prev) => {
        const others = prev.filter((t) => t.assignedToId !== employeeId);
        return [...res.tasks, ...others];
      });
      notifyFeedback(
        language === 'ar'
          ? 'تم تحديث وحفظ ترتيب المهام بنجاح'
          : 'Task sequence updated & persisted successfully'
      );
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to reorder tasks', 'error');
      throw err;
    }
  };

  // Admin updating employee photo (persisted via PATCH /api/users/:id/avatar)
  const handleUpdateAvatar = async (userId: string, newAvatar: string) => {
    try {
      const res = await apiClient.updateUserAvatar(userId, newAvatar);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      if (currentUser?.id === userId) {
        setCurrentUser(res.user);
      }
      notifyFeedback(
        language === 'ar'
          ? 'تم تحديث صورة الموظف بنجاح'
          : 'Employee photo updated successfully'
      );
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to update employee photo', 'error');
      throw err;
    }
  };

  // URL synchronization effect for browser history & direct URL typing (/manager/team/:employeeId/tasks)
  useEffect(() => {
    const syncRouteWithUrl = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/manager\/team\/([^/]+)\/tasks\/?$/);
      if (match) {
        const empId = match[1];
        const found = users.find((u) => u.id === empId);
        if (found) {
          if (currentUser?.role === 'MANAGER' && found.managerId !== currentUser.id) {
            setIsAccessDeniedForEmployee(true);
          } else {
            setIsAccessDeniedForEmployee(false);
          }
          setSelectedEmployeeForAllocation(found);
        } else if (users.length > 0) {
          setIsAccessDeniedForEmployee(true);
          setSelectedEmployeeForAllocation({
            id: empId,
            name: `Employee #${empId}`,
            nameAr: `موظف #${empId}`,
            employeeId: empId,
            email: 'unknown@almoosa.com.sa',
            role: 'EMPLOYEE',
            department: 'Operations',
            departmentAr: 'العمليات',
            jobTitle: 'Staff Member',
            jobTitleAr: 'عضو فريق',
            managerId: 'other-manager',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            status: 'ACTIVE',
          });
        }
      } else {
        setSelectedEmployeeForAllocation(null);
        setIsAccessDeniedForEmployee(false);
      }
    };

    window.addEventListener('popstate', syncRouteWithUrl);
    syncRouteWithUrl();
    return () => window.removeEventListener('popstate', syncRouteWithUrl);
  }, [users, currentUser]);

  // Switch persona (for development testing & demonstration across roles)
  const handleSwitchUser = async (targetUser: User) => {
    setSelectedEmployeeForAllocation(null);
    setIsAccessDeniedForEmployee(false);
    window.history.pushState(null, '', '/');

    try {
      const demoEmail = targetUser.email;
      let demoPass = 'Sairam009$';
      if (targetUser.role === 'MANAGER') demoPass = 'Manager123!';
      if (targetUser.role === 'EMPLOYEE') demoPass = 'Employee123!';

      const res = await apiClient.login(demoEmail, demoPass);
      setCurrentUser(res.user);
      setActiveTab(res.user.role === 'ADMIN' ? 'DASHBOARD' : 'TASKS');
      await loadAppData();
      notifyFeedback(
        language === 'ar'
          ? `تم التبديل بنجاح إلى حساب: ${res.user.nameAr} (${res.user.role})`
          : `Switched active session to: ${res.user.name} (${res.user.role})`
      );
    } catch {
      // Fallback switch
      setCurrentUser(targetUser);
      setActiveTab(targetUser.role === 'ADMIN' ? 'DASHBOARD' : 'TASKS');
      await loadAppData();
    }
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Mark all notifications read
  const handleMarkNotificationsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Visible tasks based on RBAC & client filtering
  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter((task) => canViewTask(currentUser, task, users));
  }, [tasks, currentUser, users]);

  // Apply filters (search, status, priority, category)
  const filteredTasks = useMemo(() => {
    let result = visibleTasks;

    if (statusFilter === 'OVERDUE') {
      result = result.filter((t) => isTaskOverdue(t.dueDate, t.status));
    } else if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.titleAr && t.titleAr.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q) ||
          (t.descriptionAr && t.descriptionAr.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'DUE_ASC') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'DUE_DESC') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      if (sortBy === 'PRIORITY') {
        const priorityWeight: Record<TaskPriority, number> = {
          URGENT: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });
  }, [visibleTasks, statusFilter, priorityFilter, categoryFilter, searchQuery, sortBy]);

  // Task creation handler (calls backend API with manager reporting validation)
  const handleCreateTask = async (
    newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments'>
  ) => {
    try {
      const created = await apiClient.createTask({
        ...newTaskData,
        status: 'ASSIGNED',
      });
      setTasks((prev) => [created.task, ...prev]);
      setShowCreateModal(false);
      notifyFeedback(
        language === 'ar' ? 'تم تكليف المهمة بنجاح وإشعار الموظف' : 'Task successfully assigned & notification sent'
      );
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to create task', 'error');
    }
  };

  // Status and Progress update handler
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus, progress?: number) => {
    try {
      const res = await apiClient.updateTaskStatus(taskId, newStatus, progress);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.task : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(res.task);
      }
      notifyFeedback(language === 'ar' ? 'تم تحديث حالة المهمة' : 'Task status updated');
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to update task status', 'error');
    }
  };

  // Add Comment handler
  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const res = await apiClient.addTaskComment(taskId, content);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.task : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(res.task);
      }
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to post comment', 'error');
    }
  };

  // Upload Attachment handler
  const handleUploadAttachment = async (taskId: string, file: { name: string; size: number }) => {
    try {
      const res = await apiClient.addTaskAttachment(taskId, file.name, file.size);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.task : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(res.task);
      }
      notifyFeedback(language === 'ar' ? 'تم إرفاق الملف بنجاح' : 'File attached successfully');
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to attach file', 'error');
    }
  };

  // Directory handlers (Admin only for adds/deletions/transfers)
  const handleAddEmployee = async (newUser: Omit<User, 'id'>) => {
    try {
      const res = await apiClient.createUser(newUser);
      setUsers((prev) => [...prev, res.user]);
      notifyFeedback(
        language === 'ar' ? `تم إنشاء حساب ${res.user.nameAr} بنجاح` : `Account for ${res.user.name} created successfully`
      );
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateEmployee = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await apiClient.updateUser(userId, updates);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      notifyFeedback(language === 'ar' ? 'تم حفظ التعديلات' : 'User updated successfully');
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to update user', 'error');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      const res = await apiClient.updateUserStatus(userId, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      notifyFeedback(
        language === 'ar'
          ? `تم تحديث حالة الحساب إلى ${newStatus}`
          : `Account status updated to ${newStatus}`
      );
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      notifyFeedback(language === 'ar' ? 'تم حذف الحساب بنجاح' : 'User account removed successfully');
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleResetPassword = async (userId: string): Promise<string> => {
    try {
      const res = await apiClient.resetUserPassword(userId);
      notifyFeedback(
        language === 'ar' ? 'تم إصدار كلمة مرور مؤقتة' : 'Temporary password generated successfully'
      );
      return res.temporaryPassword;
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to reset password', 'error');
      return 'ErrorResetting';
    }
  };

  // Account approval decision handler (Admin only)
  const handleApprovalDecision = async (userId: string, decision: 'APPROVE' | 'REJECT', notes?: string) => {
    try {
      await apiClient.decideApproval(userId, decision, notes);
      setPendingApprovals((prev) => prev.filter((u) => u.id !== userId));
      notifyFeedback(
        decision === 'APPROVE'
          ? language === 'ar'
            ? 'تمت الموافقة على تفعيل الحساب وتعيين المدير'
            : 'Account approved and assigned to manager'
          : language === 'ar'
          ? 'تم رفض طلب التسجيل'
          : 'Registration request rejected'
      );
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to process approval', 'error');
    }
  };

  // Transfer direct report between managers (Admin only)
  const handleAssignReport = async (employeeId: string, newManagerId: string | null) => {
    try {
      await apiClient.updateUser(employeeId, { managerId: newManagerId });
      notifyFeedback(
        language === 'ar' ? 'تم تحديث التبعية الإدارية بنجاح' : 'Reporting manager updated successfully'
      );
      await loadAppData();
    } catch (err: any) {
      notifyFeedback(err.message || 'Failed to transfer employee', 'error');
    }
  };

  // WhatsApp quick sharing handler
  const handleQuickShareWhatsApp = (task: Task) => {
    const title = language === 'ar' ? task.titleAr || task.title : task.title;
    const shareUrl = generateWhatsAppShareUrl(title, task.id, window.location.origin, language);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // If loading authentication initial state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-2xl animate-pulse mb-3">
          M
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Connecting to AlMoosa HR Portal...
        </p>
      </div>
    );
  }

  // If not logged in, render the Dedicated Login View
  if (!currentUser) {
    return (
      <LoginView
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onSelectTaskFromNotif={(taskId) => {
          const tsk = tasks.find((t) => t.id === taskId);
          if (tsk) setSelectedTask(tsk);
        }}
        onSignOut={handleSignOut}
      />

      {/* Floating Feedback Notification */}
      {feedbackMessage && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'MANAGER' ? (
          <ManagerDashboardView
            currentUser={currentUser}
            allUsers={users}
            allTasks={tasks}
            language={language}
            selectedEmployeeForAllocation={selectedEmployeeForAllocation}
            onSelectEmployeeForAllocation={handleSelectEmployeeForAllocation}
            onAllocateTask={handleAllocateEmployeeTask}
            onOpenTaskDetails={(task) => setSelectedTask(task)}
            onQuickShareWhatsApp={handleQuickShareWhatsApp}
            onOpenCreateTaskModal={() => setShowCreateModal(true)}
            isAccessDeniedForEmployee={isAccessDeniedForEmployee}
          />
        ) : currentUser.role === 'EMPLOYEE' ? (
          <EmployeeDashboardView
            currentUser={currentUser}
            allUsers={users}
            tasks={tasks}
            language={language}
            onOpenTaskDetails={(task) => setSelectedTask(task)}
            onQuickShareWhatsApp={handleQuickShareWhatsApp}
          />
        ) : selectedEmployeeForAllocation ? (
          <ManagerTeamAllocationView
            employee={selectedEmployeeForAllocation}
            manager={currentUser}
            tasks={tasks.filter((t) => t.assignedToId === selectedEmployeeForAllocation.id)}
            language={language}
            onBackToTeam={() => handleSelectEmployeeForAllocation(null)}
            onAllocateTask={async (data) => {
              await handleAllocateEmployeeTask(selectedEmployeeForAllocation.id, data);
            }}
            onSelectTask={(task) => setSelectedTask(task)}
            onQuickShareWhatsApp={handleQuickShareWhatsApp}
            isAccessDenied={isAccessDeniedForEmployee}
          />
        ) : (
          /* COMPLETE ADMIN DASHBOARD & SYSTEM MANAGEMENT */
          <div className="space-y-6">
            {/* Admin System Navigation Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Admin Navigation">
                {/* TAB 0: ADMIN DASHBOARD OVERVIEW */}
                <button
                  onClick={() => setActiveTab('DASHBOARD')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'DASHBOARD'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{t.navAdminDashboard}</span>
                </button>

                {/* TAB 1: ALL TASKS */}
                <button
                  onClick={() => setActiveTab('TASKS')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'TASKS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>{t.navAllTasks}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'TASKS'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tasks.length}
                  </span>
                </button>

                {/* TAB 2: CALENDAR */}
                <button
                  onClick={() => setActiveTab('CALENDAR')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'CALENDAR'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>{t.navCalendar}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'CALENDAR'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tasks.length}
                  </span>
                </button>

                {/* TAB 3: DIRECTORY */}
                <button
                  onClick={() => setActiveTab('DIRECTORY')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'DIRECTORY'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t.navDirectory}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'DIRECTORY'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {users.length}
                  </span>
                </button>

                {/* TAB 4: MANAGERS */}
                <button
                  onClick={() => setActiveTab('MANAGERS')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'MANAGERS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  <span>{t.navManagers}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'MANAGERS'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {users.filter((u) => u.role === 'MANAGER').length}
                  </span>
                </button>

                {/* TAB 5: APPROVALS */}
                <button
                  onClick={() => setActiveTab('APPROVALS')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'APPROVALS'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t.navApprovals}</span>
                  {pendingApprovals.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white animate-pulse">
                      {pendingApprovals.length}
                    </span>
                  )}
                </button>

                {/* TAB 6: AUDIT LOGS */}
                <button
                  onClick={() => setActiveTab('AUDIT_LOGS')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'AUDIT_LOGS'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{t.navAuditLogs}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === 'AUDIT_LOGS'
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {auditLogs.length}
                  </span>
                </button>

                {/* TAB 7: ANALYTICS */}
                <button
                  onClick={() => setActiveTab('ANALYTICS')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'ANALYTICS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{t.navAnalytics}</span>
                </button>
              </nav>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t.newTaskBtn}</span>
              </button>
            </div>

            {/* TAB 0: ADMIN OVERVIEW DASHBOARD */}
            {activeTab === 'DASHBOARD' && (
              <div className="space-y-6">
                {/* Admin Hero Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                        Executive HR Administration
                      </span>
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2">
                        {t.dashboardWelcome}, {language === 'ar' ? currentUser.nameAr : currentUser.name}
                      </h1>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {t.taskScopeNoticeAdmin}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('DIRECTORY')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        {t.addEmployeeBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin 5 KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  {/* Total Employees */}
                  <div
                    onClick={() => setActiveTab('DIRECTORY')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.colName}
                      </span>
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {users.length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Company staff roster</p>
                  </div>

                  {/* Active Managers */}
                  <div
                    onClick={() => setActiveTab('MANAGERS')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.navManagers}
                      </span>
                      <FolderTree className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {users.filter((u) => u.role === 'MANAGER').length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Team supervisors</p>
                  </div>

                  {/* Total Company Tasks */}
                  <div
                    onClick={() => setActiveTab('TASKS')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.metricTotalTasks}
                      </span>
                      <ListTodo className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {tasks.length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Across all departments</p>
                  </div>

                  {/* Pending Approvals */}
                  <div
                    onClick={() => setActiveTab('APPROVALS')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.pendingCount}
                      </span>
                      <UserCheck className="w-4 h-4 text-amber-500" />
                    </div>
                    <div
                      className={`text-2xl font-black ${
                        pendingApprovals.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {pendingApprovals.length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Onboarding requests</p>
                  </div>

                  {/* Overdue Warnings */}
                  <div
                    onClick={() => setActiveTab('TASKS')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1 cursor-pointer hover:border-rose-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.metricOverdueTasks}
                      </span>
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-rose-600">
                      {tasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Due date breaches</p>
                  </div>
                </div>

                {/* Quick Shortcuts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setActiveTab('DIRECTORY')}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {t.directoryTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t.directorySubtitle}
                    </p>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-block pt-1">
                      Manage Personnel →
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('MANAGERS')}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-teal-600" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {t.managersTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t.managersSubtitle}
                    </p>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 inline-block pt-1">
                      Reallocate Reports →
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('AUDIT_LOGS')}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-purple-500 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {t.auditLogsTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t.auditLogsSubtitle}
                    </p>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 inline-block pt-1">
                      Inspect Audit Trail ({auditLogs.length} events) →
                    </span>
                  </div>
                </div>

                {/* Recent Security Logs Preview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Recent Operational & Security Events
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real-time audit records across company users and tasks
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('AUDIT_LOGS')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {t.viewDetails}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {language === 'ar' ? log.actionAr : log.action}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {log.category}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate mt-0.5">
                            {language === 'ar' ? log.detailsAr : log.details}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: ALL TASKS */}
            {activeTab === 'TASKS' && (
              <div className="space-y-6">
                {/* Header info & Scope Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {t.allCompanyTasksTitle}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.taskScopeNoticeAdmin}
                    </p>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search
                        className={`w-4 h-4 text-slate-400 absolute top-3 ${
                          language === 'ar' ? 'right-3' : 'left-3'
                        }`}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className={`w-full py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs ${
                          language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-transparent text-xs font-semibold focus:outline-hidden cursor-pointer"
                        >
                          <option value="DUE_ASC">{t.sortDueDateAsc}</option>
                          <option value="DUE_DESC">{t.sortDueDateDesc}</option>
                          <option value="PRIORITY">{t.sortPriority}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {(
                        [
                          { id: 'ALL', label: t.filterAll },
                          { id: 'ASSIGNED', label: t.statusAssigned },
                          { id: 'IN_PROGRESS', label: t.filterInProgress },
                          { id: 'ON_HOLD', label: t.statusOnHold },
                          { id: 'COMPLETED', label: t.filterCompleted },
                          { id: 'OVERDUE', label: t.filterOverdue },
                        ] as const
                      ).map((st) => {
                        const isSelected = statusFilter === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                      >
                        <option value="ALL">All Priorities</option>
                        <option value="URGENT">{t.priorityUrgent}</option>
                        <option value="HIGH">{t.priorityHigh}</option>
                        <option value="MEDIUM">{t.priorityMedium}</option>
                        <option value="LOW">{t.priorityLow}</option>
                      </select>

                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                      >
                        <option value="ALL">All Departments</option>
                        <option value="HR_ONBOARDING">{t.catHROnboarding}</option>
                        <option value="DOCUMENTATION">{t.catDocumentation}</option>
                        <option value="COMPLIANCE">{t.catCompliance}</option>
                        <option value="PROCUREMENT">{t.catProcurement}</option>
                        <option value="MARKETING">{t.catMarketing}</option>
                        <option value="OPERATIONS">{t.catOperations}</option>
                        <option value="GENERAL">{t.catGeneral}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Task Grid */}
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <ListTodo className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.noTasksFound}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.noTasksHelp}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        allUsers={users}
                        currentUser={currentUser}
                        language={language}
                        onOpenDetails={(tk) => setSelectedTask(tk)}
                        onQuickShareWhatsApp={handleQuickShareWhatsApp}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CALENDAR SCHEDULE VIEW */}
            {activeTab === 'CALENDAR' && (
              <TaskCalendarView
                tasks={visibleTasks}
                users={users}
                currentUser={currentUser}
                language={language}
                onSelectTask={(task) => setSelectedTask(task)}
                onQuickShareWhatsApp={handleQuickShareWhatsApp}
                onCreateTaskClick={() => setShowCreateModal(true)}
              />
            )}

            {/* TAB 3: EMPLOYEE DIRECTORY */}
            {activeTab === 'DIRECTORY' && (
              <EmployeeDirectory
                users={users}
                currentUser={currentUser}
                language={language}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {/* TAB 4: MANAGERS & DIRECT REPORTS (Admin Only) */}
            {activeTab === 'MANAGERS' && (
              <ManagerManagement
                users={users}
                language={language}
                onAssignReport={handleAssignReport}
              />
            )}

            {/* TAB 5: ACCOUNT APPROVALS (Admin Only) */}
            {activeTab === 'APPROVALS' && (
              <AccountApprovalView
                pendingUsers={pendingApprovals}
                allUsers={users}
                language={language}
                onDecideApproval={handleApprovalDecision}
              />
            )}

            {/* TAB 6: AUDIT LOGS (Admin Only) */}
            {activeTab === 'AUDIT_LOGS' && (
              <AuditLogViewer logs={auditLogs} currentUser={currentUser} language={language} />
            )}

            {/* TAB 7: REPORTS & ANALYTICS */}
            {activeTab === 'ANALYTICS' && (
              <AnalyticsDashboard tasks={tasks} users={users} language={language} />
            )}
          </div>
        )}
      </main>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUser={currentUser}
          allUsers={users}
          language={language}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddComment={handleAddComment}
          onUploadAttachment={handleUploadAttachment}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          currentUser={currentUser}
          allUsers={users}
          language={language}
          onClose={() => setShowCreateModal(false)}
          onCreateTask={handleCreateTask}
        />
      )}
    </div>
  );
}
