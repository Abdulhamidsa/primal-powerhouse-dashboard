import { httpClient } from '@/lib/http/client';
import type { NativeFile } from '../types/media.types';
export function fileForm(file: NativeFile) {
  const form = new FormData();
  form.append('file', file as unknown as Blob);
  return form;
}
export async function uploadPhoto(file: NativeFile, folder: string) {
  const form = fileForm(file); form.append('folder', folder);
  const result = await httpClient.postForm<{ data: { url: string } }>('/api/cloudinary/upload', form);
  return result.data.url;
}
