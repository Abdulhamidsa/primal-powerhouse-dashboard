export const SELF_SIGNUP_SOURCES = ['SELF_SIGNUP', 'USERNAME_SIGNUP'] as const;

export type WelcomeOnboardingClient = {
  accessMode: string | null;
  signupSource: string | null;
  onboardingCompletedAt: Date | string | null;
};

export function isSelfSignupSource(signupSource: string | null | undefined): boolean {
  return SELF_SIGNUP_SOURCES.includes(signupSource as (typeof SELF_SIGNUP_SOURCES)[number]);
}

export function shouldShowWelcomeOnboarding(client: WelcomeOnboardingClient): boolean {
  return client.accessMode === 'SELF_SERVICE' && isSelfSignupSource(client.signupSource) && !client.onboardingCompletedAt;
}
