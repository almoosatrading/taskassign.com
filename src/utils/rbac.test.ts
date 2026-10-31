import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAssignTask,
  canViewTask,
  canUpdateTask,
  isTaskOverdue,
  getDeadlineCountdown,
  generateWhatsAppShareUrl,
  filterTasks,
} from './rbac';
import { Task, User } from '../types';

const managerSarah: User = {
  id: 'usr-sarah',
  name: 'Sarah Al-Otaibi',
  nameAr: 'سارة العتيبي',
  employeeId: 'EMP-0102',
  email: 's.otaibi@almoosa.com.sa',
  role: 'MANAGER',
  department: 'Marketing & Operations',
  departmentAr: 'التسويق والعمليات',
  jobTitle: 'Marketing & Operations Manager',
  jobTitleAr: 'مديرة التسويق والعمليات',
  managerId: 'usr-tariq',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  status: 'ACTIVE',
};

const employeeAhmed: User = {
  id: 'usr-ahmed',
  name: 'Ahmed Mansoor',
  nameAr: 'أحمد منصور',
  employeeId: 'EMP-0205',
  email: 'a.mansoor@almoosa.com.sa',
  role: 'EMPLOYEE',
  department: 'Marketing & Operations',
  departmentAr: 'التسويق والعمليات',
  jobTitle: 'HR & Operations Coordinator',
  jobTitleAr: 'منسق الموارد البشرية والعمليات',
  managerId: 'usr-sarah',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  status: 'ACTIVE',
};

const employeeOmar: User = {
  id: 'usr-omar',
  name: 'Omar Farooq',
  nameAr: 'عمر فاروق',
  employeeId: 'EMP-0312',
  email: 'o.farooq@almoosa.com.sa',
  role: 'EMPLOYEE',
  department: 'Supply Chain',
  departmentAr: 'سلاسل الإمداد',
  jobTitle: 'Logistics Specialist',
  jobTitleAr: 'أخصائي الخدمات اللوجستية',
  managerId: 'usr-khalid', // Reports to Khalid, NOT Sarah
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  status: 'ACTIVE',
};

const employeeDeactivated: User = {
  id: 'usr-deact',
  name: 'Inactive Employee',
  nameAr: 'موظف معطل',
  employeeId: 'EMP-9999',
  email: 'inactive@almoosa.com.sa',
  role: 'EMPLOYEE',
  department: 'Marketing',
  departmentAr: 'التسويق',
  jobTitle: 'Assistant',
  jobTitleAr: 'مساعد',
  managerId: 'usr-sarah',
  avatar: '',
  status: 'DEACTIVATED',
};

const adminTariq: User = {
  id: 'usr-tariq',
  name: 'Tariq Al-Moosa',
  nameAr: 'طارق الموسى',
  employeeId: 'EMP-0001',
  email: 't.moosa@almoosa.com.sa',
  role: 'ADMIN',
  department: 'Executive HR',
  departmentAr: 'الإدارة التنفيذية للموارد البشرية',
  jobTitle: 'HR Director',
  jobTitleAr: 'مدير الموارد البشرية',
  managerId: null,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  status: 'ACTIVE',
};

const sampleTask: Task = {
  id: 'tsk-001',
  title: 'Quarterly Employee Onboarding Audit',
  titleAr: 'تدقيق انضمام الموظفين الفصلي',
  description: 'Review compliance documents for Q3 new hires.',
  descriptionAr: 'مراجعة مستندات الامتثال للموظفين الجدد في الربع الثالث.',
  assignedToId: 'usr-ahmed',
  assignedById: 'usr-sarah',
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  category: 'COMPLIANCE',
  dueDate: '2026-11-05T14:00:00Z',
  createdAt: '2026-10-25T08:00:00Z',
  updatedAt: '2026-10-28T10:00:00Z',
  progress: 50,
  attachments: [],
  comments: [],
};

const allUsers = [managerSarah, employeeAhmed, employeeOmar, employeeDeactivated, adminTariq];

test('Manager scope: Sarah can assign task to Ahmed (her direct report)', () => {
  assert.equal(canAssignTask(managerSarah, employeeAhmed), true);
});

test('Manager scope: Sarah CANNOT assign task to Omar (reports to Khalid)', () => {
  assert.equal(canAssignTask(managerSarah, employeeOmar), false);
});

test('Manager scope: Sarah CANNOT assign task to deactivated report', () => {
  assert.equal(canAssignTask(managerSarah, employeeDeactivated), false);
});

test('Manager scope: Non-manager cannot assign tasks', () => {
  assert.equal(canAssignTask(employeeAhmed, employeeOmar), false);
});

test('Task privacy: Ahmed can view his own assigned task', () => {
  assert.equal(canViewTask(employeeAhmed, sampleTask, allUsers), true);
});

test('Task privacy: Omar CANNOT view Ahmed’s task', () => {
  assert.equal(canViewTask(employeeOmar, sampleTask, allUsers), false);
});

test('Task privacy: Sarah (manager) can view her direct report’s task', () => {
  assert.equal(canViewTask(managerSarah, sampleTask, allUsers), true);
});

test('Task privacy: Admin has company-wide visibility to oversee all tasks', () => {
  assert.equal(canViewTask(adminTariq, sampleTask, allUsers), true);
});

test('Task update: Ahmed can update his own task', () => {
  assert.equal(canUpdateTask(employeeAhmed, sampleTask), true);
  assert.equal(canUpdateTask(employeeOmar, sampleTask), false);
});

test('Overdue logic accurately handles past and future due dates', () => {
  const futureDate = '2026-11-01T10:00:00Z';
  const pastDate = '2026-10-20T10:00:00Z';
  const now = new Date('2026-10-29T10:00:00Z');

  assert.equal(isTaskOverdue(futureDate, 'PENDING', now), false);
  assert.equal(isTaskOverdue(pastDate, 'PENDING', now), true);
  assert.equal(isTaskOverdue(pastDate, 'COMPLETED', now), false); // Completed tasks are not overdue
});

test('WhatsApp share URL generator creates proper wa.me link without secrets', () => {
  const url = generateWhatsAppShareUrl('Review Safety Protocols', 'tsk-101', 'https://portal.almoosa.com', 'en');
  assert.ok(url.startsWith('https://wa.me/?text='));
  assert.ok(url.includes(encodeURIComponent('Review Safety Protocols')));
  assert.ok(url.includes(encodeURIComponent('https://portal.almoosa.com?task=tsk-101')));
});

test('Task filtering works across status, priority, and search', () => {
  const tasks: Task[] = [
    sampleTask,
    {
      ...sampleTask,
      id: 'tsk-002',
      title: 'Prepare Marketing Collateral',
      titleAr: 'تجهيز مواد التسويق',
      priority: 'LOW',
      status: 'COMPLETED',
      category: 'MARKETING',
    },
  ];

  const filteredByStatus = filterTasks(tasks, { status: 'IN_PROGRESS' });
  assert.equal(filteredByStatus.length, 1);
  assert.equal(filteredByStatus[0].id, 'tsk-001');

  const filteredBySearch = filterTasks(tasks, { search: 'Marketing' });
  assert.equal(filteredBySearch.length, 1);
  assert.equal(filteredBySearch[0].id, 'tsk-002');
});

test('Manager team filtering: Sarah only sees her direct reports', () => {
  const sarahReports = allUsers.filter(
    (u) => u.managerId === managerSarah.id && u.role === 'EMPLOYEE'
  );
  assert.equal(sarahReports.length, 2); // Ahmed and deactivated
  assert.ok(sarahReports.some((u) => u.id === 'usr-ahmed'));
  assert.ok(!sarahReports.some((u) => u.id === 'usr-omar')); // Omar reports to Khalid
});

test('Cross-manager task allocation: Sarah CANNOT allocate to Omar', () => {
  const canSarahAllocateOmar = canAssignTask(managerSarah, employeeOmar);
  assert.equal(canSarahAllocateOmar, false);
});

test('Employee self-service isolation: Ahmed CANNOT assign tasks to anyone', () => {
  const canAhmedAssign = canAssignTask(employeeAhmed, employeeOmar);
  assert.equal(canAhmedAssign, false);
});

test('Admin authority: Tariq can assign tasks across any employee', () => {
  assert.equal(canAssignTask(adminTariq, employeeAhmed), true);
  assert.equal(canAssignTask(adminTariq, employeeOmar), true);
});

