import React, { useState, useMemo } from 'react';
import {
  Users,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  Mail,
  Building,
  UserCheck,
  Search,
  Filter,
  BarChart3,
  Calendar as CalendarIcon,
  Briefcase,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Language, Task, TaskPriority, TaskStatus, User } from '../types';
import { translations } from '../i18n/translations';
import { TaskCard } from './TaskCard';
import { TaskCalendarView } from './TaskCalendarView';
import { ManagerTeamAllocationView } from './ManagerTeamAllocationView';
import { isTaskOverdue } from '../utils/rbac';
import { RoleBadge } from './Badge';

interface ManagerDashboardViewProps {
  currentUser: User;
  allUsers: User[];
  allTasks: Task[];
  language: Language;
  selectedEmployeeForAllocation: User | null;
  onSelectEmployeeForAllocation: (employee: User | null) => void;
  onAllocateTask: (
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
  ) => Promise<void>;
  onOpenTaskDetails: (task: Task) => void;
  onQuickShareWhatsApp: (task: Task) => void;
  onOpenCreateTaskModal: () => void;
  onReorderTasks?: (employeeId: string, taskIds: string[]) => Promise<void>;
  isAccessDeniedForEmployee?: boolean;
}

export type ManagerTab = 'DASHBOARD' | 'REPORTING_EMPLOYEES' | 'MY_TASKS' | 'CALENDAR' | 'PROFILE';

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
  currentUser,
  allUsers,
  allTasks,
  language,
  selectedEmployeeForAllocation,
  onSelectEmployeeForAllocation,
  onAllocateTask,
  onOpenTaskDetails,
  onQuickShareWhatsApp,
  onOpenCreateTaskModal,
  onReorderTasks,
  isAccessDeniedForEmployee = false,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<ManagerTab>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');

  // Reporting employees for this manager
  const reportingEmployees = useMemo(() => {
    return allUsers.filter(
      (u) => u.managerId === currentUser.id && u.role === 'EMPLOYEE'
    );
  }, [allUsers, currentUser.id]);

  // Tasks allocated to this manager's direct reports or managed by this manager
  const directReportIds = useMemo(() => reportingEmployees.map((e) => e.id), [reportingEmployees]);

  const teamTasks = useMemo(() => {
    return allTasks.filter(
      (t) => directReportIds.includes(t.assignedToId) || t.assignedById === currentUser.id
    );
  }, [allTasks, directReportIds, currentUser.id]);

  // Tasks assigned directly to the manager (personal)
  const managerPersonalTasks = useMemo(() => {
    return allTasks.filter((t) => t.assignedToId === currentUser.id);
  }, [allTasks, currentUser.id]);

  // Summary Metrics
  const totalAllocated = teamTasks.length;
  const pendingCount = teamTasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD'
  ).length;
  const completedCount = teamTasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = teamTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
  const completionRate = totalAllocated > 0 ? Math.round((completedCount / totalAllocated) * 100) : 0;

  // Filtered reporting employees
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return reportingEmployees;
    const q = searchQuery.toLowerCase().trim();
    return reportingEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.nameAr && e.nameAr.toLowerCase().includes(q)) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
    );
  }, [reportingEmployees, searchQuery]);

  // IF AN EMPLOYEE IS SELECTED FOR DEDICATED ALLOCATION (e.g. /manager/team/:employeeId/tasks)
  if (selectedEmployeeForAllocation) {
    const employeeTasks = allTasks.filter((t) => t.assignedToId === selectedEmployeeForAllocation.id);
    return (
      <ManagerTeamAllocationView
        employee={selectedEmployeeForAllocation}
        manager={currentUser}
        tasks={employeeTasks}
        language={language}
        onBackToTeam={() => onSelectEmployeeForAllocation(null)}
        onAllocateTask={async (data) => {
          await onAllocateTask(selectedEmployeeForAllocation.id, data);
        }}
        onSelectTask={onOpenTaskDetails}
        onQuickShareWhatsApp={onQuickShareWhatsApp}
        onReorderTasks={
          onReorderTasks
            ? (taskIds) => onReorderTasks(selectedEmployeeForAllocation.id, taskIds)
            : undefined
        }
        isAccessDenied={isAccessDeniedForEmployee}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Manager Role Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Manager Navigation">
          {/* TAB 1: MY DASHBOARD */}
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.navMyDashboard}</span>
          </button>

          {/* TAB 2: MY REPORTING EMPLOYEES */}
          <button
            onClick={() => setActiveTab('REPORTING_EMPLOYEES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'REPORTING_EMPLOYEES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.navReportingEmployees}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'REPORTING_EMPLOYEES'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {reportingEmployees.length}
            </span>
          </button>

          {/* TAB 3: MY TASKS */}
          <button
            onClick={() => setActiveTab('MY_TASKS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'MY_TASKS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>{t.navTeamTasks}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'MY_TASKS'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {teamTasks.length}
            </span>
          </button>

          {/* TAB 4: CALENDAR */}
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

          {/* TAB 5: MY PROFILE */}
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{t.navMyProfile}</span>
          </button>
        </nav>

        {/* Quick Assign Modal Trigger */}
        <button
          onClick={onOpenCreateTaskModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newTaskBtn}</span>
        </button>
      </div>

      {/* VIEW 1: MANAGER DASHBOARD OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  Manager Portal
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2">
                  {t.dashboardWelcome}, {language === 'ar' ? currentUser.nameAr : currentUser.name}
                </h1>
                <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
                  {language === 'ar' ? currentUser.departmentAr : currentUser.department} •{' '}
                  {t.taskScopeNoticeManager}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('REPORTING_EMPLOYEES')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
              >
                <span>{t.navReportingEmployees}</span>
                {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* KPI Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Reporting Employees */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.myTeamMembers}
                </span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {reportingEmployees.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct reports</p>
            </div>

            {/* Total Allocated Tasks */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.assignedTasksCount}
                </span>
                <ListTodo className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalAllocated}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Team deliverables</p>
            </div>

            {/* Pending Tasks */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.pendingTasksCount}
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Active in progress</p>
            </div>

            {/* Completed Tasks */}
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
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.overdueTasksCount}
                </span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {overdueCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Requires follow-up</p>
            </div>
          </div>

          {/* Quick Team Cards Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.directReportsTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.directReportsSubtitle}</p>
              </div>

              <button
                onClick={() => setActiveTab('REPORTING_EMPLOYEES')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t.viewDetails}</span>
                {language === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportingEmployees.map((emp) => {
                const empTasks = allTasks.filter((t) => t.assignedToId === emp.id);
                const empPending = empTasks.filter(
                  (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
                ).length;
                const empCompleted = empTasks.filter((t) => t.status === 'COMPLETED').length;

                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 transition-all space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/20"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {language === 'ar' ? emp.nameAr : emp.name}
                        </h4>
                        <div className="text-[10px] text-slate-500 font-mono">{emp.employeeId}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {language === 'ar' ? emp.jobTitleAr : emp.jobTitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t.assignedTasksCount}</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{empTasks.length}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t.pendingTasksCount}</span>
                        <strong className="font-mono text-amber-500">{empPending}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t.completedTasksCount}</span>
                        <strong className="font-mono text-emerald-500">{empCompleted}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectEmployeeForAllocation(emp)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.assignTaskToEmployee}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MY REPORTING EMPLOYEES (Full Dedicated List) */}
      {activeTab === 'REPORTING_EMPLOYEES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t.myReportingEmployees}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.directReportsSubtitle}</p>
            </div>

            {/* Search filter for team members */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute top-2.5 left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchEmployees}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.noReportingEmployees}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {t.contactAdminToAssign}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEmployees.map((emp) => {
                const empTasks = allTasks.filter((t) => t.assignedToId === emp.id);
                const empPending = empTasks.filter(
                  (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD'
                ).length;
                const empCompleted = empTasks.filter((t) => t.status === 'COMPLETED').length;
                const empOverdue = empTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;

                return (
                  <div
                    key={emp.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-13 h-13 rounded-2xl object-cover ring-2 ring-emerald-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {language === 'ar' ? emp.nameAr : emp.name}
                            </h3>
                            <span className="px-2 py-0.2 rounded-full font-mono text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {emp.employeeId}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {language === 'ar' ? emp.jobTitleAr : emp.jobTitle}
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Mail className="w-3 h-3 text-emerald-500" />
                            <span>{emp.email}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {language === 'ar' ? emp.departmentAr : emp.department}
                      </span>
                    </div>

                    {/* Task Metric Breakdown Box */}
                    <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          {t.assignedTasksCount}
                        </span>
                        <strong className="text-sm font-mono text-slate-900 dark:text-white">
                          {empTasks.length}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          {t.pendingTasksCount}
                        </span>
                        <strong className="text-sm font-mono text-amber-500">
                          {empPending}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          {t.completedTasksCount}
                        </span>
                        <strong className="text-sm font-mono text-emerald-500">
                          {empCompleted}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                          {t.filterOverdue}
                        </span>
                        <strong className="text-sm font-mono text-rose-500">
                          {empOverdue}
                        </strong>
                      </div>
                    </div>

                    {/* Action: Open Dedicated Task Allocation Screen */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectEmployeeForAllocation(emp)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.assignTaskToEmployee}</span>
                        <span className="text-[10px] font-mono text-emerald-200">
                          /manager/team/{emp.id}/tasks
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: TEAM TASKS */}
      {activeTab === 'MY_TASKS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t.teamTasksTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.taskScopeNoticeManager}</p>
            </div>
          </div>

          {teamTasks.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <ListTodo className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.noTasksFound}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.noTasksHelp}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamTasks.map((task) => (
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

      {/* VIEW 4: CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <TaskCalendarView
          tasks={teamTasks}
          users={allUsers}
          currentUser={currentUser}
          language={language}
          onSelectTask={onOpenTaskDetails}
          onQuickShareWhatsApp={onQuickShareWhatsApp}
          onCreateTaskClick={onOpenCreateTaskModal}
        />
      )}

      {/* VIEW 5: MY PROFILE */}
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
                <span className="text-slate-400 block mb-1">{t.accountStatus}</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentUser.status}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">{t.directReportsCount}</span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {reportingEmployees.length} {t.myTeamMembers}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
