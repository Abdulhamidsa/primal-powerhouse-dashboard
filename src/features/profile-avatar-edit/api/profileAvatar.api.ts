import { httpClient } from '@/lib/http/client';
import type {
  CloudinaryUploadResponse,
  ProfileAvatarPayload,
  ProfileAvatarResponse,
} from '@/features/profile-avatar-edit/types/profileAvatar.types';

export async function uploadProfileAvatarImage(file: File): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'profile-avatars');
  formData.append('tags', 'client-avatar');

  return httpClient.postForm<CloudinaryUploadResponse>('/api/cloudinary/upload', formData);
}

export async function updateOwnProfileAvatar(payload: ProfileAvatarPayload): Promise<ProfileAvatarResponse> {
  return httpClient.put<ProfileAvatarResponse>('/api/user/profile/avatar', payload);
}
