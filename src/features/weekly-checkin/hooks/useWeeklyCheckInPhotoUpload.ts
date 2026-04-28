'use client';

import { useMemo, useState } from 'react';
import type { ApiError } from '@/lib/fetcher';
import { uploadWeeklyCheckInPhoto } from '@/features/weekly-checkin/api/weeklyCheckIn.api';

export function useWeeklyCheckInPhotoUpload() {
  const [activeUploads, setActiveUploads] = useState(0);

  const upload = async (file: File) => {
    try {
      setActiveUploads(current => current + 1);
      return await uploadWeeklyCheckInPhoto(file);
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || 'Failed to upload photo');
    } finally {
      setActiveUploads(current => Math.max(0, current - 1));
    }
  };

  const isUploading = useMemo(() => activeUploads > 0, [activeUploads]);

  return {
    upload,
    isUploading,
  };
}
