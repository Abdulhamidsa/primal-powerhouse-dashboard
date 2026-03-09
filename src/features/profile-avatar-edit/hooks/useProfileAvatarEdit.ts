'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import { updateOwnProfileAvatar, uploadProfileAvatarImage } from '@/features/profile-avatar-edit/api/profileAvatar.api';
import { profileAvatarPayloadSchema } from '@/features/profile-avatar-edit/schemas/profileAvatar.schema';
import type { ProfileAvatarResponse } from '@/features/profile-avatar-edit/types/profileAvatar.types';

const PROFILE_ME_CACHE_KEY = '/api/auth/me';

export function useProfileAvatarEdit() {
  const { mutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (file: File): Promise<ProfileAvatarResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const uploadResult = await uploadProfileAvatarImage(file);
      const payload = profileAvatarPayloadSchema.parse({ avatar: uploadResult.data.url });
      const result = await updateOwnProfileAvatar(payload);
      await mutate(PROFILE_ME_CACHE_KEY);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
    error,
  };
}
