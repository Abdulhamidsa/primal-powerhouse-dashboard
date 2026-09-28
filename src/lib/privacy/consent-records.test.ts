import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentRecordAction, ConsentRecordCategory } from '@prisma/client';

vi.mock('server-only', () => ({}));

const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  consentRecord: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma: database }));

import {
  acknowledgeConfiguredPolicy,
  appendConsentRecord,
  updateMessageNotificationPreference,
  updatePrivacyChoices,
} from '@/lib/privacy/consent-records';

function transactionDatabase() {
  return {
    client: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clientNotificationPreference: {
      upsert: vi.fn(),
    },
    consentRecord: {
      create: vi.fn(),
    },
  };
}

describe('strict consent records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects actions that do not belong to the record category', async () => {
    const tx = { consentRecord: { create: vi.fn() } } as never;

    await expect(
      appendConsentRecord(tx, {
        clientId: 'client-1',
        category: ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT,
        type: 'TERMS',
        action: ConsentRecordAction.GRANTED,
        version: 'terms-v1',
      }),
    ).rejects.toThrow('Invalid consent record action');
    expect((tx as { consentRecord: { create: ReturnType<typeof vi.fn> } }).consentRecord.create).not.toHaveBeenCalled();
  });

  it('stores explicit category, type, action, and version', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'record-1' });
    const tx = { consentRecord: { create } } as never;

    await appendConsentRecord(tx, {
      clientId: 'client-1',
      category: ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT,
      type: 'TERMS',
      action: ConsentRecordAction.ACKNOWLEDGED,
      version: 'terms-v1',
      source: 'signup',
      platform: 'web',
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        category: ConsentRecordCategory.POLICY_ACKNOWLEDGEMENT,
        type: 'TERMS',
        action: ConsentRecordAction.ACKNOWLEDGED,
        version: 'terms-v1',
      }),
    }));
  });

  it('updates compatibility projections and appends only changed choices', async () => {
    const tx = transactionDatabase();
    tx.client.findUnique.mockResolvedValue({
      consentAnalytics: false,
      consentMarketingNotifications: false,
      consentOptionalTracking: false,
      consentMessageNotifications: false,
      notificationPreference: { coachMessagePushEnabled: false },
    });
    database.$transaction.mockImplementation(async (callback: (value: typeof tx) => unknown) => callback(tx));

    await updatePrivacyChoices({
      clientId: 'client-1',
      analytics: true,
      marketingNotifications: false,
      optionalTracking: false,
      messageNotifications: true,
    });

    expect(tx.clientNotificationPreference.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: { clientId: 'client-1', coachMessagePushEnabled: true },
    }));
    expect(tx.consentRecord.create).toHaveBeenCalledTimes(2);
    expect(tx.consentRecord.create.mock.calls.map(call => call[0].data.category)).toEqual([
      ConsentRecordCategory.OPTIONAL_CONSENT,
      ConsentRecordCategory.NOTIFICATION_PREFERENCE,
    ]);
  });

  it('uses the notification preference category rather than optional consent', async () => {
    const tx = transactionDatabase();
    tx.client.findUnique.mockResolvedValue({
      consentMessageNotifications: false,
      notificationPreference: { coachMessagePushEnabled: false },
    });
    database.$transaction.mockImplementation(async (callback: (value: typeof tx) => unknown) => callback(tx));

    await updateMessageNotificationPreference({ clientId: 'client-1', enabled: true });

    expect(tx.consentRecord.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        category: ConsentRecordCategory.NOTIFICATION_PREFERENCE,
        type: 'COACH_MESSAGE_PUSH',
        action: ConsentRecordAction.ENABLED,
      }),
    }));
  });

  it('does not accept an unconfigured policy version', async () => {
    vi.stubEnv('PRIMAL_TERMS_VERSION', 'terms-v2');
    await expect(
      acknowledgeConfiguredPolicy({
        clientId: 'client-1',
        type: 'TERMS',
        version: 'terms-v1',
        source: 'signup',
        platform: 'web',
      }),
    ).rejects.toThrow('POLICY_VERSION_NOT_CONFIGURED');
  });
});
