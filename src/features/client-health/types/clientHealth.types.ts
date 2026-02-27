export type ComplianceRiskStatus = 'on_track' | 'needs_attention' | 'at_risk' | 'no_data';

export type ComplianceTrend = 'up' | 'down' | 'neutral' | 'no_data';

export type DailyNutritionStatus = 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN';

export type DailyNutritionEntry = {
  dateKey: string;
  status: DailyNutritionStatus;
  percentage: number;
};

export type DailyTrainingStatus = 'DONE' | 'PARTIAL' | 'MISSED';

export type DailyTrainingEntry = {
  dateKey: string;
  status: DailyTrainingStatus;
  percentage: number;
};

export type WeeklyComplianceBreakdown = {
  weekStartDate: string;
  trainingCompliance: number | null;
  nutritionCompliance: number | null;
  checkInCompliance: number | null;
  overallCompliance: number | null;
  riskStatus: ComplianceRiskStatus;
  trend: ComplianceTrend;
  trendDelta: number | null;
  lastCheckInDate: string | null;
  completedVideos: number;
  assignedVideos: number;
  dataSources: {
    training: 'daily_logs' | 'video_assignments' | 'weekly_checkin' | 'none';
    nutrition: 'daily_logs' | 'weekly_checkin' | 'none';
    checkIn: 'weekly_checkin' | 'none';
  };
};

export type DailyComplianceBreakdown = {
  dateKey: string;
  trainingCompliance: number;
  nutritionCompliance: number;
  overallCompliance: number;
  riskStatus: ComplianceRiskStatus;
  trend: ComplianceTrend;
  trendDelta: number | null;
  lastCheckInDate: string | null;
};

export type ClientHealthSummary = {
  totalActiveClients: number;
  clientsAtRisk: number;
  clientsStable: number;
  clientsOnTrack: number;
  averageCompliance: number | null;
};

export type ClientHealthResponse = {
  client: {
    id: string;
    name: string;
    status: string;
  };
  summary: ClientHealthSummary;
  currentWeek: WeeklyComplianceBreakdown;
  history: WeeklyComplianceBreakdown[];
  dailyHistory: DailyComplianceBreakdown[];
};
