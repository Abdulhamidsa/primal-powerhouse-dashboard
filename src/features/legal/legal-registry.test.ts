import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LEGAL_DOCUMENTS,
  getActiveMandatoryPolicyDocuments,
  getApprovedConfiguredLegalDocument,
  validateLegalDocuments,
} from './legal-registry';

const approvedBase = {
  ...LEGAL_DOCUMENTS[0],
  version: 'privacy-v1',
  effectiveDate: '2026-09-28',
  publicationStatus: 'APPROVED' as const,
  mandatoryAcknowledgement: true,
  sections: [{ heading: 'Approved content', content: 'Confirmed repository behavior.' }],
};

describe('approval-safe legal registry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts an approved marker-free document', () => {
    expect(validateLegalDocuments([approvedBase])).toBe(true);
  });

  it.each(['LEGAL REVIEW REQUIRED', 'OPERATIONAL/LEGAL CONFIRMATION REQUIRED', 'PRODUCT DECISION REQUIRED'])(
    'rejects an approved document containing %s',
    marker => {
      expect(() => validateLegalDocuments([{ ...approvedBase, sections: [{ heading: 'Review', content: marker }] }])).toThrow(marker);
    },
  );

  it('keeps drafts with markers non-publishable and non-mandatory', () => {
    expect(validateLegalDocuments(LEGAL_DOCUMENTS)).toBe(true);
    expect(() => validateLegalDocuments([{ ...approvedBase, publicationStatus: 'DRAFT', mandatoryAcknowledgement: true }])).toThrow('Only approved');
  });

  it('fails closed for retired documents that request acknowledgement', () => {
    expect(() => validateLegalDocuments([{ ...approvedBase, publicationStatus: 'RETIRED', mandatoryAcknowledgement: true }])).toThrow('Only approved');
  });

  it('does not activate acceptance for missing, mismatched, or draft configured versions', () => {
    vi.stubEnv('PRIMAL_LEGAL_ACCEPTANCE_ENABLED', 'true');
    vi.stubEnv('PRIMAL_TERMS_VERSION', 'missing');
    vi.stubEnv('PRIMAL_PRIVACY_POLICY_VERSION', 'missing');
    expect(getActiveMandatoryPolicyDocuments()).toEqual([]);

    vi.stubEnv('PRIMAL_TERMS_VERSION', LEGAL_DOCUMENTS[1].version);
    vi.stubEnv('PRIMAL_PRIVACY_POLICY_VERSION', LEGAL_DOCUMENTS[0].version);
    expect(getApprovedConfiguredLegalDocument('TERMS')).toBeNull();
    expect(getApprovedConfiguredLegalDocument('PRIVACY_POLICY')).toBeNull();
    expect(getActiveMandatoryPolicyDocuments()).toEqual([]);

    vi.stubEnv('PRIMAL_TERMS_VERSION', 'missing');
    vi.stubEnv('PRIMAL_PRIVACY_POLICY_VERSION', 'missing');
    expect(getActiveMandatoryPolicyDocuments()).toEqual([]);
  });
});
