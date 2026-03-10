export type MessageSenderRole = 'CLIENT' | 'COACH' | 'ADMIN' | 'SYSTEM';

export type MessageAttachmentType = 'image' | 'video' | 'audio';

export type MessageAttachment = {
  type: MessageAttachmentType;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  mimeType: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
  url?: string;
  expiresAt?: number;
};

export type ConversationSummary = {
  id: string;
  clientId: string;
  clientName: string;
  coachId: string;
  coachName: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string | null;
  attachments: MessageAttachment[];
  createdAt: string;
  deliveryStatus?: 'sent' | 'pending' | 'failed';
  clientTempId?: string;
};

export type ConversationListResponse = {
  items: ConversationSummary[];
};

export type ConversationMessagesResponse = {
  conversation: ConversationSummary;
  items: ChatMessage[];
};

export type SendMessagePayload = {
  body?: string;
  attachments?: MessageAttachment[];
};

export type CreateConversationPayload = {
  clientId: string;
};

export type ConversationUploadResponse = {
  attachment: MessageAttachment;
};
