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

export type PushTestResponse = {
  success: true;
  result: {
    status: 'sent' | 'partial' | 'failed' | 'skipped';
    subscriptionCount: number;
    successCount: number;
    failureCount: number;
    staleCount: number;
    reason?: string;
  };
};

export async function sendTestPush(): Promise<PushTestResponse> {
  return httpClient.post<PushTestResponse>('/api/push/test', {});
}
