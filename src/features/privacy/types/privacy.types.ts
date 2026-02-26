import type { z } from 'zod';
import type { privacyConsentSchema, privacyDeleteRequestSchema } from '@/features/privacy/schemas/privacy.schema';

export type PrivacyConsentValues = z.infer<typeof privacyConsentSchema>;
export type PrivacyDeleteValues = z.infer<typeof privacyDeleteRequestSchema>;

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
