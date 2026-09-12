import { beforeEach, expect, it, vi } from 'vitest';
const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      keys.forEach(key => storage.delete(key));
    }),
  },
}));
import { savePendingMessage, loadPendingMessage, clearSentMessage } from './pendingMessageStore';
beforeEach(() => storage.clear());

it('restores the exact retry ID and payload after a lost response and module reload', async () => {
  const message = {
    conversationId: 'coach-a',
    input: { body: 'My check-in question', attachments: [], clientTempId: 'stable-retry-id' },
  };
  await savePendingMessage('client-a', message);
  vi.resetModules();
  const reopened = await import('./pendingMessageStore');
  expect(await reopened.loadPendingMessage('client-a', 'coach-a')).toEqual(message);
  expect(await reopened.loadPendingMessage('client-b', 'coach-a')).toBeNull();
  expect(await reopened.loadPendingMessage('client-a', 'coach-b')).toBeNull();
});

it('clears confirmed messages with their drafts while preserving other conversations', async () => {
  await savePendingMessage('client-a', { conversationId: 'coach-a', input: { body: 'Hello', clientTempId: 'id' } });
  storage.set('primal:client-a:draft:chat:coach-a', 'old message');
  storage.set('primal:client-a:draft:chat-attachments:coach-a', '[]');
  storage.set('primal:client-a:draft:chat:coach-b', 'keep');
  await clearSentMessage('client-a', 'coach-a');
  expect(await loadPendingMessage('client-a', 'coach-a')).toBeNull();
  expect(storage.size).toBe(1);
  expect(storage.get('primal:client-a:draft:chat:coach-b')).toBe('keep');
});

it('does not persist an attempt without a retry identifier', async () => {
  await expect(
    savePendingMessage('client-a', { conversationId: 'coach-a', input: { body: 'Hello' } }),
  ).rejects.toThrow();
  expect(storage.size).toBe(0);
});
