import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  MessageSquare,
  Paperclip,
  Share2,
  CheckCircle2,
  Play,
  RotateCcw,
  Send,
  Download,
  Copy,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Language, Task, TaskStatus, User } from '../types';
import { translations } from '../i18n/translations';
import { CategoryBadge, PriorityBadge, RoleBadge, StatusBadge } from './Badge';
import { formatRiyadhDateTime, generateWhatsAppShareUrl, isTaskOverdue, canUpdateTask } from '../utils/rbac';

interface TaskDetailModalProps {
  task: Task | null;
  currentUser: User;
  allUsers: User[];
  language: Language;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, progress?: number) => void;
  onAddComment: (taskId: string, content: string) => void;
  onUploadAttachment: (taskId: string, file: { name: string; size: number }) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  currentUser,
  allUsers,
  language,
  onClose,
  onUpdateStatus,
  onAddComment,
  onUploadAttachment,
}) => {
  if (!task) return null;

  const t = translations[language];
  const [commentText, setCommentText] = useState('');
  const [progressVal, setProgressVal] = useState(task.progress);
  const [copiedLink, setCopiedLink] = useState(false);
  const [fileSimulating, setFileSimulating] = useState(false);

  const assignee = allUsers.find((u) => u.id === task.assignedToId);
  const manager = allUsers.find((u) => u.id === task.assignedById);
  const overdue = isTaskOverdue(task.dueDate, task.status);

  const isAssignee = currentUser.id === task.assignedToId;
  const isManager = currentUser.id === task.assignedById;
  const isAuthorized = canUpdateTask(currentUser, task);

  const formattedDueDate = formatRiyadhDateTime(task.dueDate, language, {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const formattedCreatedDate = formatRiyadhDateTime(task.createdAt, language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const whatsappUrl = generateWhatsAppShareUrl(
    language === 'ar' ? task.titleAr || task.title : task.title,
    task.id,
    window.location.origin,
    language
  );

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(whatsappUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSimulating(true);
    setTimeout(() => {
      onUploadAttachment(task.id, {
        name: file.name,
        size: file.size,
      });
      setFileSimulating(false);
      e.target.value = '';
    }, 400);
  };

  const lifecycleSteps: { status: TaskStatus; label: string }[] = [
    { status: 'ASSIGNED', label: t.statusAssigned },
    { status: 'IN_PROGRESS', label: t.statusInProgress },
    { status: 'ON_HOLD', label: t.statusOnHold },
    { status: 'COMPLETED', label: t.statusCompleted },
  ];

  const currentStepIndex = lifecycleSteps.findIndex((s) => s.status === task.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <PriorityBadge priority={task.priority} lang={language} />
              <CategoryBadge category={task.category} lang={language} />
              <StatusBadge status={task.status} lang={language} />
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <AlertTriangle className="w-3 h-3" />
                  {t.filterOverdue}
                </span>
              )}
            </div>
            <h2 id="task-detail-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {language === 'ar' ? task.titleAr || task.title : task.title}
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Created: {formattedCreatedDate}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t.close}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Lifecycle Steps */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              {t.statusHistory}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {lifecycleSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step.status}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600 font-bold'
                        : isPassed
                        ? 'bg-slate-100/70 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
                        : 'bg-slate-50/40 text-slate-400 border-dashed border-slate-200 dark:bg-slate-800/20 dark:text-slate-500 dark:border-slate-800'
                    }`}
                  >
                    <div className="w-5 h-5 mx-auto mb-1 rounded-full flex items-center justify-center text-xs font-bold bg-white/80 dark:bg-slate-900/80 shadow-xs">
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span className="text-xs leading-tight block">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'ar' ? 'تفاصيل وتعليمات المهمة' : 'Task Instructions & Deliverables'}
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {language === 'ar' ? task.descriptionAr || task.description : task.description}
            </div>
          </div>

          {/* Roster & Timeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5">
              {assignee && (
                <>
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30"
                  />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                      {t.assignedTo}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {language === 'ar' ? assignee.nameAr : assignee.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? assignee.jobTitleAr : assignee.jobTitle}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Manager / Due Date Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  {t.assignedBy}
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {manager ? (language === 'ar' ? manager.nameAr : manager.name) : 'Management'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{formattedDueDate}</span>
              </div>
            </div>
          </div>

          {/* Progress & Quick Actions */}
          {isAuthorized && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                  {t.updateProgress}
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {progressVal}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                aria-label={t.updateProgress}
                className="w-full accent-emerald-600 h-2 bg-emerald-200/70 dark:bg-emerald-900/50 rounded-lg cursor-pointer mb-3"
              />

              {/* Action Buttons depending on role */}
              <div className="flex items-center gap-2 flex-wrap">
                {isAssignee && (task.status === 'ASSIGNED' || task.status === 'NEW' || task.status === 'PENDING') && (
                  <button
                    onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS', Math.max(progressVal, 20))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {t.startWorking}
                  </button>
                )}

                {isAssignee && task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onUpdateStatus(task.id, 'COMPLETED', 100)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.markComplete}
                  </button>
                )}

                {(isManager || currentUser.role === 'ADMIN') && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(task.id, 'COMPLETED', 100)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.approveCompletion}
                    </button>
                    {task.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS', Math.min(progressVal, 50))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t.requestChanges}
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => onUpdateStatus(task.id, task.status, progressVal)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer ml-auto"
                >
                  {t.save}
                </button>
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                {t.attachmentsTitle} ({task.attachments.length})
              </span>

              {isAuthorized && (
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileSimulating ? t.loading : t.uploadAttachment}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleSimulateUpload}
                    disabled={fileSimulating}
                  />
                </label>
              )}
            </div>

            {task.attachments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                {t.noAttachments}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(att.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {att.uploadedByName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Downloading: ${att.name}`)}
                      title={t.downloadFile}
                      aria-label={`${t.downloadFile} ${att.name}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Share Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.waShareTitle}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.waShareDesc}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                {t.shareWhatsApp}
              </a>
              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedLink ? t.copiedToClipboard : t.copyShareLink}
              </button>
            </div>
          </div>

          {/* Comments and Audit Discussion Thread */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              {t.commentsTitle} ({task.comments.length})
            </div>

            {/* List */}
            <div className="space-y-3 mb-4">
              {task.comments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No comments yet. Start the conversation!</p>
              ) : (
                task.comments.map((com) => (
                  <div
                    key={com.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {com.userName}
                        </span>
                        <RoleBadge role={com.userRole} lang={language} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(com.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {com.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post comment input */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.addCommentPlaceholder}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.postComment}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {t.securityCompliant}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
