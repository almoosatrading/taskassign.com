import React from 'react';
import {
  Calendar,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Share2,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Language, Task, User } from '../types';
import { translations } from '../i18n/translations';
import { CategoryBadge, PriorityBadge, StatusBadge } from './Badge';
import { formatRiyadhDateTime, getDeadlineCountdown, isTaskOverdue } from '../utils/rbac';

interface TaskCardProps {
  task: Task;
  allUsers: User[];
  currentUser: User;
  language: Language;
  onOpenDetails: (task: Task) => void;
  onQuickShareWhatsApp: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  allUsers,
  currentUser,
  language,
  onOpenDetails,
  onQuickShareWhatsApp,
}) => {
  const t = translations[language];
  const assignee = allUsers.find((u) => u.id === task.assignedToId);
  const manager = allUsers.find((u) => u.id === task.assignedById);

  const overdue = isTaskOverdue(task.dueDate, task.status);
  const countdown = getDeadlineCountdown(task.dueDate);

  const formattedDueDate = formatRiyadhDateTime(task.dueDate, language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onOpenDetails(task)}
      className="group relative bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Meta: Badges & WhatsApp Quick Action */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PriorityBadge priority={task.priority} lang={language} />
            <CategoryBadge category={task.category} lang={language} />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} lang={language} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickShareWhatsApp(task);
              }}
              title={t.shareWhatsApp}
              aria-label={t.shareWhatsApp}
              className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 leading-snug">
          {language === 'ar' ? task.titleAr || task.title : task.title}
        </h3>

        {/* Task Description Snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed font-normal">
          {language === 'ar' ? task.descriptionAr || task.description : task.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            <span>{t.progress}</span>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">{task.progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : overdue
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info: Assignee, Deadline & Attachment Counts */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Assignee pill */}
          <div className="flex items-center gap-2">
            {assignee && (
              <>
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block leading-none">
                    {t.assignedTo}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-none">
                    {language === 'ar' ? assignee.nameAr : assignee.name}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            {task.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Paperclip className="w-3 h-3" />
                {task.attachments.length}
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-3 h-3" />
                {task.comments.length}
              </span>
            )}
          </div>
        </div>

        {/* Due Date Indicator */}
        <div
          className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border ${
            overdue
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 font-semibold'
              : task.status === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900'
              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {overdue ? (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : task.status === 'COMPLETED' ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
            )}
            <span className="text-[11px]">{formattedDueDate}</span>
          </div>

          <span className="text-[10px] font-mono font-medium">
            {overdue
              ? `${t.overdueBy} ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h`
              : task.status === 'COMPLETED'
              ? t.statusCompleted
              : `${t.dueIn} ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h`}
          </span>
        </div>
      </div>
    </div>
  );
};
