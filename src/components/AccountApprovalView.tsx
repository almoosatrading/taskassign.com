import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  ShieldAlert,
  Calendar,
  Building,
  Mail,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n/translations';
import { RoleBadge } from './Badge';
import { formatRiyadhDateTime } from '../utils/rbac';

interface AccountApprovalViewProps {
  pendingUsers: User[];
  allUsers: User[];
  language: Language;
  onDecideApproval: (userId: string, decision: 'APPROVE' | 'REJECT', notes?: string) => Promise<void>;
}

export const AccountApprovalView: React.FC<AccountApprovalViewProps> = ({
  pendingUsers,
  allUsers,
  language,
  onDecideApproval,
}) => {
  const t = translations[language];

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleAction = async (userId: string, decision: 'APPROVE' | 'REJECT') => {
    setSubmittingId(userId);
    try {
      await onDecideApproval(userId, decision, notes[userId] || '');
      // Clear notes for this user
      setNotes((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            {t.approvalsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.approvalsSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              {pendingUsers.length} {t.pendingCount}
            </span>
          </span>
        </div>
      </div>

      {/* Main List */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.noPendingApprovals}</h3>
          <p className="text-xs text-slate-400 mt-1">
            New employee onboarding registrations submitted by managers or invitations will appear here for authorization.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => {
            const manager = allUsers.find((m) => m.id === user.managerId);
            const isSubmitting = submittingId === user.id;

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Applicant Details */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/30 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {language === 'ar' ? user.nameAr : user.name}
                      </h4>
                      <RoleBadge role={user.role} lang={language} />
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                        {user.employeeId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {language === 'ar' ? user.jobTitleAr : user.jobTitle} • {language === 'ar' ? user.departmentAr : user.department}
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                      <span>
                        {t.assignedManager}: <strong className="text-slate-700 dark:text-slate-300">{manager ? (language === 'ar' ? manager.nameAr : manager.name) : 'None'}</strong>
                      </span>
                      {user.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRiyadhDateTime(user.createdAt, language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Note input */}
                    <div className="pt-2">
                      <input
                        type="text"
                        value={notes[user.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [user.id]: e.target.value })}
                        placeholder={t.rejectionReasonPrompt}
                        className="w-full max-w-md px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => handleAction(user.id, 'APPROVE')}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t.approveBtn}</span>
                  </button>

                  <button
                    onClick={() => handleAction(user.id, 'REJECT')}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>{t.rejectBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
