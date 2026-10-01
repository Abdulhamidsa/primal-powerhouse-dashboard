import { z } from 'zod';

export const legalDocumentTypeSchema = z.enum([
  'TERMS',
  'PRIVACY_POLICY',
  'HEALTH_DISCLAIMER',
  'STORAGE',
]);

export const legalPublicationStatusSchema = z.enum(['DRAFT', 'APPROVED', 'RETIRED']);

export const legalDocumentSummarySchema = z.object({
  type: legalDocumentTypeSchema,
  slug: z.string(),
  title: z.string(),
  version: z.string(),
  effectiveDate: z.string().nullable(),
  publicationStatus: legalPublicationStatusSchema,
  mandatoryAcknowledgement: z.boolean(),
});

export const legalRequirementsSchema = z.object({
  signupAcceptanceRequired: z.boolean(),
  documents: z.array(legalDocumentSummarySchema),
});
