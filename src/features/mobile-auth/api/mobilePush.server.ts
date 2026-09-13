import { prisma } from '@/lib/prisma';
import { httpClient } from '@/lib/http/client';
import type { ExpoPushResult } from '../types/mobilePush.types';

function expoHeaders(): Record<string, string> { return process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}; }
export async function sendMobileChatPush(clientId: string, conversationId: string, messageId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { consentMessageNotifications: true, status: true, deactivatedAt: true } });
  if (!client?.consentMessageNotifications || client.status === 'ARCHIVED' || client.status === 'INACTIVE' || client.deactivatedAt) return;
  const devices = await prisma.mobilePushDevice.findMany({ where: { session: { clientId, revokedAt: null, expiresAt: { gt: new Date() } } } });
  for (const device of devices) {
    // A durable uniqueness constraint prevents the web fallback from sending this message twice.
    const claim = await prisma.mobilePushDelivery.createMany({ data: [{ messageId, deviceToken: device.token }], skipDuplicates: true });
    if (!claim.count) continue;
    try {
      const response = await httpClient.post<{ data: ExpoPushResult }>('https://exp.host/--/api/v2/push/send', { to: device.token, title: 'Primal Powerhouse', body: 'You have a new message from your coach.', sound: 'default', data: { conversationId, messageId } }, { headers: expoHeaders(), signal: AbortSignal.timeout(10000) });
      await prisma.mobilePushDelivery.update({ where: { messageId_deviceToken: { messageId, deviceToken: device.token } }, data: { status: response.data.status === 'ok' ? 'ACCEPTED' : 'FAILED', receiptId: response.data.id } });
      if (response.data.details?.error === 'DeviceNotRegistered') await prisma.mobilePushDevice.deleteMany({ where: { token: device.token } });
    } catch {
      // Delivery is uncertain after a transport timeout. Do not blindly resend and duplicate a notification.
      await prisma.mobilePushDelivery.update({ where: { messageId_deviceToken: { messageId, deviceToken: device.token } }, data: { status: 'UNKNOWN' } });
    }
  }
}

export async function collectMobilePushReceipts() {
  const pending = await prisma.mobilePushDelivery.findMany({ where: { status: 'ACCEPTED', receiptId: { not: null }, createdAt: { lt: new Date(Date.now() - 15 * 60_000) } }, take: 100 });
  if (!pending.length) return { checked: 0 };
  const response = await httpClient.post<{ data: Record<string, ExpoPushResult> }>('https://exp.host/--/api/v2/push/getReceipts', { ids: pending.map(p => p.receiptId) }, { headers: expoHeaders(), signal: AbortSignal.timeout(10000) });
  for (const delivery of pending) {
    const receipt = response.data[delivery.receiptId!];
    if (!receipt) continue;
    await prisma.mobilePushDelivery.update({ where: { id: delivery.id }, data: { status: receipt.status === 'ok' ? 'DELIVERED' : 'FAILED' } });
    if (receipt.details?.error === 'DeviceNotRegistered') await prisma.mobilePushDevice.deleteMany({ where: { token: delivery.deviceToken } });
  }
  await prisma.mobilePushDelivery.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 30 * 86400_000) } } });
  return { checked: pending.length };
}
