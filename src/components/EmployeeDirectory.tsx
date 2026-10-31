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
  Edit3,
  Trash2,
  Lock,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Language, User, UserRole, AccountStatus } from '../types';
import { translations } from '../i18n/translations';
import { AccountStatusBadge, RoleBadge } from './Badge';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&auto=format&fit=crop&q=80',
];

interface EmployeeDirectoryProps {
  users: User[];
  currentUser: User;
  language: Language;
  onAddEmployee: (newUser: Omit<User, 'id'> & { temporaryPassword?: string }) => void;
  onUpdateEmployee: (id: string, updates: Partial<User>) => void;
  onUpdateAvatar?: (userId: string, avatar: string) => Promise<void>;
  onToggleStatus: (userId: string, newStatus: AccountStatus) => void;
  onResetPassword: (userId: string) => Promise<string>;
  onDeleteUser: (userId: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  users,
  currentUser,
  language,
  onAddEmployee,
  onUpdateEmployee,
  onToggleStatus,
  onResetPassword,
  onDeleteUser,
}) => {
  const t = translations[language];
  const isAdmin = currentUser.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tempPassAlert, setTempPassAlert] = useState<{ user: User; pass: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  const [initialStatus, setInitialStatus] = useState<AccountStatus>('ACTIVE');

  // Edit Employee Form State
  const [editName, setEditName] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDepartmentAr, setEditDepartmentAr] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobTitleAr, setEditJobTitleAr] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('EMPLOYEE');
  const [editManagerId, setEditManagerId] = useState<string>('');

  const managersList = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.nameAr.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  const handleResetPasswordClick = async (user: User) => {
    try {
      const tempPass = await onResetPassword(user.id);
      setTempPassAlert({ user, pass: tempPass });
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditNameAr(user.nameAr);
    setEditEmployeeId(user.employeeId);
    setEditDepartment(user.department);
    setEditDepartmentAr(user.departmentAr);
    setEditJobTitle(user.jobTitle);
    setEditJobTitleAr(user.jobTitleAr);
    setEditRole(user.role);
    setEditManagerId(user.managerId || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateEmployee(editingUser.id, {
      name: editName.trim(),
      nameAr: editNameAr.trim() || editName.trim(),
      employeeId: editEmployeeId.trim().toUpperCase(),
      department: editDepartment.trim(),
      departmentAr: editDepartmentAr.trim() || editDepartment.trim(),
      jobTitle: editJobTitle.trim(),
      jobTitleAr: editJobTitleAr.trim() || editJobTitle.trim(),
      role: editRole,
      managerId: editRole === 'ADMIN' ? null : editManagerId || null,
    });

    setEditingUser(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId || !jobTitle) return;

    onAddEmployee({
      name: name.trim(),
      nameAr: nameAr.trim() || name.trim(),
      email: email.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      role,
      department: department.trim(),
      departmentAr: departmentAr.trim() || department.trim(),
      jobTitle: jobTitle.trim(),
      jobTitleAr: jobTitleAr.trim() || jobTitle.trim(),
      managerId: role === 'ADMIN' ? null : managerId || null,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150&auto=format&fit=crop&q=80`,
      status: initialStatus,
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
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {t.passwordResetAlert} {language === 'ar' ? tempPassAlert.user.nameAr : tempPassAlert.user.name}:
              </span>
              <span className="font-mono font-extrabold text-sm ml-2 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                {tempPassAlert.pass}
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                {t.passwordCopied}
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

      {/* Directory Table */}
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
                const isSuspended = emp.status === 'SUSPENDED';

                return (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors ${
                      isDeactivated || isSuspended ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/30' : ''
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
                      <AccountStatusBadge status={emp.status} lang={language} />
                    </td>

                    {/* Admin Actions: Edit, Password Reset, Status Toggle, Delete */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title={t.editUserBtn}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetPasswordClick(emp)}
                            title={t.resetPasswordBtn}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Status Toggle Button */}
                          <button
                            onClick={() =>
                              onToggleStatus(emp.id, emp.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE')
                            }
                            title={emp.status === 'ACTIVE' ? t.deactivateBtn : t.activateBtn}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              emp.status === 'ACTIVE'
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {emp.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Remove User */}
                          <button
                            onClick={() => {
                              if (window.confirm(t.confirmDeleteUser)) {
                                onDeleteUser(emp.id);
                              }
                            }}
                            title={t.removeBtn}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE EMPLOYEE MODAL */}
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colRole}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="EMPLOYEE">{t.employee}</option>
                    <option value="MANAGER">{t.manager}</option>
                    <option value="ADMIN">{t.admin}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colDepartment}
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.accountStatusLabel}
                  </label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as AccountStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="ACTIVE">{t.statusActive} (Pre-approved)</option>
                    <option value="PENDING_APPROVAL">{t.statusPendingApproval}</option>
                    <option value="INVITED">{t.statusInvited}</option>
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
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
                ℹ️ Accounts are created through the secure server process. Passwords are never stored in plaintext.
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

      {/* EDIT EMPLOYEE & TRANSFER MANAGER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-emp-title"
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div>
                <h3 id="edit-emp-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {t.editEmployeeModalTitle}
                </h3>
                <p className="text-xs text-slate-400">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.fullNameArLabel}
                  </label>
                  <input
                    type="text"
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.employeeIdLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colRole}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="EMPLOYEE">{t.employee}</option>
                    <option value="MANAGER">{t.manager}</option>
                    <option value="ADMIN">{t.admin}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.jobTitleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colDepartment}
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Manager Assignment / Transfer */}
              {editRole !== 'ADMIN' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colManager} (Reporting Line)
                  </label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">{t.noneTopLevel}</option>
                    {managersList
                      .filter((m) => m.id !== editingUser.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.jobTitle})
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Transferring this employee to a new manager will update their task delegation authorization automatically.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {t.confirmSaveUser}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
