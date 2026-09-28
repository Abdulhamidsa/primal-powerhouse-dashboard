import { ConsentRecordAction, ConsentRecordCategory, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  getActiveMandatoryPolicyDocuments,
  getApprovedConfiguredLegalDocument,
  getConfiguredLegalDocument,
} from '@/features/legal/legal-registry';

export const CONSENT_RECORD_TYPES = {
  policy: ['TERMS', 'PRIVACY_POLICY', 'AI_DISCLOSURE'],
  optional: ['ANALYTICS', 'MARKETING', 'OPTIONAL_TRACKING'],
  notification: ['COACH_MESSAGE_PUSH'],
  age: ['MINIMUM_AGE_DECLARATION'],
} as const;

export function getConfiguredPolicyVersions() {
  return {
    TERMS: process.env.PRIMAL_TERMS_VERSION?.trim() || null,
    PRIVACY_POLICY: process.env.PRIMAL_PRIVACY_POLICY_VERSION?.trim() || null,
    AI_DISCLOSURE: process.env.PRIMAL_AI_DISCLOSURE_VERSION?.trim() || null,
  } as const;
}

export type ConsentRecordInput = {
  clientId: string;
  category: ConsentRecordCategory;
  type: string;
  action: ConsentRecordAction;
  version?: string | null;
  source?: string | null;
  platform?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
  occurredAt?: Date;
};

const categoryTypes: Record<ConsentRecordCategory, readonly string[]> = {
  POLICY_ACKNOWLEDGEMENT: CONSENT_RECORD_TYPES.policy,
  OPTIONAL_CONSENT: CONSENT_RECORD_TYPES.optional,
  NOTIFICATION_PREFERENCE: CONSENT_RECORD_TYPES.notification,
  AGE_DECLARATION: CONSENT_RECORD_TYPES.age,
};

const categoryActions: Record<ConsentRecordCategory, readonly ConsentRecordAction[]> = {
  POLICY_ACKNOWLEDGEMENT: [ConsentRecordAction.ACKNOWLEDGED],
  OPTIONAL_CONSENT: [ConsentRecordAction.GRANTED, ConsentRecordAction.WITHDRAWN],
  NOTIFICATION_PREFERENCE: [ConsentRecordAction.ENABLED, ConsentRecordAction.DISABLED],
  AGE_DECLARATION: [ConsentRecordAction.DECLARED, ConsentRecordAction.DECLINED],
};

function validateConsentRecord(input: ConsentRecordInput) {
  const allowedTypes = categoryTypes[input.category];
  const allowedActions = categoryActions[input.category];

  if (!allowedTypes.includes(input.type)) {
    throw new Error(`Invalid consent record type for category ${input.category}`);
  }
  if (!allowedActions.includes(input.action)) {
    throw new Error(`Invalid consent record action for category ${input.category}`);
  }
  if (input.category === ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT && !input.version?.trim()) {
    throw new Error('Policy acknowledgement records require a version');
  }
  if (input.metadata) {
    for (const value of Object.values(input.metadata)) {
      if (typeof value === 'object' && value !== null) {
        throw new Error('Consent record metadata must be scalar');
      }
    }
  }
}

export async function appendConsentRecord(
  tx: Prisma.TransactionClient | typeof prisma,
  input: ConsentRecordInput,
) {
  validateConsentRecord(input);

  return tx.consentRecord.create({
    data: {
      clientId: input.clientId,
      category: input.category,
      type: input.type,
      action: input.action,
      version: input.version?.trim() || null,
      source: input.source?.trim() || null,
      platform: input.platform?.trim() || null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export type PrivacyChoiceInput = {
  analytics: boolean;
  marketingNotifications: boolean;
  optionalTracking: boolean;
  messageNotifications: boolean;
  source?: string;
  platform?: string;
};

export async function updatePrivacyChoices(input: { clientId: string } & PrivacyChoiceInput) {
  const { clientId, source = 'privacy-center', platform = 'web' } = input;

  return prisma.$transaction(async tx => {
    const current = await tx.client.findUnique({
      where: { id: clientId },
      select: {
        consentAnalytics: true,
        consentMarketingNotifications: true,
        consentOptionalTracking: true,
        consentMessageNotifications: true,
        notificationPreference: { select: { coachMessagePushEnabled: true } },
      },
    });

    if (!current) throw new Error('Client not found');

    const previousMessagePreference =
      current.notificationPreference?.coachMessagePushEnabled ?? current.consentMessageNotifications;

    await tx.client.update({
      where: { id: clientId },
      data: {
        consentAnalytics: input.analytics,
        consentMarketingNotifications: input.marketingNotifications,
        consentOptionalTracking: input.optionalTracking,
        // Compatibility projection. New notification reads use the dedicated preference row.
        consentMessageNotifications: input.messageNotifications,
        privacyUpdatedAt: new Date(),
      },
    });

    await tx.clientNotificationPreference.upsert({
      where: { clientId },
      create: { clientId, coachMessagePushEnabled: input.messageNotifications },
      update: { coachMessagePushEnabled: input.messageNotifications },
    });

    const records: ConsentRecordInput[] = [];
    if (current.consentAnalytics !== input.analytics) {
      records.push({
        clientId,
        category: ConsentRecordCategory.OPTIONAL_CONSENT,
        type: 'ANALYTICS',
        action: input.analytics ? ConsentRecordAction.GRANTED : ConsentRecordAction.WITHDRAWN,
        source,
        platform,
      });
    }
    if (current.consentMarketingNotifications !== input.marketingNotifications) {
      records.push({
        clientId,
        category: ConsentRecordCategory.OPTIONAL_CONSENT,
        type: 'MARKETING',
        action: input.marketingNotifications ? ConsentRecordAction.GRANTED : ConsentRecordAction.WITHDRAWN,
        source,
        platform,
      });
    }
    if (current.consentOptionalTracking !== input.optionalTracking) {
      records.push({
        clientId,
        category: ConsentRecordCategory.OPTIONAL_CONSENT,
        type: 'OPTIONAL_TRACKING',
        action: input.optionalTracking ? ConsentRecordAction.GRANTED : ConsentRecordAction.WITHDRAWN,
        source,
        platform,
      });
    }
    if (previousMessagePreference !== input.messageNotifications) {
      records.push({
        clientId,
        category: ConsentRecordCategory.NOTIFICATION_PREFERENCE,
        type: 'COACH_MESSAGE_PUSH',
        action: input.messageNotifications ? ConsentRecordAction.ENABLED : ConsentRecordAction.DISABLED,
        source,
        platform,
      });
    }

    for (const record of records) await appendConsentRecord(tx, record);
    return { changed: records.length };
  });
}

export async function updateMessageNotificationPreference(input: {
  clientId: string;
  enabled: boolean;
  source?: string;
  platform?: string;
}) {
  const { clientId, source = 'notification-settings', platform = 'web' } = input;

  return prisma.$transaction(async tx => {
    const current = await tx.client.findUnique({
      where: { id: clientId },
      select: {
        consentMessageNotifications: true,
        notificationPreference: { select: { coachMessagePushEnabled: true } },
      },
    });
    if (!current) throw new Error('Client not found');

    const previous = current.notificationPreference?.coachMessagePushEnabled ?? current.consentMessageNotifications;
    await tx.clientNotificationPreference.upsert({
      where: { clientId },
      create: { clientId, coachMessagePushEnabled: input.enabled },
      update: { coachMessagePushEnabled: input.enabled },
    });
    await tx.client.update({
      where: { id: clientId },
      data: { consentMessageNotifications: input.enabled, privacyUpdatedAt: new Date() },
    });

    if (previous !== input.enabled) {
      await appendConsentRecord(tx, {
        clientId,
        category: ConsentRecordCategory.NOTIFICATION_PREFERENCE,
        type: 'COACH_MESSAGE_PUSH',
        action: input.enabled ? ConsentRecordAction.ENABLED : ConsentRecordAction.DISABLED,
        source,
        platform,
      });
    }
    return { enabled: input.enabled, changed: previous !== input.enabled };
  });
}

export async function listConsentRecords(clientId: string) {
  return prisma.consentRecord.findMany({
    where: { clientId },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    select: {
      id: true,
      category: true,
      type: true,
      action: true,
      version: true,
      source: true,
      platform: true,
      occurredAt: true,
    },
  });
}

export function groupConsentRecords(records: Awaited<ReturnType<typeof listConsentRecords>>) {
  return {
    policyAcknowledgements: records.filter(record => record.category === ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT),
    optionalConsents: records.filter(record => record.category === ConsentRecordCategory.OPTIONAL_CONSENT),
    notificationPreferences: records.filter(record => record.category === ConsentRecordCategory.NOTIFICATION_PREFERENCE),
    ageDeclarations: records.filter(record => record.category === ConsentRecordCategory.AGE_DECLARATION),
  };
}

export async function appendAgeDeclaration(input: {
  clientId: string;
  declared: boolean;
  version: string;
  minimumAge: number;
  source: string;
  platform: string;
  tx?: Prisma.TransactionClient;
}) {
  const metadata = { minimumAge: input.minimumAge };
  return appendConsentRecord(input.tx ?? prisma, {
    clientId: input.clientId,
    category: ConsentRecordCategory.AGE_DECLARATION,
    type: 'MINIMUM_AGE_DECLARATION',
    action: input.declared ? ConsentRecordAction.DECLARED : ConsentRecordAction.DECLINED,
    version: input.version,
    source: input.source,
    platform: input.platform,
    metadata,
  });
}

export async function acknowledgeConfiguredPolicy(input: {
  clientId: string;
  type: 'TERMS' | 'PRIVACY_POLICY' | 'AI_DISCLOSURE';
  version: string;
  source: string;
  platform: string;
  tx?: Prisma.TransactionClient;
}) {
  const configuredVersion = getConfiguredPolicyVersions()[input.type];
  if (!configuredVersion || configuredVersion !== input.version) {
    throw new Error('POLICY_VERSION_NOT_CONFIGURED');
  }

  const document = getConfiguredLegalDocument(input.type);
  const approvedDocument = getApprovedConfiguredLegalDocument(input.type);
  if (!document || document.version !== input.version || !approvedDocument || approvedDocument.version !== input.version) {
    throw new Error('POLICY_VERSION_NOT_APPROVED');
  }

  const client = input.tx ?? prisma;
  const existing = await client.consentRecord.findFirst({
    where: {
      clientId: input.clientId,
      category: ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT,
      type: input.type,
      action: ConsentRecordAction.ACKNOWLEDGED,
      version: input.version,
    },
    orderBy: { occurredAt: 'desc' },
  });
  if (existing) return existing;

  return appendConsentRecord(client, {
    clientId: input.clientId,
    category: ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT,
    type: input.type,
    action: ConsentRecordAction.ACKNOWLEDGED,
    version: input.version,
    source: input.source,
    platform: input.platform,
  });
}

export function isSignupPolicyAcknowledgementRequired() {
  return getActiveMandatoryPolicyDocuments().length === 2;
}

export function assertSignupPolicyAcknowledgement(acknowledged: boolean | undefined) {
  if (isSignupPolicyAcknowledgementRequired() && acknowledged !== true) {
    throw new Error('LEGAL_ACKNOWLEDGEMENT_REQUIRED');
  }
}

export async function recordSignupPolicyAcknowledgements(input: {
  clientId: string;
  acknowledged: boolean | undefined;
  source: string;
  platform: string;
  tx: Prisma.TransactionClient;
}) {
  const documents = getActiveMandatoryPolicyDocuments();
  if (documents.length === 0) return [];
  if (input.acknowledged !== true) throw new Error('LEGAL_ACKNOWLEDGEMENT_REQUIRED');

  const records = [];
  for (const document of documents) {
    if (document.type !== 'TERMS' && document.type !== 'PRIVACY_POLICY' && document.type !== 'AI_DISCLOSURE') continue;
    records.push(await acknowledgeConfiguredPolicy({
      clientId: input.clientId,
      type: document.type,
      version: document.version,
      source: input.source,
      platform: input.platform,
      tx: input.tx,
    }));
  }
  return records;
}
