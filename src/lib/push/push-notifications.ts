import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_CONTACT_EMAIL;

  if (!publicKey || !privateKey || !contact) {
    throw new Error('VAPID environment variables are not configured.');
  }

  webpush.setVapidDetails(contact, publicKey, privateKey);
  initialized = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  conversationId?: string;
  senderId?: string;
};

export type PushDeliveryStatus = 'sent' | 'partial' | 'failed' | 'skipped';

export type PushSendResult = {
  status: PushDeliveryStatus;
  subscriptionCount: number;
  successCount: number;
  failureCount: number;
  staleCount: number;
  reason?: string;
};

type PushSendOptions = {
  source: 'coach-message' | 'test';
  reason?: string;
  metadata?: Record<string, unknown>;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const COACH_MESSAGE_PUSH_COOLDOWN_MS = 5 * 60_000;

async function removeStaleSubscription(subscriptionId: string) {
  try {
    await (prisma as any).pushSubscription.delete({ where: { id: subscriptionId } });
  } catch {
    // already gone, nothing to do
  }
}

export async function logPushDeliveryResult({
  clientId,
  source,
  payload,
  result,
  metadata,
}: {
  clientId: string;
  source: 'coach-message' | 'test';
  payload: PushPayload;
  result: PushSendResult;
  metadata?: Record<string, unknown>;
}) {
  try {
    const model = (prisma as any).notificationDeliveryLog;
    if (!model) return;

    await model.create({
      data: {
        clientId,
        source,
        status: result.status,
        subscriptionCount: result.subscriptionCount,
        successCount: result.successCount,
        failureCount: result.failureCount,
        staleCount: result.staleCount,
        reason: result.reason ?? null,
        payloadJson: JSON.stringify({ payload, metadata: metadata ?? null }),
      },
    });
  } catch (error) {
    console.error('[PUSH] Failed to write delivery log:', error);
  }
}

export async function sendPushToClient(
  clientId: string,
  payload: PushPayload,
  options: PushSendOptions,
): Promise<PushSendResult> {
  ensureInitialized();

  const subscriptions: StoredSubscription[] = await (prisma as any).pushSubscription.findMany({
    where: { clientId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) {
    const result: PushSendResult = {
      status: 'skipped',
      subscriptionCount: 0,
      successCount: 0,
      failureCount: 0,
      staleCount: 0,
      reason: options.reason ?? 'no_subscriptions',
    };
    await logPushDeliveryResult({ clientId, source: options.source, payload, result, metadata: options.metadata });
    return result;
  }

  const notification = JSON.stringify(payload);
  const attempts = await Promise.all(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
        return { outcome: 'sent' as const };
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await removeStaleSubscription(sub.id);
          return { outcome: 'stale' as const };
        }

        console.error(`[PUSH] Failed to send to subscription ${sub.id}:`, err?.message);
        return { outcome: 'failed' as const };
      }
    }),
  );

  const successCount = attempts.filter(item => item.outcome === 'sent').length;
  const staleCount = attempts.filter(item => item.outcome === 'stale').length;
  const failureCount = attempts.filter(item => item.outcome === 'failed').length;

  const result: PushSendResult = {
    status: successCount === subscriptions.length ? 'sent' : successCount > 0 || staleCount > 0 ? 'partial' : 'failed',
    subscriptionCount: subscriptions.length,
    successCount,
    failureCount,
    staleCount,
    reason: options.reason,
  };

  await logPushDeliveryResult({ clientId, source: options.source, payload, result, metadata: options.metadata });
  return result;
}

export async function isCoachMessagePushCooldownActive(clientId: string, conversationId: string): Promise<boolean> {
  try {
    const model = (prisma as any).notificationDeliveryLog;
    if (!model) return false;

    const cutoff = new Date(Date.now() - COACH_MESSAGE_PUSH_COOLDOWN_MS);
    const marker = `"conversationId":"${conversationId}"`;

    const recent = await model.findFirst({
      where: {
        clientId,
        source: 'coach-message',
        status: { in: ['sent', 'partial'] },
        createdAt: { gte: cutoff },
        payloadJson: { contains: marker },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    return Boolean(recent);
  } catch (error) {
    console.error('[PUSH] Failed to evaluate coach message push cooldown:', error);
    return false;
  }
}
