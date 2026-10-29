import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  UserX,
  UserCheck,
  Shield,
  Briefcase,
  Building,
  Mail,
  Copy,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Language, User, UserRole } from '../types';
import { translations } from '../i18n/translations';
import { RoleBadge } from './Badge';

interface EmployeeDirectoryProps {
  users: User[];
  currentUser: User;
  language: Language;
  onAddEmployee: (newUser: Omit<User, 'id'>) => void;
  onToggleStatus: (userId: string) => void;
  onResetPassword: (userId: string) => string; // returns generated temporary password
  onChangeRole: (userId: string, newRole: UserRole) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  users,
  currentUser,
  language,
  onAddEmployee,
  onToggleStatus,
  onResetPassword,
  onChangeRole,
}) => {
  const t = translations[language];
  const isAdmin = currentUser.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempPassAlert, setTempPassAlert] = useState<{ user: User; pass: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // New Employee Form State
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [department, setDepartment] = useState('Marketing & Commercial Operations');
  const [departmentAr, setDepartmentAr] = useState('التسويق والعمليات التجارية');
  const [jobTitle, setJobTitle] = useState('');
  const [jobTitleAr, setJobTitleAr] = useState('');
  const [managerId, setManagerId] = useState<string>('usr-sarah');

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.nameAr.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q)
    );
  });

  const handleResetPasswordClick = (user: User) => {
    const tempPass = onResetPassword(user.id);
    setTempPassAlert({ user, pass: tempPass });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId || !jobTitle) return;

    onAddEmployee({
      name: name.trim(),
      nameAr: nameAr.trim() || name.trim(),
      email: email.trim(),
      employeeId: employeeId.trim(),
      role,
      department: department.trim(),
      departmentAr: departmentAr.trim() || department.trim(),
      jobTitle: jobTitle.trim(),
      jobTitleAr: jobTitleAr.trim() || jobTitle.trim(),
      managerId: role === 'ADMIN' ? null : managerId || null,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150`,
      status: 'ACTIVE',
      mustChangePassword: true,
    });

    setShowAddModal(false);
    // Reset inputs
    setName('');
    setNameAr('');
    setEmail('');
    setEmployeeId('');
    setJobTitle('');
    setJobTitleAr('');
  };

  const managersList = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            {t.directoryTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.directorySubtitle}</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addEmployeeBtn}</span>
          </button>
        )}
      </div>

      {/* Temporary Password Notification Alert */}
      {tempPassAlert && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {t.passwordResetAlert} {language === 'ar' ? tempPassAlert.user.nameAr : tempPassAlert.user.name}:
              </span>
              <span className="font-mono font-extrabold text-sm ml-2 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                {tempPassAlert.pass}
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                {t.temporaryPasswordNote}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(tempPassAlert.pass);
                setCopiedPass(true);
                setTimeout(() => setCopiedPass(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1 cursor-pointer"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPass ? t.copiedToClipboard : 'Copy'}</span>
            </button>
            <button
              onClick={() => setTempPassAlert(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchEmployees}
          className={`w-full py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs ${
            language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'
          }`}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5 text-start">{t.colEmpId}</th>
                <th className="px-4 py-3.5 text-start">{t.colName}</th>
                <th className="px-4 py-3.5 text-start">{t.colDepartment}</th>
                <th className="px-4 py-3.5 text-start">{t.colRole}</th>
                <th className="px-4 py-3.5 text-start">{t.colManager}</th>
                <th className="px-4 py-3.5 text-start">{t.colStatus}</th>
                {isAdmin && <th className="px-4 py-3.5 text-end">{t.colActions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredUsers.map((emp) => {
                const manager = users.find((m) => m.id === emp.managerId);
                const isDeactivated = emp.status === 'DEACTIVATED';
                return (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors ${
                      isDeactivated ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {emp.employeeId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {language === 'ar' ? emp.nameAr : emp.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {language === 'ar' ? emp.jobTitleAr : emp.jobTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {language === 'ar' ? emp.departmentAr : emp.department}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={emp.role} lang={language} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {manager ? (
                        <span className="font-medium">
                          {language === 'ar' ? manager.nameAr : manager.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{t.noneTopLevel}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          !isDeactivated
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${!isDeactivated ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        {!isDeactivated ? t.activeStatus : t.deactivatedStatus}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResetPasswordClick(emp)}
                            title={t.resetPasswordBtn}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleStatus(emp.id)}
                            title={isDeactivated ? t.activateBtn : t.deactivateBtn}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDeactivated
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isDeactivated ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-emp-title"
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <h3 id="add-emp-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {t.addEmployeeModalTitle}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.fullNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Faisal Al-Harbi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.fullNameArLabel}
                  </label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: فيصل الحربي"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.emailLabel} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="f.harbi@almoosa.com.sa"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.employeeIdLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-0240"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.jobTitleLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Sales Coordinator"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colRole}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="EMPLOYEE">{t.employee}</option>
                    <option value="MANAGER">{t.manager}</option>
                    <option value="ADMIN">{t.admin}</option>
                  </select>
                </div>
              </div>

              {role !== 'ADMIN' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colManager}
                  </label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {managersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                ℹ️ {t.temporaryPasswordNote}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {t.confirmCreateEmployee}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
