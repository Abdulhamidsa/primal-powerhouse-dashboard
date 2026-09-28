import type { z } from 'zod';
import type {
  consentRecordActionSchema,
  consentRecordCategorySchema,
  privacyConsentSchema,
  privacyDeleteRequestSchema,
  privacyNotificationPreferenceSchema,
  policyAcknowledgementSchema,
} from '../schemas/privacy.schema';

export type PrivacyConsentValues = z.infer<typeof privacyConsentSchema>;
export type PrivacyDeleteValues = z.infer<typeof privacyDeleteRequestSchema>;
export type ConsentRecordCategory = z.infer<typeof consentRecordCategorySchema>;
export type ConsentRecordAction = z.infer<typeof consentRecordActionSchema>;
export type PrivacyNotificationPreference = z.infer<typeof privacyNotificationPreferenceSchema>;
export type PolicyAcknowledgementValues = z.infer<typeof policyAcknowledgementSchema>;

export type PrivacyConsentRecord = {
  id: string;
  category: ConsentRecordCategory;
  type: string;
  action: ConsentRecordAction;
  version: string | null;
  source: string | null;
  platform: string | null;
  occurredAt: string;
};

export type PrivacyConsentHistory = {
  policyAcknowledgements: PrivacyConsentRecord[];
  optionalConsents: PrivacyConsentRecord[];
  notificationPreferences: PrivacyConsentRecord[];
  ageDeclarations: PrivacyConsentRecord[];
};

export type PrivacyExportJobItem = {
  id: string;
  status: 'PENDING' | 'READY' | 'FAILED' | 'EXPIRED';
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string;
  downloadedAt: string | null;
  downloadCount: number;
};

export type DeletionRequestItem = {
  id: string;
  status: 'REQUESTED' | 'ANONYMIZED' | 'FINALIZED' | 'CANCELLED';
  requestedAt: string;
  scheduledHardDeleteAt: string;
  gracePeriodDays: number;
};

export type PrivacyCenterResponse = {
  consents: PrivacyConsentValues;
  notificationPreferences: PrivacyNotificationPreference;
  consentHistory: PrivacyConsentHistory;
  exportJobs: PrivacyExportJobItem[];
  activeDeletionRequest: DeletionRequestItem | null;
  activeSession: {
    current: true;
    issuedAt: string | null;
    expiresAt: string | null;
  };
};

export type PrivacyExportCreateResponse = {
  jobId: string;
  status: 'PENDING' | 'READY' | 'FAILED' | 'EXPIRED';
  expiresAt: string;
  downloadUrl: string;
};

export type PrivacyDeleteResponse = {
  success: true;
  request: DeletionRequestItem;
};
