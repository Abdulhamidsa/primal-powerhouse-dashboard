import { z } from 'zod';
import { profileAvatarPayloadSchema } from '@/features/profile-avatar-edit/schemas/profileAvatar.schema';

export type ProfileAvatarPayload = z.infer<typeof profileAvatarPayloadSchema>;

export type ProfileAvatarResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    age: number | null;
    height: number | null;
    currentWeight: number | null;
    targetWeight: number | null;
  };
};

export type CloudinaryUploadResponse = {
  success: boolean;
  data: {
    publicId: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  };
};
