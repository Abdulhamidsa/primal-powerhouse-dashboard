import type {
  DailyCheckInCompliance,
  DailyCheckInEnergy,
  DailyCheckInRecord,
  DailyCheckInWeightTrendDirection,
} from '@/features/daily-checkin/types/dailyCheckIn.types';

type CompletionInput = {
  weightKg?: number | null;
  compliance?: DailyCheckInCompliance | null;
  energy?: DailyCheckInEnergy | null;
};

export const DAILY_CHECK_IN_REQUIRED_FIELDS = 3;

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getCompletionCount(input: CompletionInput): number {
  let count = 0;
  if (typeof input.weightKg === 'number' && Number.isFinite(input.weightKg)) count += 1;
  if (input.compliance != null) count += 1;
  if (input.energy != null) count += 1;
  return count;
}

export function calculateCompletionPercentage(input: CompletionInput): number {
  return Math.round((getCompletionCount(input) / DAILY_CHECK_IN_REQUIRED_FIELDS) * 100);
}

export function isDailyCheckInComplete(input: CompletionInput): boolean {
  return getCompletionCount(input) === DAILY_CHECK_IN_REQUIRED_FIELDS;
}

export function getComplianceScore(compliance: DailyCheckInCompliance | null | undefined): number {
  if (compliance === 'ON_PLAN') return 100;
  if (compliance === 'PARTIAL') return 60;
  return 0;
}

export function averageWeight(values: Array<number | null | undefined>): number | null {
  const knownValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (knownValues.length === 0) {
    return null;
  }

  return roundToOneDecimal(knownValues.reduce((sum, value) => sum + value, 0) / knownValues.length);
}

export function getWeightTrendDirection(
  currentAverage: number | null,
  previousAverage: number | null
): DailyCheckInWeightTrendDirection {
  if (currentAverage == null || previousAverage == null) {
    return 'stable';
  }

  const delta = roundToOneDecimal(currentAverage - previousAverage);
  if (Math.abs(delta) < 0.2) {
    return 'stable';
  }

  return delta < 0 ? 'down' : 'up';
}

export function buildSupportiveInsight(
  currentAverage: number | null,
  previousAverage: number | null,
  direction: DailyCheckInWeightTrendDirection
): string {
  if (currentAverage == null && previousAverage == null) {
    return 'Log your weight a few times this week to unlock a clearer trend.';
  }

  if (previousAverage == null) {
    return 'You are building your baseline this week. A few more check-ins will make the trend clearer.';
  }

  if (direction === 'down') {
    return 'Your average weight is decreasing this week.';
  }

  if (direction === 'up') {
    const delta = roundToOneDecimal((currentAverage ?? 0) - (previousAverage ?? 0));
    if (Math.abs(delta) < 0.6) {
      return 'Your average weight is slightly up this week. This may be normal due to water retention.';
    }

    return 'Your average weight is up this week. This can happen from water, sodium, or digestion changes.';
  }

  return 'Your weight is stable this week.';
}

export function calculateStreak(recordsByDateKey: Map<string, CompletionInput>, recentDateKeys: string[]): number {
  let streakCount = 0;

  for (const dateKey of recentDateKeys) {
    const entry = recordsByDateKey.get(dateKey);
    if (!entry || !isDailyCheckInComplete(entry)) {
      break;
    }

    streakCount += 1;
  }

  return streakCount;
}

export function serializeDailyCheckIn(record: {
  id: string;
  dayDate: Date;
  weightKg: number | null;
  compliance: DailyCheckInCompliance | null;
  energy: DailyCheckInEnergy | null;
  submittedAt: Date;
}): DailyCheckInRecord {
  const completionPercentage = calculateCompletionPercentage(record);

  return {
    id: record.id,
    dayDate: record.dayDate.toISOString().slice(0, 10),
    weightKg: record.weightKg,
    compliance: record.compliance,
    energy: record.energy,
    submittedAt: record.submittedAt.toISOString(),
    completionPercentage,
    isComplete: completionPercentage === 100,
  };
}
