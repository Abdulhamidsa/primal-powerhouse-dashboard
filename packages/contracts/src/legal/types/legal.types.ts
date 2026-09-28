import type { z } from 'zod';
import type {
  legalDocumentSummarySchema,
  legalDocumentTypeSchema,
  legalPublicationStatusSchema,
  legalRequirementsSchema,
} from '../schemas/legal.schema';

export type LegalDocumentType = z.infer<typeof legalDocumentTypeSchema>;
export type LegalPublicationStatus = z.infer<typeof legalPublicationStatusSchema>;
export type LegalDocumentSummary = z.infer<typeof legalDocumentSummarySchema>;
export type LegalRequirements = z.infer<typeof legalRequirementsSchema>;
