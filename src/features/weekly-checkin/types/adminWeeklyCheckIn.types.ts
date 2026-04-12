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
  progressPhotoFrontUrl: string | null;
  progressPhotoSideUrl: string | null;
  progressPhotoBackUrl: string | null;
  strengthUpdate: string | null;
  blockerText: string | null;
  notes: string | null;
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
