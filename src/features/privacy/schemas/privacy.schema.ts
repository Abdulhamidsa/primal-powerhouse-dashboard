import { z } from 'zod';

export const privacyConsentSchema = z.object({
  analytics: z.boolean(),
  marketingNotifications: z.boolean(),
  optionalTracking: z.boolean(),
});

export const privacyDeleteRequestSchema = z.object({
  confirmText: z.literal('DELETE MY ACCOUNT'),
  reason: z.string().trim().max(500).optional(),
});

export const privacyExportTokenQuerySchema = z.object({
  token: z.string().min(16),
});
