import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  User as UserIcon,
  X,
  Share2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { Language, Task, TaskPriority, TaskStatus, User } from '../types';
import { translations } from '../i18n/translations';
import { getMonthGridDays, getTasksForDate, groupTasksBySchedule, formatDateKey, getTaskDateKey } from '../utils/calendar';
import { isTaskOverdue } from '../utils/rbac';

interface TaskCalendarViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  language: Language;
  onSelectTask: (task: Task) => void;
  onQuickShareWhatsApp?: (task: Task) => void;
  onCreateTaskClick?: () => void;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function TaskCalendarView({
  tasks,
  users,
  currentUser,
  language,
  onSelectTask,
  onQuickShareWhatsApp,
  onCreateTaskClick,
}: TaskCalendarViewProps) {
  const t = translations[language];

  // View mode: 'grid' (Month grid) or 'list' (Agenda/Timeline)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Currently viewed month & year
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Selected date for day preview / inspection
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL' | 'OVERDUE'>('ALL');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(formatDateKey(today));
  };

  // Pre-filter tasks based on search, status, and priority
  const filteredTasks = useMemo(() => {
    let result = tasks;

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
          t.description.toLowerCase().includes(q) ||
          (t.descriptionAr && t.descriptionAr.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  // Calendar month grid days
  const gridDays = useMemo(() => {
    return getMonthGridDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Map of tasks by dateKey
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      const key = getTaskDateKey(task.dueDate);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
    return map;
  }, [filteredTasks]);

  // Tasks for currently selected day modal / drawer
  const selectedDayTasks = useMemo(() => {
    if (!selectedDateKey) return [];
    return tasksByDate.get(selectedDateKey) || [];
  }, [selectedDateKey, tasksByDate]);

  // Agenda list schedule groups
  const scheduleGroups = useMemo(() => {
    return groupTasksBySchedule(filteredTasks);
  }, [filteredTasks]);

  // Helper to get user info by ID
  const getUser = (userId: string) => users.find((u) => u.id === userId);

  // Month and Weekday headers localized
  const monthName = language === 'ar' ? MONTH_NAMES_AR[currentMonth] : MONTH_NAMES_EN[currentMonth];
  const weekdayNames = language === 'ar' ? WEEKDAY_NAMES_AR : WEEKDAY_NAMES_EN;

  // Stats for the month
  const monthStats = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    let dueTodayCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    for (const t of filteredTasks) {
      if (t.status === 'COMPLETED') completedCount++;
      if (isTaskOverdue(t.dueDate, t.status)) overdueCount++;
      if (getTaskDateKey(t.dueDate) === todayKey) dueTodayCount++;
    }

    return {
      total: filteredTasks.length,
      dueTodayCount,
      overdueCount,
      completedCount,
    };
  }, [filteredTasks]);

  // Color mappings
  const getPriorityBadgeClasses = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'MEDIUM':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50';
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getPriorityDot = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500';
      case 'HIGH':
        return 'bg-amber-500';
      case 'MEDIUM':
        return 'bg-sky-500';
      case 'LOW':
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: t.statusCompleted,
          classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
          icon: CheckCircle2,
        };
      case 'IN_PROGRESS':
        return {
          label: t.statusInProgress,
          classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
          icon: Clock,
        };
      case 'ON_HOLD':
        return {
          label: t.statusOnHold,
          classes: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
          icon: Clock,
        };
      case 'CANCELLED':
        return {
          label: t.statusCancelled,
          classes: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
          icon: AlertTriangle,
        };
      case 'ASSIGNED':
      case 'NEW':
      default:
        return {
          label: t.statusAssigned,
          classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.calendarTitle}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.calendarSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher and Month Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              aria-label={t.prevMonth}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center select-none">
              {monthName} {currentYear}
            </div>
            <button
              onClick={handleNextMonth}
              aria-label={t.nextMonth}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleGoToToday}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {t.today}
          </button>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.viewGrid}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t.viewList}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.filterAll}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {monthStats.total}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t.dueTodaySection}
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {monthStats.dueTodayCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {t.overdueSection}
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {monthStats.overdueCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {t.filterCompleted}
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {monthStats.completedCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchCalendarPlaceholder}
            className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">{t.filterByPriority}</option>
            <option value="URGENT">{t.priorityUrgent}</option>
            <option value="HIGH">{t.priorityHigh}</option>
            <option value="MEDIUM">{t.priorityMedium}</option>
            <option value="LOW">{t.priorityLow}</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">{t.filterByStatus}</option>
            <option value="OVERDUE">{t.filterOverdue}</option>
            <option value="IN_PROGRESS">{t.filterInProgress}</option>
            <option value="ASSIGNED">{t.filterAssigned}</option>
            <option value="ON_HOLD">{t.filterOnHold}</option>
            <option value="COMPLETED">{t.filterCompleted}</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: MONTH GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-center py-2.5">
            {weekdayNames.map((dayName, idx) => (
              <div
                key={idx}
                className="text-xs font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
            {gridDays.map((day, idx) => {
              const dayTasks = tasksByDate.get(day.dateStr) || [];
              const hasTasks = dayTasks.length > 0;
              const isSelected = selectedDateKey === day.dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateKey(day.dateStr)}
                  className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 transition-all flex flex-col justify-between cursor-pointer ${
                    day.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/40 dark:bg-slate-950/40 opacity-50'
                  } ${
                    day.isToday
                      ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/30 dark:bg-emerald-950/20'
                      : ''
                  } ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-slate-800/80 shadow-inner'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        day.isToday
                          ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                          : day.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {hasTasks && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Chips (up to 3 chips visible) */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => {
                      const overdue = isTaskOverdue(task.dueDate, task.status);
                      const isCompleted = task.status === 'COMPLETED';

                      return (
                        <button
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          title={language === 'ar' ? task.titleAr || task.title : task.title}
                          className={`w-full text-left rtl:text-right px-1.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 border transition-all truncate group cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40 line-through'
                              : overdue
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityDot(
                              task.priority
                            )}`}
                          />
                          <span className="truncate flex-1">
                            {language === 'ar' ? task.titleAr || task.title : task.title}
                          </span>
                        </button>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pl-1 rtl:pl-0 rtl:pr-1 pt-0.5 hover:underline">
                        +{dayTasks.length - 3} {t.tasksCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Task Drawer / Popup (When clicked on a specific date) */}
      {selectedDateKey && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/30 p-5 shadow-lg relative">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {t.tasksDueOnDate}: {selectedDateKey}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDayTasks.length} {selectedDayTasks.length === 1 ? t.taskCount : t.tasksCount}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDateKey(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              {t.noTasksDue}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayTasks.map((task) => {
                const assignedUser = getUser(task.assignedToId);
                const statusMeta = getStatusBadge(task.status);
                const overdue = isTaskOverdue(task.dueDate, task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClasses(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.classes}`}
                      >
                        {overdue ? t.filterOverdue : statusMeta.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                      {language === 'ar' ? task.titleAr || task.title : task.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {language === 'ar' ? task.descriptionAr || task.description : task.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        {assignedUser?.avatar ? (
                          <img
                            src={assignedUser.avatar}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="truncate max-w-[120px]">
                          {language === 'ar' ? assignedUser?.nameAr || assignedUser?.name : assignedUser?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onQuickShareWhatsApp && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickShareWhatsApp(task);
                            }}
                            title="WhatsApp"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <span>{task.progress}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: AGENDA LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Overdue Section */}
          {scheduleGroups.overdue.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{t.overdueSection} ({scheduleGroups.overdue.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduleGroups.overdue.map((task) => (
                  <AgendaTaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    language={language}
                    onSelectTask={onSelectTask}
                    onQuickShareWhatsApp={onQuickShareWhatsApp}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today Section */}
          {scheduleGroups.today.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{t.dueTodaySection} ({scheduleGroups.today.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduleGroups.today.map((task) => (
                  <AgendaTaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    language={language}
                    onSelectTask={onSelectTask}
                    onQuickShareWhatsApp={onQuickShareWhatsApp}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow Section */}
          {scheduleGroups.tomorrow.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-sky-900/40 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-sky-100 dark:border-sky-900/30 text-sky-600 dark:text-sky-400 font-bold text-sm">
                <CalendarDays className="w-4 h-4" />
                <span>{t.dueTomorrowSection} ({scheduleGroups.tomorrow.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduleGroups.tomorrow.map((task) => (
                  <AgendaTaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    language={language}
                    onSelectTask={onSelectTask}
                    onQuickShareWhatsApp={onQuickShareWhatsApp}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* This Week Section */}
          {scheduleGroups.thisWeek.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>{t.dueThisWeekSection} ({scheduleGroups.thisWeek.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduleGroups.thisWeek.map((task) => (
                  <AgendaTaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    language={language}
                    onSelectTask={onSelectTask}
                    onQuickShareWhatsApp={onQuickShareWhatsApp}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Later Section */}
          {scheduleGroups.later.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{t.dueLaterSection} ({scheduleGroups.later.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduleGroups.later.map((task) => (
                  <AgendaTaskRow
                    key={task.id}
                    task={task}
                    users={users}
                    language={language}
                    onSelectTask={onSelectTask}
                    onQuickShareWhatsApp={onQuickShareWhatsApp}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {t.noCalendarTasksFound}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AgendaTaskRowProps {
  task: Task;
  users: User[];
  language: Language;
  onSelectTask: (task: Task) => void;
  onQuickShareWhatsApp?: (task: Task) => void;
  t: any;
}

function AgendaTaskRow({
  task,
  users,
  language,
  onSelectTask,
  onQuickShareWhatsApp,
  t,
}: AgendaTaskRowProps) {
  const assignedUser = users.find((u) => u.id === task.assignedToId);
  const overdue = isTaskOverdue(task.dueDate, task.status);

  // Format due date string
  const dueObj = new Date(task.dueDate);
  const formattedDate = !isNaN(dueObj.getTime())
    ? dueObj.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : task.dueDate;

  return (
    <div
      onClick={() => onSelectTask(task)}
      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                task.priority === 'URGENT'
                  ? 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50'
                  : task.priority === 'HIGH'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50'
                  : 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700'
              }`}
            >
              {task.priority}
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
              {formattedDate}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              task.status === 'COMPLETED'
                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                : overdue
                ? 'bg-rose-500/10 text-rose-700 border-rose-200'
                : 'bg-blue-500/10 text-blue-700 border-blue-200'
            }`}
          >
            {overdue ? t.filterOverdue : task.status}
          </span>
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
          {language === 'ar' ? task.titleAr || task.title : task.title}
        </h4>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {language === 'ar' ? task.descriptionAr || task.description : task.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          {assignedUser?.avatar ? (
            <img
              src={assignedUser.avatar}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="truncate max-w-[120px]">
            {language === 'ar' ? assignedUser?.nameAr || assignedUser?.name : assignedUser?.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onQuickShareWhatsApp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickShareWhatsApp(task);
              }}
              title="Share via WhatsApp"
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {task.progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
