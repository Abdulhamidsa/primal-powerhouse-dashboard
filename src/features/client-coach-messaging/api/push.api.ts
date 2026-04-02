import { httpClient } from '@/lib/http/client';

export async function subscribePush(subscription: PushSubscriptionJSON): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>('/api/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  });
}

export async function unsubscribePush(endpoint: string): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>('/api/push/unsubscribe', { endpoint });
}
