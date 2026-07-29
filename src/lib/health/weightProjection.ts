export type WeightTimelinePoint = {
  date: string;
  label: string;
  actualWeightKg: number | null;
  projectedWeightKg: number | null;
};

export type WeightProjectionSummary = {
  direction: 'lose' | 'gain' | 'maintain';
  weeklyChangeKg: number;
  estimatedWeeks: number | null;
  estimatedDays: number | null;
  estimatedTargetDate: string | null;
  startWeightKg: number | null;
  targetWeightKg: number | null;
  projectedWeightPoints: Array<{ date: string; weightKg: number }>;
};

type WeeklyCheckInLike = {
  submittedAt: string;
  weightKg: number | null;
};

type ProjectionInput = {
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  tdeeKgPerDay?: number | null;
  goalCaloriesPerDay?: number | null;
  weeklyCheckIns?: WeeklyCheckInLike[];
  startDate?: Date;
  maxWeeks?: number;
};

const KCAL_PER_KG_WEIGHT_CHANGE = 7700;
const DEFAULT_MAX_WEEKS = 52;

function toDate(value: string | Date): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildWeightProjectionTimeline({
  currentWeightKg,
  targetWeightKg,
  tdeeKgPerDay,
  goalCaloriesPerDay,
  weeklyCheckIns = [],
  startDate = new Date(),
  maxWeeks = DEFAULT_MAX_WEEKS,
}: ProjectionInput): { summary: WeightProjectionSummary; timeline: WeightTimelinePoint[] } {
  const current = typeof currentWeightKg === 'number' && Number.isFinite(currentWeightKg) ? currentWeightKg : null;
  const target = typeof targetWeightKg === 'number' && Number.isFinite(targetWeightKg) ? targetWeightKg : null;
  const tdee = typeof tdeeKgPerDay === 'number' && Number.isFinite(tdeeKgPerDay) ? tdeeKgPerDay : null;
  const goalCalories =
    typeof goalCaloriesPerDay === 'number' && Number.isFinite(goalCaloriesPerDay) ? goalCaloriesPerDay : null;
  const sortedHistory = weeklyCheckIns
    .filter(item => item.weightKg != null)
    .map(item => ({
      date: toDate(item.submittedAt),
      weightKg: Number(item.weightKg),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const targetDistanceKg =
    current != null && target != null ? Math.abs(round1(current - target)) : null;
  const direction =
    current != null && target != null
      ? current > target
        ? 'lose'
        : current < target
          ? 'gain'
          : 'maintain'
      : 'maintain';

  const dailyDeficit = tdee != null && goalCalories != null ? tdee - goalCalories : null;
  const weeklyChangeRaw =
    dailyDeficit != null
      ? direction === 'lose'
        ? Math.max(0, dailyDeficit)
        : direction === 'gain'
          ? Math.max(0, -dailyDeficit)
          : 0
      : null;
  const weeklyChangeKgRaw = weeklyChangeRaw != null ? (weeklyChangeRaw * 7) / KCAL_PER_KG_WEIGHT_CHANGE : null;
  const weeklyChangeKg =
    direction === 'maintain' || weeklyChangeKgRaw == null
      ? 0
      : round1(weeklyChangeKgRaw);

  const effectiveWeeklyChangeKg =
    direction === 'maintain' ? 0 : weeklyChangeKg > 0.05 ? weeklyChangeKg : 0;

  const estimatedWeeks =
    targetDistanceKg != null && effectiveWeeklyChangeKg > 0
      ? Math.max(1, Math.ceil(targetDistanceKg / effectiveWeeklyChangeKg))
      : null;
  const estimatedDays = estimatedWeeks != null ? estimatedWeeks * 7 : null;

  const projectedPoints: Array<{ date: string; weightKg: number }> = [];
  const timeline: WeightTimelinePoint[] = [];
  const currentDate = new Date(startDate.getTime());

  if (current != null) {
    projectedPoints.push({ date: currentDate.toISOString(), weightKg: current });
  }

  const latestHistoryPoint = sortedHistory.at(-1);
  if (latestHistoryPoint && current != null) {
    projectedPoints.push({
      date: latestHistoryPoint.date.toISOString(),
      weightKg: current,
    });
  }

  if (estimatedWeeks != null && current != null && target != null) {
    for (let week = 1; week <= Math.min(estimatedWeeks, maxWeeks); week += 1) {
      const nextDate = new Date(currentDate.getTime());
      nextDate.setDate(nextDate.getDate() + week * 7);

      const nextWeight =
        direction === 'lose'
          ? Math.max(target, current - effectiveWeeklyChangeKg * week)
          : direction === 'gain'
            ? Math.min(target, current + effectiveWeeklyChangeKg * week)
            : current;

      projectedPoints.push({
        date: nextDate.toISOString(),
        weightKg: round1(nextWeight),
      });
    }
  }

  const allDates = new Map<string, WeightTimelinePoint>();
  for (const item of sortedHistory) {
    const key = item.date.toISOString();
    allDates.set(key, {
      date: key,
      label: formatLabel(item.date),
      actualWeightKg: item.weightKg,
      projectedWeightKg: null,
    });
  }

  for (const item of projectedPoints) {
    const date = toDate(item.date);
    const key = date.toISOString();
    const existing = allDates.get(key);
    allDates.set(key, {
      date: key,
      label: formatLabel(date),
      actualWeightKg: existing?.actualWeightKg ?? null,
      projectedWeightKg: item.weightKg,
    });
  }

  timeline.push(...Array.from(allDates.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

  const estimatedTargetDate =
    estimatedWeeks != null
      ? new Date(currentDate.getTime() + estimatedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  return {
    summary: {
      direction,
      weeklyChangeKg: effectiveWeeklyChangeKg,
      estimatedWeeks,
      estimatedDays,
      estimatedTargetDate,
      startWeightKg: current,
      targetWeightKg: target,
      projectedWeightPoints: projectedPoints,
    },
    timeline,
  };
}
