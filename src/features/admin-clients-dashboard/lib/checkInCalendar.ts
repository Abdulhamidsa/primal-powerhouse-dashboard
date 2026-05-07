import type {
  AdminClientDailyCheckInsResponse,
  AdminDailyCheckInListItem,
} from '@/features/daily-checkin/types/adminDailyCheckIn.types';
import type {
  AdminClientWeeklyCheckInsResponse,
  AdminWeeklyCheckInListItem,
} from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';
import { toDateKeyLocal } from '@/features/daily-checkin/utils/date';
import { getWeekStartMondayLocal } from '@/features/weekly-checkin/utils/week';

export type DayReviewStatus = 'none' | 'pending' | 'reviewed';

export type CheckInDayStatus = {
  daily: DayReviewStatus;
  weekly: DayReviewStatus;
};

export type SelectedDayData = {
  daily: AdminDailyCheckInListItem[];
  weekly: AdminWeeklyCheckInListItem[];
};

function mergeDayReviewStatus(current: DayReviewStatus, next: DayReviewStatus): DayReviewStatus {
  if (current === 'reviewed' || next === 'reviewed') return 'reviewed';
  if (current === 'pending' || next === 'pending') return 'pending';
  return 'none';
}

function getWeekStartDateKeyForLocalDate(dateKey: string): string {
  const localDate = new Date(`${dateKey}T00:00:00`);
  return toDateKeyLocal(getWeekStartMondayLocal(localDate));
}

export function startOfMonthLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function startOfWeekLocal(date: Date): Date {
  return getWeekStartMondayLocal(date);
}

export function nextMonthLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function previousMonthLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1, 0, 0, 0, 0);
}

export function getMonthGridDays(monthDate: Date): Date[] {
  const start = startOfMonthLocal(monthDate);
  const firstDayOfWeek = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstDayOfWeek);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function getWeekDays(weekStartDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStartDate);
    day.setDate(weekStartDate.getDate() + index);
    return day;
  });
}

export function nextWeekLocal(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 7);
  return startOfWeekLocal(next);
}

export function previousWeekLocal(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 7);
  return startOfWeekLocal(prev);
}

export function getIsoWeekNumber(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getDayStatusTone(status: DayReviewStatus): string {
  if (status === 'reviewed') return '#16a34a';
  if (status === 'pending') return '#ea580c';
  return '#9ca3af';
}

export function buildDayStatusMap(
  dailyData: AdminClientDailyCheckInsResponse | undefined,
  weeklyData: AdminClientWeeklyCheckInsResponse | undefined,
): Record<string, CheckInDayStatus> {
  const map: Record<string, CheckInDayStatus> = {};

  const ensure = (dateKey: string) => {
    if (!map[dateKey]) {
      map[dateKey] = { daily: 'none', weekly: 'none' };
    }
    return map[dateKey];
  };

  for (const item of dailyData?.checkIns ?? []) {
    const target = ensure(item.dayDate);
    target.daily = item.reviewed ? 'reviewed' : 'pending';
  }

  for (const item of weeklyData?.checkIns ?? []) {
    const weeklyStatus: DayReviewStatus = item.reviewed ? 'reviewed' : 'pending';
    const weekStartLocal = new Date(`${item.weekStartDate}T00:00:00`);

    for (let index = 0; index < 7; index += 1) {
      const day = new Date(weekStartLocal);
      day.setDate(weekStartLocal.getDate() + index);
      const dayKey = toDateKeyLocal(day);
      const target = ensure(dayKey);
      target.weekly = mergeDayReviewStatus(target.weekly, weeklyStatus);
    }
  }

  return map;
}

export function getSelectedDayData(
  dateKey: string,
  dailyData: AdminClientDailyCheckInsResponse | undefined,
  weeklyData: AdminClientWeeklyCheckInsResponse | undefined,
): SelectedDayData {
  const selectedWeekStartKey = getWeekStartDateKeyForLocalDate(dateKey);

  return {
    daily: (dailyData?.checkIns ?? []).filter(item => item.dayDate === dateKey),
    weekly: (weeklyData?.checkIns ?? []).filter(item => item.weekStartDate === selectedWeekStartKey),
  };
}

export function getTodayDateKey(): string {
  return toDateKeyLocal(new Date());
}
