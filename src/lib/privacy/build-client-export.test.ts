import { describe, expect, it, vi } from 'vitest';

const client = {
  id: 'client-a', name: 'Client', email: 'client@example.test', username: 'client', accessMode: 'COACHING', serviceTier: 'COACHING', signupSource: 'SELF_SIGNUP',
  emailVerifiedAt: new Date(), onboardingCompletedAt: null, phone: '+4500000000', phoneEncrypted: 'encrypted-phone', avatar: null, progressPhotos: null,
  themePreference: 'ember', currentWeight: 80, targetWeight: 75, height: 180, age: 30, gender: 'MALE', activityLevel: 'MODERATE',
  dietaryRestrictions: null, dietaryRestrictionsEncrypted: null, goals: 'strength', goalsEncrypted: null, notes: 'notes', notesEncrypted: null,
  motivationalMessage: 'keep going', motivationalMessageEncrypted: null, goalCalories: 2400, goalMacros: '{"protein":180}', joinDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
  privacyUpdatedAt: null, deactivatedAt: null, anonymizedAt: null, deletionScheduledFor: null, consentAnalytics: false, consentMarketingNotifications: false,
  consentOptionalTracking: false, consentMessageNotifications: false, dailyCheckinsEnabled: true, weeklyCheckinsEnabled: true, dailyWeightEnabled: true,
  weightChartEnabled: true, progressPhotosEnabled: true, nutritionTrackingEnabled: true, workoutTrackingEnabled: true, featureVisibility: null,
};

const database = vi.hoisted(() => new Proxy({}, {
  get: (_target, model) => {
    if (model === 'client') return { findUnique: vi.fn().mockResolvedValue(client) };
    if (model === 'userMealSelectionSet') return { findUnique: vi.fn().mockResolvedValue(null) };
    return { findMany: vi.fn().mockResolvedValue([]) };
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));

import { buildClientExport } from './build-client-export';

describe('client export projection', () => {
  it('excludes credentials, encrypted shadows, tokens, and cleanup internals', async () => {
    const result = await buildClientExport('client-a');
    const serialized = JSON.stringify(result);
    expect(result).toBeTruthy();
    expect(result?.account).toMatchObject({ id: 'client-a', email: 'client@example.test' });
    expect(serialized).not.toContain('phoneEncrypted');
    expect(serialized).not.toContain('goalsEncrypted');
    expect(serialized).not.toContain('notesEncrypted');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('downloadTokenHash');
    expect(serialized).not.toContain('storageKey');
    expect(serialized).not.toContain('cleanup');
  });
});
