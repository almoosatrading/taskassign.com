import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertCircle,
  Paperclip,
  Check,
  UserCheck,
  Building,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Language, Task, TaskCategory, TaskPriority, User } from '../types';
import { translations } from '../i18n/translations';
import { canAssignTask } from '../utils/rbac';

interface CreateTaskModalProps {
  currentUser: User;
  allUsers: User[];
  language: Language;
  onClose: () => void;
  onCreateTask: (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments'>) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  currentUser,
  allUsers,
  language,
  onClose,
  onCreateTask,
}) => {
  const t = translations[language];

  // Strictly filter assignees to current manager's active direct reports!
  const directReports = allUsers.filter((u) => canAssignTask(currentUser, u));

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [assignedToId, setAssignedToId] = useState(directReports[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState<TaskCategory>('OPERATIONS');

  // Default due date: 3 business days from now at 15:00 Riyadh time
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(15, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !assignedToId || !dueDate) {
      setErrorMsg(t.fillRequiredFields);
      return;
    }

    const isoDueDate = new Date(dueDate).toISOString();

    onCreateTask({
      title: title.trim(),
      titleAr: titleAr.trim() || title.trim(),
      description: description.trim(),
      descriptionAr: descriptionAr.trim() || description.trim(),
      assignedToId,
      assignedById: currentUser.id,
      priority,
      status: 'PENDING',
      category,
      dueDate: isoDueDate,
      progress: 0,
    });

    onClose();
  };

  const priorityOptions: { value: TaskPriority; label: string; bg: string; activeBg: string }[] = [
    { value: 'URGENT', label: t.priorityUrgent, bg: 'hover:bg-rose-50', activeBg: 'bg-rose-600 text-white border-rose-600' },
    { value: 'HIGH', label: t.priorityHigh, bg: 'hover:bg-orange-50', activeBg: 'bg-orange-600 text-white border-orange-600' },
    { value: 'MEDIUM', label: t.priorityMedium, bg: 'hover:bg-blue-50', activeBg: 'bg-blue-600 text-white border-blue-600' },
    { value: 'LOW', label: t.priorityLow, bg: 'hover:bg-slate-50', activeBg: 'bg-slate-700 text-white border-slate-700' },
  ];

  const categoryOptions: { value: TaskCategory; label: string }[] = [
    { value: 'HR_ONBOARDING', label: t.catHROnboarding },
    { value: 'DOCUMENTATION', label: t.catDocumentation },
    { value: 'COMPLIANCE', label: t.catCompliance },
    { value: 'PROCUREMENT', label: t.catProcurement },
    { value: 'MARKETING', label: t.catMarketing },
    { value: 'OPERATIONS', label: t.catOperations },
    { value: 'GENERAL', label: t.catGeneral },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="create-task-title" className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {t.createModalTitle}
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                {t.directReportsOnly}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.createModalSubtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label={t.close}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Direct Report Assignee Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.assigneeLabel} <span className="text-rose-500">*</span>
            </label>
            {directReports.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
                You currently have no active direct reports assigned to you in the directory.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {directReports.map((emp) => {
                  const isSelected = assignedToId === emp.id;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setAssignedToId(emp.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-600'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <div className="text-xs font-bold leading-tight">
                            {language === 'ar' ? emp.nameAr : emp.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {emp.employeeId} • {language === 'ar' ? emp.jobTitleAr : emp.jobTitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.taskTitleLabel} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Conduct Warehouse Safety Drill"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.taskTitleArLabel}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: إجراء تجربة إخلاء مستودع السلي"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description Inputs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.descriptionLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps, requirements, deliverables, and expectations..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.priorityLabel}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      priority === opt.value
                        ? opt.activeBg
                        : `border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 ${opt.bg}`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Timezone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.dueDateLabel} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Asia/Riyadh AST (UTC+3)
              </span>
            </div>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={directReports.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t.createTaskAction}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
