import React from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Language, Task, User } from '../types';
import { translations } from '../i18n/translations';
import { isTaskOverdue } from '../utils/rbac';

interface AnalyticsDashboardProps {
  tasks: Task[];
  users: User[];
  language: Language;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ tasks, users, language }) => {
  const t = translations[language];

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING').length;
  const underReviewTasks = tasks.filter((t) => t.status === 'UNDER_REVIEW').length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;

  const onTimePercentage =
    totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100;

  const activeEmployees = users.filter((u) => u.status === 'ACTIVE' && u.role === 'EMPLOYEE');

  // Department counts
  const categoryCounts: Record<string, number> = {};
  tasks.forEach((tk) => {
    categoryCounts[tk.category] = (categoryCounts[tk.category] || 0) + 1;
  });

  // Priority counts
  const priorityCounts = {
    URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
    HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
    LOW: tasks.filter((t) => t.priority === 'LOW').length,
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-600" />
          {t.analyticsTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.analyticsSubtitle}</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">{t.metricTotalTasks}</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{totalTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1">Company-wide assignments</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">{t.metricActiveTasks}</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {inProgressTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Currently being worked on</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">{t.statusUnderReview}</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            {underReviewTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Awaiting manager sign-off</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">{t.metricCompletedTasks}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {completedTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Successfully closed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">{t.metricOverdueTasks}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {overdueTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Past deadline threshold</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">{t.metricOnTimeRate}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {onTimePercentage}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Delivery compliance index</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department/Category Bars */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            {t.tasksByCategory}
          </h3>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([catKey, count]) => {
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
              return (
                <div key={catKey}>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-slate-700 dark:text-slate-300">
                      {catKey.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown & Team Workload */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
              {t.tasksByPriority}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">{t.priorityUrgent}</span>
                <span className="text-xl font-extrabold text-rose-800 dark:text-rose-200 font-mono">
                  {priorityCounts.URGENT}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-center">
                <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 block">{t.priorityHigh}</span>
                <span className="text-xl font-extrabold text-orange-800 dark:text-orange-200 font-mono">
                  {priorityCounts.HIGH}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">{t.priorityMedium}</span>
                <span className="text-xl font-extrabold text-blue-800 dark:text-blue-200 font-mono">
                  {priorityCounts.MEDIUM}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">{t.priorityLow}</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {priorityCounts.LOW}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              {t.teamWorkload}
            </h4>
            <div className="space-y-2">
              {activeEmployees.slice(0, 4).map((emp) => {
                const assignedCount = tasks.filter((t) => t.assignedToId === emp.id).length;
                const doneCount = tasks.filter((t) => t.assignedToId === emp.id && t.status === 'COMPLETED').length;
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {language === 'ar' ? emp.nameAr : emp.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500">
                      {doneCount} / {assignedCount} completed
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
