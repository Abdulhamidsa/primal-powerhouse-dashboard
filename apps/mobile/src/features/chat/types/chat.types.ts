export type {
  ConversationListResponse,
  ConversationMessagesResponse,
  ConversationSummary,
  MessageAttachment,
  ConversationUploadResponse,
} from '@primal/contracts/client-coach-messaging/types/messaging.types';
import type { z } from 'zod';
import type { pendingMessageSchema } from '../schemas/pendingMessage.schema';
export type PendingMessage = z.infer<typeof pendingMessageSchema>;
