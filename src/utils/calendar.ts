/**
 * Pure Calendar helper functions for Task Management System
 */
import { Task } from '../types';
import { isTaskOverdue } from './rbac';

/**
 * Format a Date object into YYYY-MM-DD key for timezone-consistent matching
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse an ISO or date string to YYYY-MM-DD
 */
export function getTaskDateKey(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return '';
  return formatDateKey(parsed);
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generates all calendar days to display in a standard 7-day grid for a given year & month (0-indexed)
 * starting on Sunday (index 0).
 */
export function getMonthGridDays(year: number, month: number, todayRef: Date = new Date()): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const days: CalendarDay[] = [];
  const todayKey = formatDateKey(todayRef);

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    const dateStr = formatDateKey(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayKey,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDateKey(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayKey,
    });
  }

  // Next month leading days to complete full 7-day rows (up to 35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = formatDateKey(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayKey,
    });
  }

  return days;
}

/**
 * Groups tasks for a given date
 */
export function getTasksForDate(tasks: Task[], dateKey: string): Task[] {
  return tasks.filter((t) => getTaskDateKey(t.dueDate) === dateKey);
}

export interface ScheduleGroups {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  later: Task[];
}

/**
 * Categorizes tasks into schedule agenda groups relative to today
 */
export function groupTasksBySchedule(tasks: Task[], todayRef: Date = new Date()): ScheduleGroups {
  const todayKey = formatDateKey(todayRef);

  const tomorrow = new Date(todayRef);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  const weekEnd = new Date(todayRef);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndKey = formatDateKey(weekEnd);

  const groups: ScheduleGroups = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  for (const task of tasks) {
    const taskKey = getTaskDateKey(task.dueDate);
    if (!taskKey) continue;

    const isOverdue = isTaskOverdue(task.dueDate, task.status);

    if (isOverdue) {
      groups.overdue.push(task);
    } else if (taskKey === todayKey) {
      groups.today.push(task);
    } else if (taskKey === tomorrowKey) {
      groups.tomorrow.push(task);
    } else if (taskKey > tomorrowKey && taskKey <= weekEndKey) {
      groups.thisWeek.push(task);
    } else {
      groups.later.push(task);
    }
  }

  // Sort each group by dueDate ascending
  const sortByDue = (a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  groups.overdue.sort(sortByDue);
  groups.today.sort(sortByDue);
  groups.tomorrow.sort(sortByDue);
  groups.thisWeek.sort(sortByDue);
  groups.later.sort(sortByDue);

  return groups;
}
