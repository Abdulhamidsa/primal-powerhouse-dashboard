import Pusher from 'pusher';
import { toConversationChannel, toUserChannel } from '@/lib/realtime/channels';

let pusherInstance: Pusher | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function hasPusherServerConfig(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER,
  );
}

export function getPusherServer(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: getRequiredEnv('PUSHER_APP_ID'),
      key: getRequiredEnv('PUSHER_KEY'),
      secret: getRequiredEnv('PUSHER_SECRET'),
      cluster: getRequiredEnv('PUSHER_CLUSTER'),
      useTLS: true,
    });
  }

  return pusherInstance;
}

export { toConversationChannel, toUserChannel };
