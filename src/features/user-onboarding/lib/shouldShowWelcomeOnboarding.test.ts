import { describe, expect, it } from 'vitest';
import { shouldShowWelcomeOnboarding } from './shouldShowWelcomeOnboarding';

describe('shouldShowWelcomeOnboarding', () => {
  it.each(['SELF_SIGNUP', 'USERNAME_SIGNUP'])('shows onboarding for a new %s self-signup', signupSource => {
    expect(shouldShowWelcomeOnboarding({ accessMode: 'SELF_SERVICE', signupSource, onboardingCompletedAt: null })).toBe(true);
  });

  it('does not show onboarding after completion', () => {
    expect(shouldShowWelcomeOnboarding({ accessMode: 'SELF_SERVICE', signupSource: 'SELF_SIGNUP', onboardingCompletedAt: new Date() })).toBe(false);
  });

  it('does not show onboarding for coach-created clients', () => {
    expect(shouldShowWelcomeOnboarding({ accessMode: 'SELF_SERVICE', signupSource: 'ADMIN_CREATED', onboardingCompletedAt: null })).toBe(false);
  });

  it('does not show onboarding for coaching clients', () => {
    expect(shouldShowWelcomeOnboarding({ accessMode: 'COACHING', signupSource: 'SELF_SIGNUP', onboardingCompletedAt: null })).toBe(false);
  });
});
