import { z } from 'zod';
import { sendMessageSchema } from './chat.schema';

export const pendingMessageSchema = z.object({
  conversationId: z.string().min(1),
  input: sendMessageSchema.refine(input => Boolean(input.clientTempId), 'A retry identifier is required'),
});
