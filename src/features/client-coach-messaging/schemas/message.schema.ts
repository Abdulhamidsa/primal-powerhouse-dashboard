import { z } from 'zod';

export const messageAttachmentSchema = z.object({
  type: z.enum(['image', 'video', 'audio']),
  publicId: z.string().trim().min(1).max(300),
  resourceType: z.enum(['image', 'video', 'raw']),
  mimeType: z.string().trim().min(1).max(150),
  bytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  width: z.number().int().positive().max(12000).nullable().optional(),
  height: z.number().int().positive().max(12000).nullable().optional(),
  durationSec: z
    .number()
    .positive()
    .max(60 * 60)
    .nullable()
    .optional(),
  url: z.string().url().optional(),
  expiresAt: z.number().int().positive().optional(),
});

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(5000).optional(),
    attachments: z.array(messageAttachmentSchema).max(5).optional(),
  })
  .refine(value => Boolean(value.body?.trim()) || Boolean(value.attachments?.length), {
    message: 'Message body or at least one attachment is required',
  });

export const createConversationSchema = z.object({
  clientId: z.string().trim().min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageAttachmentInput = z.infer<typeof messageAttachmentSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
