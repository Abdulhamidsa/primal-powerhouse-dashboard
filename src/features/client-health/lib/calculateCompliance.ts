import type {
  ComplianceRiskStatus,
  ComplianceTrend,
  DailyNutritionEntry,
  DailyTrainingEntry,
  WeeklyComplianceBreakdown,
} from '@/features/client-health/types/clientHealth.types';

export type ComplianceInput = {
  weekStartDate: string;
  assignedVideos: number;
  completedVideos: number;
  hasCheckIn: boolean;
  checkInSubmittedAt: string | null;
  weeklyCheckInTrainingAdherence: number | null;
  weeklyCheckInNutritionAdherence: number | null;
  dailyTrainingEntries: DailyTrainingEntry[];
  dailyNutritionEntries: DailyNutritionEntry[];
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateTrainingCompliance(input: ComplianceInput): number | null {
  if (input.dailyTrainingEntries.length > 0) {
    const average =
      input.dailyTrainingEntries.reduce((sum, entry) => sum + entry.percentage, 0) / input.dailyTrainingEntries.length;
    return round(average);
  }

  if (input.assignedVideos <= 0) {
    return input.weeklyCheckInTrainingAdherence ?? null;
  }

  return round((input.completedVideos / input.assignedVideos) * 100);
}

function getTrainingSource(input: ComplianceInput): 'daily_logs' | 'video_assignments' | 'weekly_checkin' | 'none' {
  if (input.dailyTrainingEntries.length > 0) return 'daily_logs';
  if (input.assignedVideos > 0) return 'video_assignments';
  if (typeof input.weeklyCheckInTrainingAdherence === 'number') return 'weekly_checkin';
  return 'none';
}

function calculateNutritionCompliance(input: ComplianceInput): {
  value: number | null;
  source: 'daily_logs' | 'weekly_checkin' | 'none';
} {
  if (input.dailyNutritionEntries.length > 0) {
    const average =
      input.dailyNutritionEntries.reduce((sum, entry) => sum + entry.percentage, 0) /
      input.dailyNutritionEntries.length;
    return { value: round(average), source: 'daily_logs' };
  }

  if (typeof input.weeklyCheckInNutritionAdherence === 'number') {
    return { value: input.weeklyCheckInNutritionAdherence, source: 'weekly_checkin' };
  }

  return { value: null, source: 'none' };
}

function calculateCheckInCompliance(hasCheckIn: boolean): number {
  return hasCheckIn ? 100 : 0;
}

function calculateOverall(
  trainingCompliance: number | null,
  nutritionCompliance: number | null,
  checkInCompliance: number | null
): number | null {
  if (trainingCompliance == null && nutritionCompliance == null && checkInCompliance == null) {
    return null;
  }

  const training = trainingCompliance ?? 0;
  const nutrition = nutritionCompliance ?? 0;
  const checkIn = checkInCompliance ?? 0;

  return round(training * 0.4 + nutrition * 0.4 + checkIn * 0.2);
}

function classifyRisk(overallCompliance: number | null): ComplianceRiskStatus {
  if (overallCompliance == null) return 'no_data';
  if (overallCompliance >= 80) return 'on_track';
  if (overallCompliance >= 60) return 'needs_attention';
  return 'at_risk';
}

function getTrend(
  current: number | null,
  previous: number | null
): { trend: ComplianceTrend; trendDelta: number | null } {
  if (current == null || previous == null) {
    return { trend: 'no_data', trendDelta: null };
  }

  const delta = round(current - previous);
  if (Math.abs(delta) < 1) {
    return { trend: 'neutral', trendDelta: 0 };
  }

  return {
    trend: delta > 0 ? 'up' : 'down',
    trendDelta: delta,
  };
}

export function calculateWeeklyCompliance(
  input: ComplianceInput,
  previousOverallCompliance: number | null
): WeeklyComplianceBreakdown {
  const trainingCompliance = calculateTrainingCompliance(input);
  const nutrition = calculateNutritionCompliance(input);
  const checkInCompliance = calculateCheckInCompliance(input.hasCheckIn);
  const overallCompliance = calculateOverall(trainingCompliance, nutrition.value, checkInCompliance);
  const riskStatus = classifyRisk(overallCompliance);
  const trend = getTrend(overallCompliance, previousOverallCompliance);

  return {
    weekStartDate: input.weekStartDate,
    trainingCompliance,
    nutritionCompliance: nutrition.value,
    checkInCompliance,
    overallCompliance,
    riskStatus,
    trend: trend.trend,
    trendDelta: trend.trendDelta,
    lastCheckInDate: input.checkInSubmittedAt,
    completedVideos: input.completedVideos,
    assignedVideos: input.assignedVideos,
    dataSources: {
      training: getTrainingSource(input),
      nutrition: nutrition.source,
      checkIn: input.hasCheckIn ? 'weekly_checkin' : 'none',
    },
  };
}
