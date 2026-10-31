import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  UserPlus,
  ArrowRight,
  Shield,
  Building,
  Mail,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n/translations';
import { AccountStatusBadge } from './Badge';

interface ManagerManagementProps {
  users: User[];
  language: Language;
  onOpenCreateManager?: () => void;
  onSelectEmployee?: (emp: User) => void;
  onAssignReport?: (employeeId: string, newManagerId: string | null) => Promise<void> | void;
}

export const ManagerManagement: React.FC<ManagerManagementProps> = ({
  users,
  language,
  onOpenCreateManager,
  onSelectEmployee,
  onAssignReport,
}) => {
  const t = translations[language];

  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    managers.find((m) => m.role === 'MANAGER')?.id || managers[0]?.id || ''
  );

  const selectedManager = users.find((u) => u.id === selectedManagerId);
  const directReports = users.filter((u) => u.managerId === selectedManagerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-600" />
            {t.managersTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.managersSubtitle}</p>
        </div>

        <button
          onClick={onOpenCreateManager}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.createManagerBtn}</span>
        </button>
      </div>

      {/* Main Grid: Managers List on Left, Selected Manager Direct Reports on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Managers Roster Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Company Managers ({managers.length})
          </div>

          <div className="space-y-2.5">
            {managers.map((mgr) => {
              const count = users.filter((u) => u.managerId === mgr.id).length;
              const isSelected = mgr.id === selectedManagerId;
              return (
                <div
                  key={mgr.id}
                  onClick={() => setSelectedManagerId(mgr.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-sm ring-1 ring-amber-400/40'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={mgr.avatar}
                      alt={mgr.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-500/20"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'ar' ? mgr.nameAr : mgr.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'ar' ? mgr.jobTitleAr : mgr.jobTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-mono">
                      {count} {t.directReportsCount}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Manager Detail & Assigned Employees */}
        <div className="lg:col-span-2 space-y-4">
          {selectedManager ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
              {/* Manager Header Info */}
              <div className="flex items-start justify-between pb-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedManager.avatar}
                    alt={selectedManager.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/30"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === 'ar' ? selectedManager.nameAr : selectedManager.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? selectedManager.jobTitleAr : selectedManager.jobTitle} • {selectedManager.employeeId}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedManager.email} • {selectedManager.department}
                    </p>
                  </div>
                </div>

                <div className="text-end">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {directReports.length} {t.directReportsCount}
                  </span>
                </div>
              </div>

              {/* Direct Reports List */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Assigned Team Members</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">{t.transferEmployeeNotice}</span>
                </div>

                {directReports.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-2xl border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                    {t.noDirectReports}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {directReports.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-300 dark:ring-slate-600"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {language === 'ar' ? emp.nameAr : emp.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {emp.employeeId} • {language === 'ar' ? emp.jobTitleAr : emp.jobTitle}
                            </div>
                          </div>
                        </div>

                        <AccountStatusBadge status={emp.status} lang={language} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">Select a manager to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
