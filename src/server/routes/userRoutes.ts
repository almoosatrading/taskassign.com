import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireRole,
  logAudit,
} from '../auth';
import { User, UserRole, AccountStatus, UserWithPasswordHash } from '../../types';

const router = Router();

// Protect all user routes with authentication
router.use(authenticateToken);

/**
 * GET /api/users
 * Returns users according to caller's role:
 * - Admin: all users
 * - Manager: self + direct reports
 * - Employee: self
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const currentUser = req.user!;
  const all = db.getPublicUsers();

  if (currentUser.role === 'ADMIN') {
    return res.json({ users: all });
  }

  if (currentUser.role === 'MANAGER') {
    const directReports = all.filter(
      (u) => u.id === currentUser.id || u.managerId === currentUser.id
    );
    return res.json({ users: directReports });
  }

  // Employee: allow self and their assigned reporting manager
  const selfAndManager = all.filter(
    (u) => u.id === currentUser.id || (Boolean(currentUser.managerId) && u.id === currentUser.managerId)
  );
  return res.json({ users: selfAndManager });
});

/**
 * POST /api/users
 * Admin only: Create new Employee or Manager account
 */
router.post('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    nameAr,
    email,
    employeeId,
    role,
    department,
    departmentAr,
    jobTitle,
    jobTitleAr,
    managerId,
    status = 'ACTIVE',
    temporaryPassword,
  } = req.body;

  if (!name || !email || !employeeId || !role) {
    return res.status(400).json({ error: 'MissingRequiredFields', message: 'Name, email, employee ID, and role are required' });
  }

  // Check unique email and employeeId
  const existingEmail = db.findUserByEmail(email.trim());
  if (existingEmail) {
    return res.status(409).json({ error: 'EmailConflict', message: 'An account with this company email already exists' });
  }

  const existingEmpId = db.getUsers().find((u) => u.employeeId.toLowerCase() === employeeId.trim().toLowerCase());
  if (existingEmpId) {
    return res.status(409).json({ error: 'EmployeeIdConflict', message: 'An account with this Employee ID already exists' });
  }

  // Default password or supplied temporary password
  const passToHash = temporaryPassword || `AlMoosa!${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = await bcrypt.hash(passToHash, 10);

  const newId = `usr-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
  const now = new Date().toISOString();

  const newUser: UserWithPasswordHash = {
    id: newId,
    name: name.trim(),
    nameAr: nameAr?.trim() || name.trim(),
    email: email.trim(),
    employeeId: employeeId.trim().toUpperCase(),
    passwordHash,
    role: role as UserRole,
    department: department?.trim() || 'General Operations',
    departmentAr: departmentAr?.trim() || department?.trim() || 'العمليات العامة',
    jobTitle: jobTitle?.trim() || 'Staff Member',
    jobTitleAr: jobTitleAr?.trim() || jobTitle?.trim() || 'عضو فريق',
    managerId: role === 'ADMIN' ? null : managerId || null,
    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 800)}?w=150&auto=format&fit=crop&q=80`,
    status: (status as AccountStatus) || 'ACTIVE',
    mustChangePassword: true,
    emailVerified: true,
    createdAt: now,
    createdBy: req.user!.id,
    approvedBy: status === 'ACTIVE' ? req.user!.id : null,
    approvalDate: status === 'ACTIVE' ? now : null,
  };

  db.addUser(newUser);

  logAudit(
    req,
    'USER_CREATE',
    'إنشاء حساب موظف',
    `Created ${newUser.role} account ${newUser.name} (${newUser.employeeId}), status: ${newUser.status}`,
    `تم إنشاء حساب ${newUser.role} لـ ${newUser.nameAr} (${newUser.employeeId}) بحالة: ${newUser.status}`,
    'DIRECTORY',
    'SUCCESS',
    newUser.id
  );

  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({
    user: safeUser,
    temporaryPassword: passToHash,
    message: 'Account created successfully',
  });
});

/**
 * PUT /api/users/:id
 * Admin only: Update employee details or transfer manager
 */
router.put('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.findUserById(id);
  if (!user) return res.status(404).json({ error: 'UserNotFound' });

  const {
    name,
    nameAr,
    employeeId,
    department,
    departmentAr,
    jobTitle,
    jobTitleAr,
    role,
    managerId,
    avatar,
  } = req.body;

  const previousManager = user.managerId;
  const updates: Partial<UserWithPasswordHash> = {};

  if (name !== undefined) updates.name = name.trim();
  if (nameAr !== undefined) updates.nameAr = nameAr.trim();
  if (employeeId !== undefined) updates.employeeId = employeeId.trim().toUpperCase();
  if (department !== undefined) updates.department = department.trim();
  if (departmentAr !== undefined) updates.departmentAr = departmentAr.trim();
  if (jobTitle !== undefined) updates.jobTitle = jobTitle.trim();
  if (jobTitleAr !== undefined) updates.jobTitleAr = jobTitleAr.trim();
  if (role !== undefined) updates.role = role as UserRole;
  if (managerId !== undefined) updates.managerId = role === 'ADMIN' ? null : managerId || null;
  if (avatar !== undefined) updates.avatar = avatar.trim();

  const updated = db.updateUser(id, updates);

  logAudit(
    req,
    'USER_UPDATE',
    'تعديل بيانات موظف',
    `Updated profile of ${user.name} (${user.employeeId}). Manager changed from ${previousManager} to ${updates.managerId ?? previousManager}${avatar ? ', avatar updated' : ''}`,
    `تم تحديث بيانات الموظف ${user.nameAr}. المدير: ${updates.managerId ?? previousManager}`,
    'DIRECTORY',
    'SUCCESS',
    id
  );

  const { passwordHash: _, ...safeUser } = updated!;
  return res.json({ user: safeUser, message: 'User updated successfully' });
});

/**
 * PATCH /api/users/:id/avatar
 * Admin only: Update employee profile photo
 */
router.patch('/:id/avatar', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { avatar } = req.body;

  if (!avatar || typeof avatar !== 'string' || !avatar.trim()) {
    return res.status(400).json({ error: 'AvatarRequired', message: 'A valid image URL or image data is required.' });
  }

  const user = db.findUserById(id);
  if (!user) return res.status(404).json({ error: 'UserNotFound', message: 'Employee account not found.' });

  const updated = db.updateUser(id, { avatar: avatar.trim() });

  logAudit(
    req,
    'USER_AVATAR_UPDATE',
    'تحديث صورة الموظف',
    `Admin updated profile photo for ${user.name} (${user.employeeId})`,
    `قام مسؤول النظام بتحديث صورة الملف الشخصي للموظف ${user.nameAr}`,
    'DIRECTORY',
    'SUCCESS',
    id
  );

  const { passwordHash: _, ...safeUser } = updated!;
  return res.json({ user: safeUser, message: 'Employee photo updated successfully' });
});

/**
 * PATCH /api/users/:id/status
 * Admin only: Activate, Deactivate, or Suspend
 */
router.patch('/:id/status', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  const user = db.findUserById(id);
  if (!user) return res.status(404).json({ error: 'UserNotFound' });

  // Protect initial admin from deactivation
  if (user.email === 'almoosatradinghrd@gmail.com' && status !== 'ACTIVE') {
    return res.status(400).json({ error: 'CannotDeactivateRootAdmin', message: 'The primary Admin account cannot be deactivated' });
  }

  const updated = db.updateUser(id, {
    status: status as AccountStatus,
    approvalNotes: notes || user.approvalNotes,
  });

  logAudit(
    req,
    'USER_STATUS_CHANGE',
    'تغيير حالة الحساب',
    `Changed status of ${user.name} (${user.employeeId}) to ${status}`,
    `تم تغيير حالة حساب ${user.nameAr} إلى ${status}`,
    'DIRECTORY',
    'SUCCESS',
    id
  );

  const { passwordHash: _, ...safeUser } = updated!;
  return res.json({ user: safeUser, message: `Status changed to ${status}` });
});

/**
 * DELETE /api/users/:id
 * Admin only: Remove employee
 */
router.delete('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.findUserById(id);
  if (!user) return res.status(404).json({ error: 'UserNotFound' });

  if (user.email === 'almoosatradinghrd@gmail.com') {
    return res.status(400).json({ error: 'CannotDeleteRootAdmin', message: 'Primary Admin cannot be removed' });
  }

  db.deleteUser(id);

  logAudit(
    req,
    'USER_DELETE',
    'حذف موظف',
    `Removed employee account ${user.name} (${user.email})`,
    `تم حذف حساب الموظف ${user.nameAr} (${user.email})`,
    'DIRECTORY',
    'SUCCESS',
    id
  );

  return res.json({ success: true, message: 'Account removed successfully' });
});

/**
 * GET /api/approvals
 * Admin only: List all pending employee approval requests
 */
router.get('/approvals/pending', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const pending = db.getPublicUsers().filter((u) => u.status === 'PENDING_APPROVAL');
  return res.json({ pendingApprovals: pending });
});

/**
 * POST /api/approvals/:id/decision
 * Admin only: Approve or Reject an employee's onboarding
 */
router.post('/approvals/:id/decision', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { decision, notes } = req.body; // 'APPROVE' | 'REJECT'

  const user = db.findUserById(id);
  if (!user) return res.status(404).json({ error: 'UserNotFound' });

  const now = new Date().toISOString();
  const newStatus: AccountStatus = decision === 'APPROVE' ? 'ACTIVE' : 'REJECTED';

  const updated = db.updateUser(id, {
    status: newStatus,
    approvedBy: req.user!.id,
    approvalDate: now,
    approvalNotes: notes || null,
  });

  // Notify the user
  db.addNotification({
    id: `notif-${Date.now()}`,
    recipientUserId: user.id,
    title: decision === 'APPROVE' ? 'Account Approved' : 'Account Registration Update',
    titleAr: decision === 'APPROVE' ? 'تم اعتماد حسابك بنجاح' : 'تحديث بشأن طلب تسجيل الحساب',
    message:
      decision === 'APPROVE'
        ? 'Your account has been approved by the HR Administrator. You now have full portal access.'
        : `Your registration request was reviewed: ${notes || 'Application rejected by administration.'}`,
    messageAr:
      decision === 'APPROVE'
        ? 'تمت الموافقة على حسابك واعتماده من قبل إدارة الموارد البشرية، يمكنك الآن استخدام البوابة بالكامل.'
        : `تمت مراجعة طلب التسجيل: ${notes || 'تم رفض الطلب من قبل الإدارة.'}`,
    taskId: null,
    read: false,
    createdAt: now,
    type: 'APPROVAL',
  });

  logAudit(
    req,
    decision === 'APPROVE' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
    decision === 'APPROVE' ? 'اعتماد حساب موظف' : 'رفض حساب موظف',
    `${decision === 'APPROVE' ? 'Approved' : 'Rejected'} account onboarding for ${user.name} (${user.email}). Notes: ${notes || 'None'}`,
    `تم ${decision === 'APPROVE' ? 'اعتماد' : 'رفض'} طلب انضمام ${user.nameAr}`,
    'APPROVAL',
    'SUCCESS',
    id
  );

  const { passwordHash: _, ...safeUser } = updated!;
  return res.json({
    user: safeUser,
    message: `Account ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
  });
});

/**
 * POST /api/users/:id/reset-password
 * Admin triggers password reset
 */
router.post('/:id/reset-password', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.findUserById(id);
  if (!user) return res.status(404).json({ error: 'UserNotFound' });

  const tempPass = `AlMoosa!${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = await bcrypt.hash(tempPass, 10);

  db.updateUser(id, {
    passwordHash,
    mustChangePassword: true,
  });

  logAudit(
    req,
    'PASSWORD_RESET',
    'إعادة تعيين كلمة المرور',
    `Admin reset password for ${user.name} (${user.email})`,
    `قام المسؤول بإعادة ضبط كلمة المرور لـ ${user.nameAr}`,
    'SECURITY',
    'SUCCESS',
    id
  );

  return res.json({
    temporaryPassword: tempPass,
    message: 'Password reset successfully. Provide the temporary password securely.',
  });
});

export default router;
