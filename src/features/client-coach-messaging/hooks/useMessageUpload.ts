'use client';

import { useState } from 'react';
import type { ApiError } from '@/lib/request';
import { uploadConversationAttachment } from '@/features/client-coach-messaging/api/messaging.api';
import type { MessageAttachment } from '@/features/client-coach-messaging/types/messaging.types';

export function useMessageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const uploadFile = async (conversationId: string, file: File): Promise<MessageAttachment> => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadConversationAttachment(conversationId, file);
      return response.attachment;
    } catch (uploadError) {
      const apiError = uploadError as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    error,
  };
}
