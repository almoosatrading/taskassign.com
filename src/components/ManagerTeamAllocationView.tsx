import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListTodo,
  FileText,
  Tag,
  Share2,
  ExternalLink,
  Plus,
  Send,
  Building,
  Mail,
  Briefcase,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  MoveVertical,
} from 'lucide-react';
import { Language, Task, TaskCategory, TaskPriority, User } from '../types';
import { translations } from '../i18n/translations';
import { PriorityBadge, StatusBadge } from './Badge';
import { isTaskOverdue, getDeadlineCountdown } from '../utils/rbac';

interface ManagerTeamAllocationViewProps {
  employee: User;
  manager: User;
  tasks: Task[];
  language: Language;
  onBackToTeam: () => void;
  onAllocateTask: (taskData: {
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate: string;
    specialInstructions?: string;
  }) => Promise<void>;
  onSelectTask: (task: Task) => void;
  onQuickShareWhatsApp: (task: Task) => void;
  onReorderTasks?: (taskIds: string[]) => Promise<void>;
  isAccessDenied?: boolean;
}

export const ManagerTeamAllocationView: React.FC<ManagerTeamAllocationViewProps> = ({
  employee,
  manager,
  tasks,
  language,
  onBackToTeam,
  onAllocateTask,
  onSelectTask,
  onQuickShareWhatsApp,
  onReorderTasks,
  isAccessDenied = false,
}) => {
  const t = translations[language];

  // Allocation form state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState<TaskCategory>('GENERAL');
  const [dueDate, setDueDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Drag-and-drop task reordering state
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);
  const [orderSavedToast, setOrderSavedToast] = useState(false);
  const [reorderError, setReorderError] = useState('');

  // Synchronize local order when tasks prop changes
  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= orderedTasks.length ||
      toIndex >= orderedTasks.length
    ) {
      return;
    }

    const updated = [...orderedTasks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setOrderedTasks(updated);

    if (onReorderTasks) {
      try {
        setIsPersistingOrder(true);
        setReorderError('');
        await onReorderTasks(updated.map((t) => t.id));
        setOrderSavedToast(true);
        setTimeout(() => setOrderSavedToast(false), 2500);
      } catch (err: any) {
        setReorderError(t.taskOrderSaveError || 'Failed to save reordered tasks sequence');
        setOrderedTasks(tasks); // rollback
      } finally {
        setIsPersistingOrder(false);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    const sourceIndex = draggedIndex;
    setDraggedIndex(null);
    await handleReorder(sourceIndex, dropIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ACCESS DENIED VIEW
  if (isAccessDenied || (manager.role === 'MANAGER' && employee.managerId !== manager.id)) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
            403 Forbidden • Security Block
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3">
            {t.accessDeniedTitle}
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed max-w-lg mx-auto">
            {t.accessDeniedDesc}
          </p>

          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-start font-mono text-slate-600 dark:text-slate-300 space-y-1 max-w-md mx-auto">
            <div>Target Employee: <strong>{employee.name}</strong> ({employee.employeeId})</div>
            <div>Assigned Manager: <strong>{employee.managerId || 'Unassigned'}</strong></div>
            <div>Current Caller: <strong>{manager.name}</strong> ({manager.id})</div>
          </div>

          <div className="mt-6">
            <button
              onClick={onBackToTeam}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{t.accessDeniedReturnBtn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !description.trim() || !dueDate) {
      setFormError(t.fillRequiredFields);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAllocateTask({
        title: title.trim(),
        titleAr: titleAr.trim() || undefined,
        description: description.trim(),
        descriptionAr: descriptionAr.trim() || undefined,
        priority,
        category,
        dueDate,
        specialInstructions: specialInstructions.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setTitleAr('');
      setDescription('');
      setDescriptionAr('');
      setPriority('MEDIUM');
      setCategory('GENERAL');
      setDueDate('');
      setSpecialInstructions('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to allocate task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBackToTeam}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
        >
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{t.backToTeam}</span>
        </button>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          /manager/team/{employee.id}/tasks
        </span>
      </div>

      {/* Employee Verified Profile Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {language === 'ar' ? employee.nameAr : employee.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold">
                  {employee.employeeId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-semibold">
                  {language === 'ar' ? employee.departmentAr : employee.department}
                </span>
              </div>

              <p className="text-xs text-emerald-200/90 font-medium mt-1">
                {language === 'ar' ? employee.jobTitleAr : employee.jobTitle}
              </p>

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{employee.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    {t.directManager}: <strong>{language === 'ar' ? manager.nameAr : manager.name}</strong>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Task Summary Pill Box */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 shrink-0">
            <div className="text-center px-3">
              <span className="block text-lg font-extrabold text-white">{tasks.length}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {t.assignedTasksCount}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-3">
              <span className="block text-lg font-extrabold text-amber-400">
                {tasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {t.pendingTasksCount}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-3">
              <span className="block text-lg font-extrabold text-emerald-400">
                {tasks.filter((t) => t.status === 'COMPLETED').length}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {t.completedTasksCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Dedicated Task Allocation Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.assignTaskToEmployee} {language === 'ar' ? employee.nameAr : employee.name}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {t.allocationDateLabel}: <strong>{todayFormatted}</strong>
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Task Title EN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.taskTitleLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Conduct Warehouse Inventory Reconciliation"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Task Title AR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.taskTitleArLabel}
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: مطابقة الجرد الفعلي لمستودعات السلي"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                  dir="rtl"
                />
              </div>

              {/* Priority & Category Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.priorityLabel}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="URGENT">{t.priorityUrgent}</option>
                    <option value="HIGH">{t.priorityHigh}</option>
                    <option value="MEDIUM">{t.priorityMedium}</option>
                    <option value="LOW">{t.priorityLow}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
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

              {/* Due Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.dueDateLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute top-2.5 left-3 pointer-events-none" />
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.descriptionLabel} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe task scope, deliverables, and specific objectives..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description AR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.descriptionArLabel}
                </label>
                <textarea
                  rows={2}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="وصف المهمة والمخرجات المطلوبة بالعربية..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-right"
                  dir="rtl"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.specialInstructionsLabel}
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={t.specialInstructionsPlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/15 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <span>{t.loading}</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.createTaskAction}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Existing Tasks for this Direct Report (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.existingTasksForEmployee}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isPersistingOrder && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                    {t.loading}
                  </span>
                )}
                {orderSavedToast && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{t.taskOrderSaved}</span>
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {orderedTasks.length} {t.tasksCount}
                </span>
              </div>
            </div>

            {/* Drag & Drop Instructions & Reorder Banner */}
            {orderedTasks.length > 1 && (
              <div className="mb-3.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <MoveVertical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t.dragToReorderTasks}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Drag handle • Or use ▲/▼
                </span>
              </div>
            )}

            {reorderError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reorderError}</span>
              </div>
            )}

            {orderedTasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <ListTodo className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.noExistingTasksForEmployee}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the allocation form to assign their first task.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderedTasks.map((task, idx) => {
                  const overdue = isTaskOverdue(task.dueDate, task.status);
                  const displayTitle = language === 'ar' ? task.titleAr || task.title : task.title;
                  const displayDesc = language === 'ar' ? task.descriptionAr || task.description : task.description;
                  const countdown = getDeadlineCountdown(task.dueDate);

                  const isBeingDragged = draggedIndex === idx;
                  const isDragTarget = dragOverIndex === idx && draggedIndex !== idx;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={(e) => handleDragLeave(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 relative ${
                        isBeingDragged
                          ? 'opacity-40 scale-[0.98] border-emerald-400 ring-2 ring-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/30'
                          : isDragTarget
                          ? 'border-emerald-500 ring-2 ring-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md'
                          : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* Drag Handle & Up/Down Sequence Controls */}
                          <div className="flex flex-col items-center justify-center shrink-0 pt-0.5">
                            <button
                              type="button"
                              title={t.dragHandleTooltip}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing transition-colors"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col -space-y-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorder(idx, idx - 1)}
                                title={t.moveUp}
                                className="p-0.5 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === orderedTasks.length - 1}
                                onClick={() => handleReorder(idx, idx + 1)}
                                title={t.moveDown}
                                className="p-0.5 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Position Sequence Badge */}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-400">
                                #{task.id}
                              </span>
                              <PriorityBadge priority={task.priority} lang={language} />
                              <StatusBadge status={task.status} lang={language} />
                              {overdue && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  {t.filterOverdue}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 break-words">
                              {displayTitle}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onQuickShareWhatsApp(task)}
                            title={t.shareWhatsApp}
                            className="p-1.5 rounded-lg border border-emerald-300/60 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 cursor-pointer transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectTask(task)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>{t.viewDetails}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pl-6 rtl:pl-0 rtl:pr-6">
                        {displayDesc}
                      </p>

                      {/* Progress bar */}
                      <div className="space-y-1 pl-6 rtl:pl-0 rtl:pr-6">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{t.progress}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : overdue
                                ? 'bg-rose-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 pl-6 rtl:pl-0 rtl:pr-6">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString(
                              language === 'ar' ? 'ar-SA' : 'en-US',
                              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </span>

                        <span className="font-mono text-[10px]">
                          {overdue
                            ? `${t.overdueBy} ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h`
                            : task.status === 'COMPLETED'
                            ? t.statusCompleted
                            : `${t.dueIn} ${countdown.days > 0 ? `${countdown.days}d ` : ''}${countdown.hours}h`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
