import { describe, expect, it } from 'vitest';
import { getDashboardPrimaryAction } from './dashboardPrimaryAction';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

function makeSummary(overrides: Record<string, unknown> = {}): UserDashboardSummary {
  return {
    featureVisibility: {
      dailyCheckinsEnabled: true,
      dailyWeightEnabled: false,
      weeklyCheckinsEnabled: false,
      weightChartEnabled: false,
      progressPhotosEnabled: false,
      nutritionTrackingEnabled: true,
      workoutTrackingEnabled: true,
    },
    dailyCheckIn: {
      dayDate: '2026-09-28',
      isComplete: true,
      nutritionStatus: null,
      trainingStatus: 'DONE',
    },
    training: {
      activeAssignmentCount: 1,
      activeAssignmentId: 'assignment-1',
      activePlanName: 'Strength A',
      activeSessionId: null,
    },
    ...overrides,
  } as unknown as UserDashboardSummary;
}

const completeAction = { href: '/user/check-ins', label: 'Review today' };
const fallbackAction = { href: '/user/training', label: 'Open training plan' };

describe('getDashboardPrimaryAction', () => {
  it('prioritizes an active workout with a resumable assignment', () => {
    const action = getDashboardPrimaryAction({
      summary: makeSummary({ training: { activeSessionId: 'session-1', activeAssignmentId: 'assignment-1' } }),
      mealProgress: { mealProgress: { completed: 0, total: 5, percentage: 0 } },
      checkInEnabled: true,
      completeAction,
      fallbackAction,
    });

    expect(action).toEqual({ href: '/user/workout/assignment-1', label: 'Resume workout' });
  });

  it('falls back to training when an active workout has no assignment', () => {
    const action = getDashboardPrimaryAction({
      summary: makeSummary({ training: { activeSessionId: 'session-1', activeAssignmentId: null } }),
      mealProgress: { mealProgress: { completed: 0, total: 5, percentage: 0 } },
      checkInEnabled: true,
      completeAction,
      fallbackAction,
    });

    expect(action).toEqual({ href: '/user/training', label: 'Continue workout' });
  });

  it('prioritizes a due daily check-in before incomplete meals', () => {
    const action = getDashboardPrimaryAction({
      summary: makeSummary({ dailyCheckIn: { isComplete: false, trainingStatus: null } }),
      mealProgress: { mealProgress: { completed: 1, total: 5, percentage: 20 } },
      checkInEnabled: true,
      completeAction,
      fallbackAction,
    });

    expect(action).toEqual({ href: '/user/check-ins', label: 'Complete check-in' });
  });

  it('selects incomplete meals after the check-in is complete', () => {
    const action = getDashboardPrimaryAction({
      summary: makeSummary(),
      mealProgress: { mealProgress: { completed: 1, total: 5, percentage: 20 } },
      checkInEnabled: true,
      completeAction,
      fallbackAction,
    });

    expect(action).toEqual({ href: '/user/my-plan', label: 'Continue meal plan' });
  });

  it('uses Review today when the enabled main tasks are complete', () => {
    const action = getDashboardPrimaryAction({
      summary: makeSummary(),
      mealProgress: { mealProgress: { completed: 5, total: 5, percentage: 100 } },
      checkInEnabled: true,
      completeAction,
      fallbackAction,
    });

    expect(action).toEqual(completeAction);
  });

  it('keeps self-service-style fallback behavior when check-ins are disabled', () => {
    const action = getDashboardPrimaryAction({
      summary: makeSummary({
        featureVisibility: {
          dailyCheckinsEnabled: false,
          nutritionTrackingEnabled: true,
          workoutTrackingEnabled: true,
        },
      }),
      mealProgress: { mealProgress: { completed: 0, total: 0, percentage: 0 } },
      checkInEnabled: false,
      fallbackAction: { href: '/user/my-plan', label: 'Open your program' },
    });

    expect(action).toEqual({ href: '/user/my-plan', label: 'Open your program' });
  });
});
