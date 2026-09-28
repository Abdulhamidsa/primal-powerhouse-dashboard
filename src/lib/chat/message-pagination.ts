import { z } from 'zod';

const messageCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
});

export type MessageCursor = z.infer<typeof messageCursorSchema>;

export function encodeMessageCursor(cursor: MessageCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeMessageCursor(value: string): MessageCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    const result = messageCursorSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
