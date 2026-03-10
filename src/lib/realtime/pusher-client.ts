import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

export function hasPusherClientConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
}

export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new Pusher(key, {
      cluster,
      forceTLS: true,
      authEndpoint: '/api/realtime/pusher-auth',
    });
  }

  return pusherClient;
}
