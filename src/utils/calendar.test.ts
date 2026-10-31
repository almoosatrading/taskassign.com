import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateKey,
  getMonthGridDays,
  getTasksForDate,
  groupTasksBySchedule,
  getTaskDateKey,
} from './calendar';
import { Task } from '../types';

const mockTasks: Task[] = [
  {
    id: 't-1',
    title: 'Review employment contracts',
    titleAr: 'مراجعة عقود العمل',
    description: 'Check contracts for new hires',
    descriptionAr: 'التدقيق على العقود',
    assignedToId: 'emp-1',
    assignedById: 'mgr-1',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    category: 'COMPLIANCE',
    dueDate: '2026-10-31T17:00:00Z',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-26T10:00:00Z',
    progress: 40,
    attachments: [],
    comments: [],
  },
  {
    id: 't-2',
    title: 'HR Policy Documentation',
    titleAr: 'توثيق سياسات الموارد البشرية',
    description: 'Update handbook',
    descriptionAr: 'تحديث الدليل',
    assignedToId: 'emp-1',
    assignedById: 'mgr-1',
    priority: 'HIGH',
    status: 'ASSIGNED',
    category: 'DOCUMENTATION',
    dueDate: '2026-11-01T15:00:00Z',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
    progress: 10,
    attachments: [],
    comments: [],
  },
  {
    id: 't-3',
    title: 'Completed Task',
    titleAr: 'مهمة مكتملة',
    description: 'Already completed task',
    descriptionAr: 'مهمة منجزة',
    assignedToId: 'emp-2',
    assignedById: 'mgr-1',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    category: 'OPERATIONS',
    dueDate: '2026-10-20T12:00:00Z',
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-20T11:00:00Z',
    progress: 100,
    attachments: [],
    comments: [],
  },
  {
    id: 't-4',
    title: 'Overdue Task',
    titleAr: 'مهمة متأخرة',
    description: 'Past due deadline',
    descriptionAr: 'تجاوزت الموعد',
    assignedToId: 'emp-1',
    assignedById: 'mgr-1',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    category: 'OPERATIONS',
    dueDate: '2026-10-15T12:00:00Z',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
    progress: 25,
    attachments: [],
    comments: [],
  },
];

test('formatDateKey formats date to YYYY-MM-DD correctly', () => {
  const d = new Date(2026, 9, 31); // Month is 0-indexed: 9 = October
  assert.equal(formatDateKey(d), '2026-10-31');
});

test('getMonthGridDays generates complete grid rows of 7 days', () => {
  // October 2026: Oct 1 is Thursday, Oct 31 is Saturday.
  const days = getMonthGridDays(2026, 9, new Date(2026, 9, 31));
  assert.equal(days.length % 7, 0);
  assert.ok(days.length >= 35);

  const currentMonthDays = days.filter((d) => d.isCurrentMonth);
  assert.equal(currentMonthDays.length, 31);

  const oct31 = days.find((d) => d.dateStr === '2026-10-31');
  assert.ok(oct31);
  assert.equal(oct31?.isToday, true);
  assert.equal(oct31?.dayNumber, 31);
});

test('getTasksForDate accurately filters tasks by due date key', () => {
  const tasksOnOct31 = getTasksForDate(mockTasks, '2026-10-31');
  assert.equal(tasksOnOct31.length, 1);
  assert.equal(tasksOnOct31[0].id, 't-1');

  const tasksOnNov01 = getTasksForDate(mockTasks, '2026-11-01');
  assert.equal(tasksOnNov01.length, 1);
  assert.equal(tasksOnNov01[0].id, 't-2');

  const emptyTasks = getTasksForDate(mockTasks, '2026-12-25');
  assert.equal(emptyTasks.length, 0);
});

test('groupTasksBySchedule groups overdue, today, and future tasks correctly', () => {
  const refDate = new Date(2026, 9, 31); // Today is 2026-10-31
  const groups = groupTasksBySchedule(mockTasks, refDate);

  // t-4 is overdue (due 2026-10-15, in progress)
  assert.ok(groups.overdue.some((t) => t.id === 't-4'));

  // t-3 is completed, so not overdue even though due date is in the past
  assert.ok(!groups.overdue.some((t) => t.id === 't-3'));

  // t-1 is due today (2026-10-31)
  assert.ok(groups.today.some((t) => t.id === 't-1'));

  // t-2 is due tomorrow (2026-11-01)
  assert.ok(groups.tomorrow.some((t) => t.id === 't-2'));
});
