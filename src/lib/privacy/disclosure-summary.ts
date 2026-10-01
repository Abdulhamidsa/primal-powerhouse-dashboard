import type { PrivacyDisclosureSummary } from '@primal/contracts/privacy/types/privacy.types';

/**
 * Repository-backed facts only. Provider regions, DPAs, transfers, subprocessors,
 * vendor retention, and contractual status are intentionally not represented as
 * confirmed values here.
 */
export const PRIVACY_DISCLOSURE_SUMMARY: PrivacyDisclosureSummary = {
  providers: [
    {
      name: 'PostgreSQL',
      purpose: 'Application database for account, health, coaching, nutrition, training, message, privacy, and session data.',
      dataCategories: ['account/profile', 'health and fitness', 'messages', 'privacy and session data'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'Cloudinary',
      purpose: 'Media storage and delivery for application-owned images, videos, and attachments.',
      dataCategories: ['avatars', 'check-in photos', 'attachments', 'meal and exercise media'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'Web Push/VAPID',
      purpose: 'Browser notification delivery.',
      dataCategories: ['browser push subscriptions', 'notification payloads'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'Google OAuth',
      purpose: 'Optional account authentication and identity verification.',
      dataCategories: ['OAuth identity subject', 'email address', 'display name'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'Resend',
      purpose: 'Transactional verification and password-reset email delivery.',
      dataCategories: ['email address', 'display name', 'transactional links'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'Azure OpenAI',
      purpose: 'Active chat processing for meal, ingredient, and side generation. Image-generation code is present but disabled in production pending a verified image deployment.',
      dataCategories: ['meal and ingredient context', 'nutrition targets', 'generation prompts'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'ExerciseDB/RapidAPI',
      purpose: 'Exercise search and import features.',
      dataCategories: ['exercise search and filter terms', 'exercise content'],
      status: 'ACTIVE_CONFIGURED',
    },
    {
      name: 'Pusher',
      purpose: 'Repository-present optional realtime messaging and notification integration. Web production is currently unconfigured and inactive; database persistence and polling/revalidation continue without it. Mobile Pusher configuration remains unverified.',
      dataCategories: ['channel identifiers', 'message events', 'notification payloads'],
      status: 'CODE_ACTIVE_CONFIG_UNKNOWN',
    },
    {
      name: 'USDA FoodData Central',
      purpose: 'Food and nutrition search proxy.',
      dataCategories: ['food search terms', 'food filters', 'food identifiers'],
      status: 'CODE_ACTIVE_CONFIG_UNKNOWN',
    },
    {
      name: 'Expo Push',
      purpose: 'Mobile push delivery and receipt collection.',
      dataCategories: ['mobile device tokens', 'notification payloads', 'delivery receipts'],
      status: 'CODE_ACTIVE_CONFIG_UNKNOWN',
    },
    {
      name: 'Open Food Facts',
      purpose: 'Legacy service naming retained in application abstractions; no direct active provider call was identified.',
      dataCategories: ['food data abstraction'],
      status: 'LEGACY_OR_INACTIVE',
    },
  ],
  retention: {
    localPostgresBackups: '14 daily local PostgreSQL custom-format backups are configured; restore verification has passed.',
    offServerDisasterRecovery: 'No off-server disaster-recovery provider has been selected or verified.',
    providerRetention: 'Provider retention, deletion, backup, region, transfer, and contractual terms require external confirmation.',
  },
  reviewNotice: 'This summary reflects repository and verified runtime evidence only. It is not a legal approval or a confirmation of provider contractual terms.',
};
