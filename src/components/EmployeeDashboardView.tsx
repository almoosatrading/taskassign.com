import React, { useState, useMemo } from 'react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  Search,
  ArrowUpDown,
  Briefcase,
  ShieldCheck,
  Building,
  Mail,
  User,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { Language, Task, TaskPriority, TaskStatus, User as UserType } from '../types';
import { translations } from '../i18n/translations';
import { TaskCard } from './TaskCard';
import { TaskCalendarView } from './TaskCalendarView';
import { RoleBadge, PriorityBadge, StatusBadge } from './Badge';
import { isTaskOverdue, getDeadlineCountdown } from '../utils/rbac';

interface EmployeeDashboardViewProps {
  currentUser: UserType;
  allUsers: UserType[];
  tasks: Task[];
  language: Language;
  onOpenTaskDetails: (task: Task) => void;
  onQuickShareWhatsApp: (task: Task) => void;
}

export type EmployeeTab = 'DASHBOARD' | 'MY_TASKS' | 'CALENDAR' | 'PROFILE';

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  currentUser,
  allUsers,
  tasks,
  language,
  onOpenTaskDetails,
  onQuickShareWhatsApp,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<EmployeeTab>('DASHBOARD');

  // Task filtering state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL' | 'OVERDUE'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'DUE_ASC' | 'DUE_DESC' | 'PRIORITY'>('DUE_ASC');

  // Strictly personal tasks for this employee
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assignedToId === currentUser.id);
  }, [tasks, currentUser.id]);

  // Find direct reporting manager
  const directManager = useMemo(() => {
    if (!currentUser.managerId) return null;
    return allUsers.find((u) => u.id === currentUser.managerId) || null;
  }, [allUsers, currentUser.managerId]);

  // Metric computations
  const totalTasks = myTasks.length;
  const inProgressCount = myTasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'ON_HOLD'
  ).length;
  const completedCount = myTasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = myTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Upcoming deadlines (next 3 pending tasks sorted by due date)
  const upcomingTasks = useMemo(() => {
    return myTasks
      .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [myTasks]);

  // Filtered personal tasks
  const filteredTasks = useMemo(() => {
    let result = myTasks;

    if (statusFilter === 'OVERDUE') {
      result = result.filter((t) => isTaskOverdue(t.dueDate, t.status));
    } else if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.titleAr && t.titleAr.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'DUE_ASC') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'DUE_DESC') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      return 0;
    });
  }, [myTasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Employee Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Employee Navigation">
          {/* TAB 1: MY DASHBOARD */}
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.navMyDashboard}</span>
          </button>

          {/* TAB 2: MY TASKS */}
          <button
            onClick={() => setActiveTab('MY_TASKS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'MY_TASKS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>{t.navMyTasks}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'MY_TASKS'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {myTasks.length}
            </span>
          </button>

          {/* TAB 3: CALENDAR */}
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
          </button>

          {/* TAB 4: MY PROFILE */}
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.navMyProfile}</span>
          </button>
        </nav>

        {/* Reporting line notice */}
        {directManager && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{t.directManager}:</span>
            <strong className="text-slate-900 dark:text-white">
              {language === 'ar' ? directManager.nameAr : directManager.name}
            </strong>
          </div>
        )}
      </div>

      {/* VIEW 1: EMPLOYEE DASHBOARD OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  Employee Workspace
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2">
                  {t.dashboardWelcome}, {language === 'ar' ? currentUser.nameAr : currentUser.name}
                </h1>
                <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
                  {language === 'ar' ? currentUser.departmentAr : currentUser.department} •{' '}
                  {t.taskScopeNoticeEmployee}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('MY_TASKS')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
              >
                <span>{t.navMyTasks}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Personal KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Total Assigned */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.assignedTasksCount}
                </span>
                <ListTodo className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalTasks}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total assigned to you</p>
            </div>

            {/* In Progress */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.pendingTasksCount}
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {inProgressCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Active tasks</p>
            </div>

            {/* Completed */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.completedTasksCount}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{completionRate}% completion rate</p>
            </div>

            {/* Overdue Warnings */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.overdueTasksCount}
                </span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {overdueCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Attention required</p>
            </div>
          </div>

          {/* Upcoming Deadlines & Direct Manager Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upcoming Deadlines (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t.upcomingDeadlines}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('MY_TASKS')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {t.viewDetails}
                </button>
              </div>

              {upcomingTasks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    All caught up! No pending deadlines.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => {
                    const overdue = isTaskOverdue(task.dueDate, task.status);
                    const title = language === 'ar' ? task.titleAr || task.title : task.title;

                    const countdown = getDeadlineCountdown(task.dueDate);

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={task.priority} lang={language} />
                            <StatusBadge status={task.status} lang={language} />
                            {overdue && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                {t.filterOverdue}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                            {title}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {overdue
                              ? `${t.overdueBy} ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h`
                              : task.status === 'COMPLETED'
                              ? t.statusCompleted
                              : `${t.dueIn} ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onQuickShareWhatsApp(task)}
                            className="p-1.5 rounded-lg border border-emerald-300/60 dark:border-emerald-700/60 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            title={t.shareWhatsApp}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenTaskDetails(task)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer"
                          >
                            {t.viewDetails}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Direct Manager Info Card (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                {t.directManager}
              </h3>

              {directManager ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={directManager.avatar}
                      alt={directManager.name}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {language === 'ar' ? directManager.nameAr : directManager.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {language === 'ar' ? directManager.jobTitleAr : directManager.jobTitle}
                      </p>
                      <RoleBadge role={directManager.role} lang={language} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{directManager.email}</span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-500" />
                      <span>{language === 'ar' ? directManager.departmentAr : directManager.department}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No direct manager assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MY TASKS */}
      {activeTab === 'MY_TASKS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t.myTasksTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.taskScopeNoticeEmployee}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

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
            </div>
          </div>

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
                  allUsers={allUsers}
                  currentUser={currentUser}
                  language={language}
                  onOpenDetails={onOpenTaskDetails}
                  onQuickShareWhatsApp={onQuickShareWhatsApp}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <TaskCalendarView
          tasks={myTasks}
          users={allUsers}
          currentUser={currentUser}
          language={language}
          onSelectTask={onOpenTaskDetails}
          onQuickShareWhatsApp={onQuickShareWhatsApp}
        />
      )}

      {/* VIEW 4: MY PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-18 h-18 rounded-2xl object-cover ring-4 ring-emerald-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {language === 'ar' ? currentUser.nameAr : currentUser.name}
                  </h2>
                  <RoleBadge role={currentUser.role} lang={language} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ar' ? currentUser.jobTitleAr : currentUser.jobTitle}
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {currentUser.employeeId}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">{t.companyEmail}</span>
                <strong className="text-slate-900 dark:text-white">{currentUser.email}</strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">{t.department}</span>
                <strong className="text-slate-900 dark:text-white">
                  {language === 'ar' ? currentUser.departmentAr : currentUser.department}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">{t.directManager}</span>
                <strong className="text-slate-900 dark:text-white">
                  {directManager
                    ? language === 'ar'
                      ? directManager.nameAr
                      : directManager.name
                    : 'HR Director'}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">{t.accountStatus}</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentUser.status}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
