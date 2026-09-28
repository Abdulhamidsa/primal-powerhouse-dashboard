import type { z } from 'zod';
import type {
  consentRecordActionSchema,
  consentRecordCategorySchema,
  privacyConsentSchema,
  privacyDeleteRequestSchema,
  privacyNotificationPreferenceSchema,
  policyAcknowledgementSchema,
} from '../schemas/privacy.schema';
import type { LegalDocumentSummary } from '../../legal/types/legal.types';

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
  legalDocuments: LegalDocumentSummary[];
  pendingPolicyAcknowledgements: LegalDocumentSummary[];
  disclosures: PrivacyDisclosureSummary;
  exportJobs: PrivacyExportJobItem[];
  activeDeletionRequest: DeletionRequestItem | null;
  activeSession: {
    current: true;
    issuedAt: string | null;
    expiresAt: string | null;
  };
};

export type PrivacyDisclosureProvider = {
  name: string;
  purpose: string;
  dataCategories: string[];
  status: 'ACTIVE_CONFIGURED' | 'CODE_ACTIVE_CONFIG_UNKNOWN' | 'LEGACY_OR_INACTIVE';
};

export type PrivacyDisclosureSummary = {
  providers: PrivacyDisclosureProvider[];
  retention: {
    localPostgresBackups: string;
    offServerDisasterRecovery: string;
    providerRetention: string;
  };
  reviewNotice: string;
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
