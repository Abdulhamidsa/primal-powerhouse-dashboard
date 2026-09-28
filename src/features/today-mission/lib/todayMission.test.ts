import { describe, expect, it } from 'vitest';
import { buildTodayMissionSummary } from './todayMission';

describe('buildTodayMissionSummary', () => {
  it('prioritizes unread coach messages when the day is otherwise complete', () => {
    const summary = buildTodayMissionSummary({
      completedMeals: 3,
      totalMeals: 3,
      actualTotals: { calories: 2000, protein: 150, carbs: 180, fat: 65 },
      targetTotals: { calories: 2000, protein: 150, carbs: 180, fat: 65 },
      nutritionStatus: 'ON_PLAN',
      dailyCheckInComplete: true,
      unreadCount: 2,
      streakCount: 5,
    });

    expect(summary.nextActionLabel).toBe('Read coach');
    expect(summary.nextActionHref).toBe('/user/chat');
    expect(summary.badgeLabel).toBe('On track');
  });

  it('points to meals when nutrition is still incomplete', () => {
    const summary = buildTodayMissionSummary({
      completedMeals: 1,
      totalMeals: 3,
      actualTotals: { calories: 700, protein: 45, carbs: 60, fat: 22 },
      targetTotals: { calories: 2000, protein: 150, carbs: 180, fat: 65 },
      nutritionStatus: null,
      dailyCheckInComplete: false,
      unreadCount: 0,
      streakCount: 1,
    });

    expect(summary.nextActionHref).toBe('/user/my-plan');
    expect(summary.mealProgress.percentage).toBe(33);
    expect(summary.signals[0].value).toContain('1/3');
  });
});
