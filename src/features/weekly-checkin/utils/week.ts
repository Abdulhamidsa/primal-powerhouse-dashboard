import type { WeeklyCheckInStatus } from '@/features/weekly-checkin/types/weeklyCheckIn.types';

export function getWeekStartMondayLocal(date: Date = new Date()): Date {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);

  const day = local.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  local.setDate(local.getDate() - daysSinceMonday);

  return local;
}

export function toDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentWeekStartDateKey(date: Date = new Date()): string {
  return toDateKeyLocal(getWeekStartMondayLocal(date));
}

export function getWeeklyCheckInStatus(hasSubmitted: boolean, now: Date = new Date()): WeeklyCheckInStatus {
  if (hasSubmitted) return 'completed';

  const day = now.getDay();
  if (day === 1 || day === 2) return 'due';

  return 'overdue';
}

export function formatDateLabel(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
