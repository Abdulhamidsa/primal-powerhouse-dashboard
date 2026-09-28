import { describe, expect, it } from 'vitest';
import { deriveUserDashboardSnapshot } from './userDashboardSnapshot';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

function makeSummary(overrides: Partial<UserDashboardSummary> = {}): Omit<
  UserDashboardSummary,
  'nextAction' | 'resumeRoute' | 'todayCompletionState' | 'pendingAttention'
> {
  return {
    generatedAt: '2026-06-20T00:00:00.000Z',
    user: {
      id: 'client-1',
      name: 'Josefine Example',
      avatar: null,
      motivationalMessage: null,
      currentWeight: null,
      goalWeight: null,
    },
    unreadTotal: 0,
    streakCount: 0,
    featureVisibility: {
      dailyCheckinsEnabled: true,
      dailyWeightEnabled: true,
      weeklyCheckinsEnabled: true,
      weightChartEnabled: true,
      progressPhotosEnabled: true,
      nutritionTrackingEnabled: true,
      workoutTrackingEnabled: true,
    },
    dailyCheckIn: {
      dayDate: '2026-06-20',
      isComplete: false,
      nutritionStatus: null,
      trainingStatus: null,
    },
    weeklyCheckIn: {
      weekStartDate: '2026-06-15',
      status: 'due',
    },
    training: {
      activeAssignmentCount: 1,
      activeAssignmentId: 'workout-1',
      activePlanName: 'Upper Body',
      activeSessionId: 'session-1',
    },
    adherence: {
      dayDate: '2026-06-20',
      completion: {
        completedCount: 0,
        totalSelectedCount: 5,
        percentage: 0,
      },
      selectedTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      actualTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      targetTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    },
    ...overrides,
  };
}

describe('deriveUserDashboardSnapshot', () => {
  it('opens current training plans through training without treating their session as a legacy assignment', () => {
    const snapshot = deriveUserDashboardSnapshot(makeSummary({
      training: {
        activeAssignmentCount: 2,
        activeAssignmentId: null,
        activePlanName: 'Current strength plan',
        activeSessionId: 'current-session',
      },
    }));
    expect(snapshot.pendingAttention.items.find(item => item.kind === 'training')).toMatchObject({
      href: '/user/training',
      title: 'Continue workout',
    });
  });

  it('picks the highest priority next action and completion state', () => {
    const snapshot = deriveUserDashboardSnapshot(makeSummary());

    expect(snapshot.nextAction.kind).toBe('daily-checkin');
    expect(snapshot.resumeRoute.href).toBe('/user/check-ins');
    expect(snapshot.todayCompletionState).toMatchObject({
      completedCount: 1,
      totalCount: 5,
      isComplete: false,
    });
    expect(snapshot.pendingAttention.items.map(item => item.kind)).toEqual([
      'daily-checkin',
      'weekly-checkin',
      'meals',
      'training',
    ]);
  });

  it('marks the day complete only when every actionable item is done', () => {
    const snapshot = deriveUserDashboardSnapshot(
      makeSummary({
        unreadTotal: 0,
        dailyCheckIn: {
          dayDate: '2026-06-20',
          isComplete: true,
          nutritionStatus: null,
          trainingStatus: null,
        },
        weeklyCheckIn: {
          weekStartDate: '2026-06-15',
          status: 'completed',
        },
        adherence: {
          dayDate: '2026-06-20',
          completion: {
            completedCount: 5,
            totalSelectedCount: 5,
            percentage: 100,
          },
          selectedTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          actualTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          targetTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        },
        training: {
          activeAssignmentCount: 0,
          activeAssignmentId: null,
          activePlanName: null,
          activeSessionId: null,
        },
      }),
    );

    expect(snapshot.todayCompletionState.isComplete).toBe(true);
    expect(snapshot.todayCompletionState.completedCount).toBe(5);
    expect(snapshot.todayCompletionState.totalCount).toBe(5);
    expect(snapshot.nextAction.kind).toBe('training');
    expect(snapshot.nextAction.title).toBe('Open training');
  });
});
