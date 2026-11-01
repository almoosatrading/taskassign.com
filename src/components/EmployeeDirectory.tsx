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
import { extractErrorMessage } from '../api/client';

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
  onAddEmployee: (newUser: Omit<User, 'id'> & { temporaryPassword?: string }) => Promise<any> | any;
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
  onUpdateAvatar,
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

  // Dedicated Admin Photo Modal State
  const [photoModalUser, setPhotoModalUser] = useState<User | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const [isSavingPhoto, setIsSavingPhoto] = useState<boolean>(false);

  const handleOpenPhotoModal = (user: User) => {
    setPhotoModalUser(user);
    setSelectedPhoto(user.avatar);
    setCustomPhotoUrl('');
    setPhotoError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          setSelectedPhoto(canvas.toDataURL('image/jpeg', 0.85));
          setPhotoError('');
        } else {
          setSelectedPhoto(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoModalUser) return;
    const finalAvatar = (customPhotoUrl.trim() || selectedPhoto).trim();
    if (!finalAvatar) {
      setPhotoError('Please select or upload a photo');
      return;
    }

    try {
      setIsSavingPhoto(true);
      if (onUpdateAvatar) {
        await onUpdateAvatar(photoModalUser.id, finalAvatar);
      } else {
        onUpdateEmployee(photoModalUser.id, { avatar: finalAvatar });
      }
      setPhotoModalUser(null);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to update employee photo');
    } finally {
      setIsSavingPhoto(false);
    }
  };

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
  const [addError, setAddError] = useState<string>('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !employeeId.trim() || !jobTitle.trim()) {
      setAddError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      setAddError('');
      const res: any = await onAddEmployee({
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

      if (res?.temporaryPassword) {
        setTempPassAlert({ user: res.user || { name: name.trim(), nameAr: nameAr.trim() || name.trim() } as User, pass: res.temporaryPassword });
      }

      setShowAddModal(false);
      // Reset inputs
      setName('');
      setNameAr('');
      setEmail('');
      setEmployeeId('');
      setJobTitle('');
      setJobTitleAr('');
      setAddError('');
    } catch (err: any) {
      setAddError(extractErrorMessage(err));
    } finally {
      setIsSubmittingAdd(false);
    }
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
                        <div className="relative group/avatar shrink-0">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                          />
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoModal(emp)}
                              title={t.changeEmployeePhoto}
                              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-600 text-white shadow-xs opacity-75 group-hover/avatar:opacity-100 hover:scale-110 transition-all cursor-pointer"
                            >
                              <Camera className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
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

                    {/* Admin Actions: Change Photo, Edit, Password Reset, Status Toggle, Delete */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(emp)}
                            title={t.changeEmployeePhoto}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

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
              {addError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-rose-800 dark:text-rose-200 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">{language === 'ar' ? 'تعذر إنشاء الحساب' : 'Unable to create account'}</span>
                    <span className="text-[11px] opacity-90">{addError}</span>
                  </div>
                </div>
              )}

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
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold cursor-pointer transition-opacity"
                >
                  {isSubmittingAdd
                    ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                    : t.confirmCreateEmployee}
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

      {/* DEDICATED CHANGE EMPLOYEE PHOTO MODAL (ADMIN ONLY) */}
      {photoModalUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-modal-title"
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="photo-modal-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t.changeEmployeePhoto}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar' ? photoModalUser.nameAr : photoModalUser.name} • {photoModalUser.employeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Photo Comparison Preview */}
              <div className="flex items-center justify-center gap-6 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="text-center space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.currentPhoto}
                  </span>
                  <div className="relative mx-auto w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs">
                    <img
                      src={photoModalUser.avatar}
                      alt="Current"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-slate-300 dark:text-slate-600">→</div>

                <div className="text-center space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {t.newPhotoPreview}
                  </span>
                  <div className="relative mx-auto w-16 h-16 rounded-2xl overflow-hidden ring-3 ring-emerald-500 shadow-md">
                    <img
                      src={customPhotoUrl.trim() || selectedPhoto || photoModalUser.avatar}
                      alt="New Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {photoError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Option 1: File Upload */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {t.uploadPhoto}
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl bg-white dark:bg-slate-800/60 transition-colors cursor-pointer group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600">
                    Click to browse image file
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {t.uploadPhotoDesc}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option 2: Curated Corporate Presets */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {t.selectPresetAvatar}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((avatarUrl, idx) => {
                    const isSelected = selectedPhoto === avatarUrl && !customPhotoUrl.trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(avatarUrl);
                          setCustomPhotoUrl('');
                          setPhotoError('');
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-500/50 scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={avatarUrl}
                          alt={`Preset ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 3: Direct URL */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {t.photoUrlLabel}
                </label>
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => {
                    setCustomPhotoUrl(e.target.value);
                    setPhotoError('');
                  }}
                  placeholder={t.photoUrlPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                {t.adminOnlyPhotoNotice}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPhotoModalUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isSavingPhoto}
                onClick={handleSavePhoto}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/15 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingPhoto ? (
                  <span>{t.loading}</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.savePhotoBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
