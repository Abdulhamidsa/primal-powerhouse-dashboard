'use client';

import { useState } from 'react';
import type { ApiError } from '@/lib/fetcher';
import { uploadWeeklyCheckInPhoto } from '@/features/weekly-checkin/api/weeklyCheckIn.api';

export function useWeeklyCheckInPhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File) => {
    try {
      setIsUploading(true);
      return await uploadWeeklyCheckInPhoto(file);
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
  };
}
