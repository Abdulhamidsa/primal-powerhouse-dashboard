import { describe, expect, it } from 'vitest';
import { buildWeeklyCheckInPayload } from './weeklyPayload';
import type { CheckInFeatureVisibility, WeeklyDraft } from '../types/checkins.types';

const visibility: CheckInFeatureVisibility = {
  dailyCheckinsEnabled: true,
  dailyWeightEnabled: true,
  weeklyCheckinsEnabled: true,
  weightChartEnabled: true,
  progressPhotosEnabled: true,
  nutritionTrackingEnabled: true,
  workoutTrackingEnabled: true,
};

const draft: WeeklyDraft = {
  weightKg: '81.4',
  strengthUpdate: 'Squats felt stronger.',
  blockerText: 'Late shifts',
  notes: 'Recovery improved.',
  progressPhotoFrontUrl: 'https://example.test/front.jpg',
  progressPhotoSideUrl: 'https://example.test/side.jpg',
  progressPhotoBackUrl: 'https://example.test/back.jpg',
};

describe('buildWeeklyCheckInPayload', () => {
  it('keeps enabled weight and progress photos', () => {
    expect(buildWeeklyCheckInPayload(draft, visibility)).toEqual({
      weightKg: 81.4,
      strengthUpdate: 'Squats felt stronger.',
      blockerText: 'Late shifts',
      notes: 'Recovery improved.',
      progressPhotoFrontUrl: 'https://example.test/front.jpg',
      progressPhotoSideUrl: 'https://example.test/side.jpg',
      progressPhotoBackUrl: 'https://example.test/back.jpg',
    });
  });

  it('removes drafted weight and photos after the coach disables them', () => {
    const result = buildWeeklyCheckInPayload(
      { ...draft, progressPhotoFrontUrl: 'a stale invalid value' },
      { ...visibility, weightChartEnabled: false, progressPhotosEnabled: false },
    );

    expect(result.weightKg).toBeNull();
    expect(result.progressPhotoFrontUrl).toBeNull();
    expect(result.progressPhotoSideUrl).toBeNull();
    expect(result.progressPhotoBackUrl).toBeNull();
    expect(result.strengthUpdate).toBe('Squats felt stronger.');
  });
});
