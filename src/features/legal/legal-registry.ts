export const LEGAL_REVIEW_MARKERS = [
  'LEGAL REVIEW REQUIRED',
  'OPERATIONAL/LEGAL CONFIRMATION REQUIRED',
  'PRODUCT DECISION REQUIRED',
] as const;

export type LegalDocumentType =
  | 'TERMS'
  | 'PRIVACY_POLICY'
  | 'HEALTH_DISCLAIMER'
  | 'AI_DISCLOSURE'
  | 'STORAGE';

export type LegalPublicationStatus = 'DRAFT' | 'APPROVED' | 'RETIRED';

export type LegalDocumentSection = {
  heading: string;
  content: string;
};

export type LegalDocument = {
  type: LegalDocumentType;
  slug: string;
  title: string;
  version: string;
  effectiveDate: string | null;
  publicationStatus: LegalPublicationStatus;
  mandatoryAcknowledgement: boolean;
  sections: LegalDocumentSection[];
};

const draftVersion = 'draft-2026-09-28';

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    type: 'PRIVACY_POLICY',
    slug: 'privacy',
    title: 'Privacy Policy',
    version: draftVersion,
    effectiveDate: null,
    publicationStatus: 'DRAFT',
    mandatoryAcknowledgement: false,
    sections: [
      { heading: 'Status', content: 'Draft document — not approved. LEGAL REVIEW REQUIRED before publication or mandatory acknowledgement.' },
      { heading: 'Information we handle', content: 'The application handles account and authentication data, fitness and health-related profile data, coaching communications, check-ins, training and nutrition records, uploaded media, notification data, and technical/offline data as described in the Phase 3 data inventory.' },
      { heading: 'How information is used', content: 'Information is used to authenticate users, provide coaching and self-service features, calculate fitness and nutrition results, deliver messages and notifications, operate exports and deletion, and secure the service.' },
      { heading: 'External services', content: 'Repository integrations include PostgreSQL, Cloudinary, Web Push/VAPID, Google OAuth, Resend, Azure OpenAI, ExerciseDB/RapidAPI, Pusher, USDA FoodData Central, and application code for Expo Push. Production configuration, provider regions, transfers, contracts, subprocessors, backups, and retention require OPERATIONAL/LEGAL CONFIRMATION REQUIRED.' },
      { heading: 'Retention, export, and deletion', content: 'The application preserves its existing retention behavior, including the 30-day deletion window, export expiry, audit retention, and vendor-controlled backup limitations. Any additional retention language requires LEGAL REVIEW REQUIRED.' },
      { heading: 'Rights and contact', content: 'Operator identity, contact details, legal bases, rights procedure, complaint route, international-transfer language, and governing requirements require LEGAL REVIEW REQUIRED.' },
    ],
  },
  {
    type: 'TERMS',
    slug: 'terms',
    title: 'Terms of Service',
    version: draftVersion,
    effectiveDate: null,
    publicationStatus: 'DRAFT',
    mandatoryAcknowledgement: false,
    sections: [
      { heading: 'Status', content: 'Draft document — not approved. LEGAL REVIEW REQUIRED before publication or mandatory acknowledgement.' },
      { heading: 'Accounts and permitted use', content: 'Users are responsible for account security and lawful use of the self-service and coaching functionality made available to them.' },
      { heading: 'Coaching and fitness features', content: 'The application provides fitness, nutrition, coaching, calculation, and AI-assisted functionality. It does not replace professional medical care. Final disclaimer and liability wording require LEGAL REVIEW REQUIRED.' },
      { heading: 'User content and media', content: 'Users may submit messages, check-ins, photos, attachments, and other content for application functionality. Ownership, licences, moderation, and intellectual-property language require LEGAL REVIEW REQUIRED.' },
      { heading: 'Availability and deletion', content: 'The service may change or become unavailable. Account deletion removes access immediately and is not cancellable; hard deletion follows the existing application process.' },
      { heading: 'Unresolved terms', content: 'Payment, subscriptions, refunds, governing law, jurisdiction, limitation of liability, warranties, and formal complaints wording require LEGAL REVIEW REQUIRED.' },
    ],
  },
  {
    type: 'HEALTH_DISCLAIMER',
    slug: 'health-disclaimer',
    title: 'Health and Fitness Disclaimer',
    version: draftVersion,
    effectiveDate: null,
    publicationStatus: 'DRAFT',
    mandatoryAcknowledgement: false,
    sections: [
      { heading: 'Status', content: 'Draft document — not approved. LEGAL REVIEW REQUIRED.' },
      { heading: 'Scope', content: 'Fitness guidance, nutrition guidance, automated calculations, coaching content, AI-generated meal content, and user-entered health information are provided for the application’s supported use cases.' },
      { heading: 'Professional care', content: 'The application should not be represented as diagnosis, treatment, emergency support, or a replacement for qualified medical advice. Final wording requires LEGAL REVIEW REQUIRED.' },
    ],
  },
  {
    type: 'AI_DISCLOSURE',
    slug: 'ai-disclosure',
    title: 'AI-Assisted Features Disclosure',
    version: draftVersion,
    effectiveDate: null,
    publicationStatus: 'DRAFT',
    mandatoryAcknowledgement: false,
    sections: [
      { heading: 'Status', content: 'Draft document — not approved. LEGAL REVIEW REQUIRED.' },
      { heading: 'Where AI is used', content: 'AI-assisted functionality is used for meal and ingredient generation. Related image-generation code is present but disabled in production unless a real image deployment is explicitly configured and verified. Some calculations and matching paths are local application logic rather than external AI.' },
      { heading: 'Data minimization', content: 'The primary meal-generation path applies a server-side minimization boundary for meal, ingredient, nutrition, and relevant preference context. Direct account identifiers are excluded from that boundary; route-specific prompts and provider handling remain subject to OPERATIONAL/LEGAL CONFIRMATION REQUIRED.' },
      { heading: 'Output and storage', content: 'AI output may require user or coach judgment and may be stored when a supported workflow saves it. Provider retention, training use, region, and contractual protections require OPERATIONAL/LEGAL CONFIRMATION REQUIRED.' },
    ],
  },
  {
    type: 'STORAGE',
    slug: 'storage',
    title: 'Cookies and Storage Notice',
    version: draftVersion,
    effectiveDate: null,
    publicationStatus: 'DRAFT',
    mandatoryAcknowledgement: false,
    sections: [
      { heading: 'Status', content: 'Draft document — not approved. LEGAL REVIEW REQUIRED.' },
      { heading: 'Necessary and functional storage', content: 'The application uses authentication and OAuth state cookies, theme and functional preferences, offline metadata, service-worker caches, mobile SecureStore sessions, AsyncStorage caches/drafts, and push-registration state.' },
      { heading: 'Optional tracking', content: 'No active analytics, marketing, or optional-tracking implementation was identified in the Phase 3 audit. The application therefore does not present a non-essential tracking consent banner.' },
      { heading: 'Future changes', content: 'Any future optional tracking or marketing technology requires a new product and legal review before activation.' },
    ],
  },
];

const policyEnvironmentKeys: Record<'TERMS' | 'PRIVACY_POLICY' | 'AI_DISCLOSURE', string> = {
  TERMS: 'PRIMAL_TERMS_VERSION',
  PRIVACY_POLICY: 'PRIMAL_PRIVACY_POLICY_VERSION',
  AI_DISCLOSURE: 'PRIMAL_AI_DISCLOSURE_VERSION',
};

function documentText(document: LegalDocument) {
  return document.sections.map(section => `${section.heading}\n${section.content}`).join('\n');
}

export function unresolvedMarkers(document: LegalDocument) {
  const text = documentText(document);
  return LEGAL_REVIEW_MARKERS.filter(marker => text.includes(marker));
}

export function validateLegalDocuments(documents: readonly LegalDocument[] = LEGAL_DOCUMENTS) {
  const seen = new Set<string>();

  for (const document of documents) {
    const key = `${document.type}:${document.version}`;
    if (seen.has(key)) throw new Error(`Duplicate legal document version: ${key}`);
    seen.add(key);

    const markers = unresolvedMarkers(document);
    if (document.publicationStatus === 'APPROVED' && markers.length > 0) {
      throw new Error(`Approved legal document ${key} contains unresolved markers: ${markers.join(', ')}`);
    }
    if (document.publicationStatus !== 'APPROVED' && document.mandatoryAcknowledgement) {
      throw new Error(`Only approved legal documents may require acknowledgement: ${key}`);
    }
    if (document.publicationStatus === 'APPROVED' && !document.effectiveDate) {
      throw new Error(`Approved legal document is missing an effective date: ${key}`);
    }
  }

  return true;
}

export function getLegalDocumentBySlug(slug: string) {
  return LEGAL_DOCUMENTS.find(document => document.slug === slug) ?? null;
}

export function getLegalDocument(type: LegalDocumentType, version: string) {
  return LEGAL_DOCUMENTS.find(document => document.type === type && document.version === version) ?? null;
}

export function getConfiguredLegalDocument(type: 'TERMS' | 'PRIVACY_POLICY' | 'AI_DISCLOSURE') {
  const version = process.env[policyEnvironmentKeys[type]]?.trim();
  if (!version) return null;
  return getLegalDocument(type, version);
}

export function getApprovedConfiguredLegalDocument(type: 'TERMS' | 'PRIVACY_POLICY' | 'AI_DISCLOSURE') {
  const document = getConfiguredLegalDocument(type);
  if (!document || document.publicationStatus !== 'APPROVED' || unresolvedMarkers(document).length > 0) return null;
  return document;
}

export function isLegalAcceptanceEnabled() {
  return process.env.PRIMAL_LEGAL_ACCEPTANCE_ENABLED === 'true';
}

export function getActiveMandatoryPolicyDocuments() {
  if (!isLegalAcceptanceEnabled()) return [];
  const documents = (['TERMS', 'PRIVACY_POLICY'] as const)
    .map(type => getApprovedConfiguredLegalDocument(type))
    .filter((document): document is LegalDocument => Boolean(document && document.mandatoryAcknowledgement));
  return documents.length === 2 ? documents : [];
}

export function getApprovedConfiguredDocuments() {
  return (['TERMS', 'PRIVACY_POLICY', 'AI_DISCLOSURE'] as const)
    .map(type => getApprovedConfiguredLegalDocument(type))
    .filter((document): document is LegalDocument => Boolean(document));
}

export function toLegalDocumentSummary(document: LegalDocument) {
  return {
    type: document.type,
    slug: document.slug,
    title: document.title,
    version: document.version,
    effectiveDate: document.effectiveDate,
    publicationStatus: document.publicationStatus,
    mandatoryAcknowledgement: document.mandatoryAcknowledgement,
  };
}
