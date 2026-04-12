import { z } from 'zod';

export const conversationPresenceSchema = z.object({
  conversationId: z.string().trim().min(1).max(64).nullable(),
});

export type ConversationPresenceInput = z.infer<typeof conversationPresenceSchema>;
