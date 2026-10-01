import { z } from 'zod';

export const privacyConsentSchema = z.object({
  analytics: z.boolean(),
  marketingNotifications: z.boolean(),
  optionalTracking: z.boolean(),
  messageNotifications: z.boolean(),
});

export const consentRecordCategorySchema = z.enum([
  'POLICY_ACKNOWLEDGEMENT',
  'OPTIONAL_CONSENT',
  'NOTIFICATION_PREFERENCE',
  'AGE_DECLARATION',
]);

export const consentRecordActionSchema = z.enum([
  'ACKNOWLEDGED',
  'GRANTED',
  'WITHDRAWN',
  'ENABLED',
  'DISABLED',
  'DECLARED',
  'DECLINED',
]);

export const privacyNotificationPreferenceSchema = z.object({
  coachMessagePushEnabled: z.boolean(),
});

export const policyAcknowledgementSchema = z.object({
  type: z.enum(['TERMS', 'PRIVACY_POLICY']),
  version: z.string().trim().min(1).max(100),
});

export const privacyDeleteRequestSchema = z.object({
  confirmText: z.literal('DELETE MY ACCOUNT'),
  reason: z.string().trim().max(500).optional(),
});

export const privacyExportTokenQuerySchema = z.object({
  token: z.string().min(16),
});
