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
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function removeStaleSubscription(subscriptionId: string) {
  try {
    await (prisma as any).pushSubscription.delete({ where: { id: subscriptionId } });
  } catch {
    // already gone, nothing to do
  }
}

export async function sendPushToClient(clientId: string, payload: PushPayload): Promise<void> {
  ensureInitialized();

  const subscriptions: StoredSubscription[] = await (prisma as any).pushSubscription.findMany({
    where: { clientId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return;

  const notification = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
      } catch (err: any) {
        // 410 Gone / 404 Not Found = subscription expired, clean it up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await removeStaleSubscription(sub.id);
        } else {
          console.error(`[PUSH] Failed to send to subscription ${sub.id}:`, err?.message);
        }
      }
    }),
  );
}
