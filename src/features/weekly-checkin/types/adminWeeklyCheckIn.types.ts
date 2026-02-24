export type AdminWeeklyCheckInStatus = 'completed' | 'due' | 'overdue';

export type AdminWeeklyCheckInStatusEntry = {
  status: AdminWeeklyCheckInStatus;
  lastSubmittedAt: string | null;
};

export type AdminWeeklyCheckInListItem = {
  id: string;
  weekStartDate: string;
  submittedAt: string;
  weightKg: number | null;
  waistCm: number | null;
  trainingAdherence: number;
  nutritionAdherence: number;
  energyRating: number;
};

export type AdminClientWeeklyCheckInsResponse = {
  client: {
    id: string;
    name: string;
  };
  currentWeek: {
    weekStartDate: string;
    status: AdminWeeklyCheckInStatus;
    checkInId: string | null;
  };
  latestCheckIn: {
    id: string;
    submittedAt: string;
    weekStartDate: string;
  } | null;
  checkIns: AdminWeeklyCheckInListItem[];
};

export type AdminClientWeeklyCheckInStatusesResponse = {
  statuses: Record<string, AdminWeeklyCheckInStatusEntry>;
};
