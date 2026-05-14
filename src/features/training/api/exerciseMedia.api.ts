import { httpClient } from '@/lib/http/client';

export type CloudinaryExerciseUploadResponse = {
  success: true;
  data: {
    url: string;
    resourceType: string;
    format?: string;
    publicId?: string;
  };
};

export async function uploadExerciseMedia(file: File, folder = 'training-exercises') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('tags', 'training-exercise,custom-exercise');

  return httpClient.postForm<CloudinaryExerciseUploadResponse>('/api/cloudinary/upload', formData);
}
