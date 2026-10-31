import React from 'react';
import { AccountStatus, TaskCategory, TaskPriority, TaskStatus, UserRole } from '../types';
import { translations } from '../i18n/translations';

interface RoleBadgeProps {
  role: UserRole;
  lang?: 'en' | 'ar';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, lang = 'en' }) => {
  const t = translations[lang];
  const configs: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
    ADMIN: {
      label: t.admin,
      bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
    },
    MANAGER: {
      label: t.manager,
      bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    EMPLOYEE: {
      label: t.employee,
      bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  };

  const c = configs[role] || configs.EMPLOYEE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${c.bg} ${c.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {c.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  lang?: 'en' | 'ar';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, lang = 'en' }) => {
  const t = translations[lang];
  const configs: Record<TaskPriority, { label: string; bg: string; border: string }> = {
    URGENT: {
      label: t.priorityUrgent,
      bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200',
      border: 'border-rose-300 dark:border-rose-800',
    },
    HIGH: {
      label: t.priorityHigh,
      bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200',
      border: 'border-orange-300 dark:border-orange-800',
    },
    MEDIUM: {
      label: t.priorityMedium,
      bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
      border: 'border-blue-300 dark:border-blue-800',
    },
    LOW: {
      label: t.priorityLow,
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
    },
  };

  const c = configs[priority] || configs.MEDIUM;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide border ${c.bg} ${c.border}`}
    >
      {c.label}
    </span>
  );
};

interface StatusBadgeProps {
  status: TaskStatus;
  lang?: 'en' | 'ar';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lang = 'en' }) => {
  const t = translations[lang];
  const configs: Record<TaskStatus, { label: string; bg: string; dot: string }> = {
    NEW: {
      label: t.statusNew,
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
      dot: 'bg-cyan-500',
    },
    ASSIGNED: {
      label: t.statusAssigned,
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      dot: 'bg-amber-500',
    },
    IN_PROGRESS: {
      label: t.statusInProgress,
      bg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
      dot: 'bg-blue-500',
    },
    ON_HOLD: {
      label: t.statusOnHold,
      bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-500',
    },
    COMPLETED: {
      label: t.statusCompleted,
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
      dot: 'bg-emerald-500',
    },
    CANCELLED: {
      label: t.statusCancelled,
      bg: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
      dot: 'bg-slate-400',
    },
    OVERDUE: {
      label: t.statusOverdue,
      bg: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
      dot: 'bg-rose-500',
    },
    PENDING: {
      label: t.statusPending,
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      dot: 'bg-amber-500',
    },
    UNDER_REVIEW: {
      label: t.statusUnderReview,
      bg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
      dot: 'bg-purple-500',
    },
  };

  const c = configs[status] || configs.ASSIGNED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

interface AccountStatusBadgeProps {
  status: AccountStatus;
  lang?: 'en' | 'ar';
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({ status, lang = 'en' }) => {
  const t = translations[lang];
  const configs: Record<AccountStatus, { label: string; bg: string; dot: string; border: string }> = {
    INVITED: {
      label: t.statusInvited,
      bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    PENDING_APPROVAL: {
      label: t.statusPendingApproval,
      bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700',
      dot: 'bg-amber-500',
    },
    ACTIVE: {
      label: t.statusActive,
      bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: t.statusRejected,
      bg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    SUSPENDED: {
      label: t.statusSuspended,
      bg: 'bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-500',
    },
    DEACTIVATED: {
      label: t.statusDeactivated,
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const c = configs[status] || configs.ACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

interface CategoryBadgeProps {
  category: TaskCategory;
  lang?: 'en' | 'ar';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, lang = 'en' }) => {
  const t = translations[lang];
  const labels: Record<TaskCategory, string> = {
    HR_ONBOARDING: t.catHROnboarding,
    DOCUMENTATION: t.catDocumentation,
    COMPLIANCE: t.catCompliance,
    PROCUREMENT: t.catProcurement,
    MARKETING: t.catMarketing,
    OPERATIONS: t.catOperations,
    GENERAL: t.catGeneral,
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {labels[category] || category}
    </span>
  );
};
