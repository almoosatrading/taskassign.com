/**
 * AlMoosa Trading Company - HR Task Manager
 * Internal Bilingual Task Management Portal
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ListTodo,
  Users,
  Shield,
  BarChart3,
  Plus,
  Filter,
  Search,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Building,
} from 'lucide-react';
import { Language, Task, TaskCategory, TaskPriority, TaskStatus, User, UserRole } from './types';
import { translations } from './i18n/translations';
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS } from './data/initialData';
import { Header } from './components/Header';
import { TaskCard } from './components/TaskCard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { AuditLogViewer } from './components/AuditLogViewer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RoleBadge } from './components/Badge';
import { canViewTask, filterTasks, isTaskOverdue } from './utils/rbac';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  // Set HTML dir attribute dynamically for RTL / LTR
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // App State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  // Default active user is Sarah Al-Otaibi (Manager) to immediately explore task delegation
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // View navigation
  const [activeTab, setActiveTab] = useState<'TASKS' | 'DIRECTORY' | 'AUDIT_LOGS' | 'ANALYTICS'>('TASKS');

  // Task filtering and search state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL' | 'OVERDUE'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'DUE_ASC' | 'DUE_DESC' | 'PRIORITY'>('DUE_ASC');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Audit logger helper
  const logEvent = (
    action: string,
    actionAr: string,
    details: string,
    detailsAr: string,
    category: 'AUTH' | 'TASK' | 'DIRECTORY' | 'SECURITY',
    status: 'SUCCESS' | 'DENIED' = 'SUCCESS'
  ) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      actionAr,
      details,
      detailsAr,
      category,
      status,
      ipAddress: '10.14.20.104',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch persona with audit log entry
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    logEvent(
      'SESSION_SWITCH',
      'تبديل الحساب',
      `Switched active persona to ${user.name} (${user.role})`,
      `تم تبديل المستخدم النشط إلى ${user.nameAr} (${user.role})`,
      'AUTH'
    );
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Mark all notifications read
  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Filter tasks based on RBAC visibility:
  // - Admin: returns empty per security policy (see notice in UI)
  // - Manager: tasks they assigned OR tasks of active direct reports
  // - Employee: only their assigned tasks
  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => canViewTask(currentUser, task, users));
  }, [tasks, currentUser, users]);

  // Apply UI filters (search, status, priority, category)
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
          t.titleAr.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.descriptionAr.toLowerCase().includes(q)
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

  // Task creation handler
  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments'>) => {
    const id = `tsk-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...newTaskData,
      id,
      createdAt: now,
      updatedAt: now,
      comments: [
        {
          id: `com-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          content: 'Task created and assigned.',
          createdAt: now,
        },
      ],
      attachments: [],
    };

    setTasks((prev) => [newTask, ...prev]);

    // Add notification for the assignee
    const assignee = users.find((u) => u.id === newTask.assignedToId);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: newTask.assignedToId,
        title: 'New Task Assigned',
        titleAr: 'تم تكليفك بمهمة جديدة',
        message: `${currentUser.name} assigned you "${newTask.title}"`,
        messageAr: `قام ${currentUser.nameAr} بتكليفك بمهمة "${newTask.titleAr}"`,
        taskId: newTask.id,
        read: false,
        createdAt: now,
        type: 'ASSIGNMENT',
      },
      ...prev,
    ]);

    logEvent(
      'TASK_CREATE',
      'تكليف مهمة جديدة',
      `Created task "${newTask.title}" assigned to ${assignee?.name || newTask.assignedToId}`,
      `تم تكليف المهمة "${newTask.titleAr}" إلى ${assignee?.nameAr || newTask.assignedToId}`,
      'TASK'
    );
  };

  // Status and Progress update handler
  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus, progress?: number) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedProgress = progress !== undefined ? progress : newStatus === 'COMPLETED' ? 100 : t.progress;
        return {
          ...t,
          status: newStatus,
          progress: updatedProgress,
          updatedAt: now,
          completedAt: newStatus === 'COMPLETED' ? now : null,
        };
      })
    );

    // Update currently opened modal task if matches
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              progress: progress !== undefined ? progress : newStatus === 'COMPLETED' ? 100 : prev.progress,
              updatedAt: now,
            }
          : null
      );
    }

    logEvent(
      'TASK_STATUS_UPDATE',
      'تحديث حالة المهمة',
      `Updated task ${taskId} to ${newStatus} (${progress ?? 0}%)`,
      `تم تحديث حالة المهمة ${taskId} إلى ${newStatus} (${progress ?? 0}%)`,
      'TASK'
    );
  };

  // Add Comment handler
  const handleAddComment = (taskId: string, content: string) => {
    const now = new Date().toISOString();
    const newComment = {
      id: `com-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content,
      createdAt: now,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [...t.comments, newComment],
          updatedAt: now,
        };
      })
    );

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, comments: [...prev.comments, newComment] } : null));
    }

    logEvent('TASK_COMMENT', 'إضافة تعليق', `Commented on task ${taskId}`, `تم إضافة تعليق على المهمة ${taskId}`, 'TASK');
  };

  // Upload Attachment handler
  const handleUploadAttachment = (taskId: string, file: { name: string; size: number }) => {
    const now = new Date().toISOString();
    const newAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      sizeBytes: file.size,
      type: 'application/octet-stream',
      url: '#',
      uploadedAt: now,
      uploadedById: currentUser.id,
      uploadedByName: currentUser.name,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          attachments: [...t.attachments, newAttachment],
          updatedAt: now,
        };
      })
    );

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, attachments: [...prev.attachments, newAttachment] } : null));
    }

    logEvent(
      'TASK_ATTACHMENT',
      'إرفاق ملف',
      `Attached ${file.name} to task ${taskId}`,
      `تم إرفاق الملف ${file.name} بالمهمة ${taskId}`,
      'TASK'
    );
  };

  // Directory handlers
  const handleAddEmployee = (newUser: Omit<User, 'id'>) => {
    const id = `usr-${Date.now().toString().slice(-4)}`;
    const userWithId: User = { ...newUser, id };
    setUsers((prev) => [...prev, userWithId]);
    logEvent(
      'DIRECTORY_ADD',
      'إضافة موظف جديد',
      `Created new employee record ${userWithId.name} (${userWithId.employeeId})`,
      `تم إنشاء سجل وظيفي جديد لـ ${userWithId.nameAr} (${userWithId.employeeId})`,
      'DIRECTORY'
    );
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newStatus = u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
        logEvent(
          'USER_STATUS_CHANGE',
          'تعديل حالة الموظف',
          `Changed status of ${u.name} to ${newStatus}`,
          `تم تغيير حالة الموظف ${u.nameAr} إلى ${newStatus}`,
          'DIRECTORY'
        );
        return { ...u, status: newStatus };
      })
    );
  };

  const handleResetPassword = (userId: string): string => {
    const tempPass = `AlMoosa!${Math.floor(1000 + Math.random() * 9000)}`;
    const emp = users.find((u) => u.id === userId);
    logEvent(
      'PASSWORD_RESET',
      'إعادة ضبط كلمة المرور',
      `Issued temporary reset password for ${emp?.name || userId}`,
      `تم إصدار كلمة مرور مؤقتة للموظف ${emp?.nameAr || userId}`,
      'SECURITY'
    );
    return tempPass;
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        logEvent(
          'USER_ROLE_CHANGE',
          'تعديل صلاحيات الموظف',
          `Changed role of ${u.name} from ${u.role} to ${newRole}`,
          `تم تعديل صلاحية الموظف ${u.nameAr} من ${u.role} إلى ${newRole}`,
          'SECURITY'
        );
        return { ...u, role: newRole };
      })
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors`}>
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
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Portal Navigation">
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TASKS'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>
                {currentUser.role === 'EMPLOYEE'
                  ? t.navMyTasks
                  : currentUser.role === 'MANAGER'
                  ? t.navTeamTasks
                  : t.navTasks}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'TASKS' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {visibleTasks.length}
              </span>
            </button>

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
                  activeTab === 'DIRECTORY' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {users.length}
              </span>
            </button>

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
                  activeTab === 'AUDIT_LOGS' ? 'bg-purple-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {auditLogs.length}
              </span>
            </button>

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

          {/* Quick Assign Button for Managers */}
          {currentUser.role === 'MANAGER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newTaskBtn}</span>
            </button>
          )}
        </div>

        {/* TAB 1: TASKS OVERVIEW & MANAGEMENT */}
        {activeTab === 'TASKS' && (
          <div className="space-y-6">
            {/* Role Notice Banner */}
            {currentUser.role === 'ADMIN' ? (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                    Strict Task Privacy Enforcement (AlMoosa Security Policy)
                  </h4>
                  <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
                    {t.taskScopeNoticeAdmin}
                  </p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
                    Tip: Switch persona to <strong className="font-bold underline cursor-pointer" onClick={() => handleSwitchUser(INITIAL_USERS[1])}>Sarah Al-Otaibi (Manager)</strong> or <strong className="font-bold underline cursor-pointer" onClick={() => handleSwitchUser(INITIAL_USERS[3])}>Ahmed Mansoor (Employee)</strong> using the top right switcher.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {t.tasksTitle}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentUser.role === 'MANAGER'
                      ? t.taskScopeNoticeManager
                      : t.taskScopeNoticeEmployee}
                  </p>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            {currentUser.role !== 'ADMIN' && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
                {/* Search & Sort */}
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

                {/* Status Tabs and Quick Selectors */}
                <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {(
                      [
                        { id: 'ALL', label: t.filterAll },
                        { id: 'PENDING', label: t.filterPending },
                        { id: 'IN_PROGRESS', label: t.filterInProgress },
                        { id: 'UNDER_REVIEW', label: t.filterUnderReview },
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

                  {/* Priority & Category Dropdowns */}
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
            )}

            {/* Task Grid */}
            {currentUser.role !== 'ADMIN' && (
              <>
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
                        onQuickShareWhatsApp={(tk) => setSelectedTask(tk)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: EMPLOYEE DIRECTORY */}
        {activeTab === 'DIRECTORY' && (
          <EmployeeDirectory
            users={users}
            currentUser={currentUser}
            language={language}
            onAddEmployee={handleAddEmployee}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            onChangeRole={handleChangeRole}
          />
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'AUDIT_LOGS' && (
          <AuditLogViewer logs={auditLogs} currentUser={currentUser} language={language} />
        )}

        {/* TAB 4: REPORTS & ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <AnalyticsDashboard tasks={tasks} users={users} language={language} />
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
