import { z } from 'zod';

export const mobileLoginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });
export const mobileRefreshSchema = z.object({ refreshToken: z.string().min(40).max(200) });
export const mobileReauthenticateSchema = z.object({ password: z.string().min(1).max(200) });
export const mobileDeviceSchema = z.object({ token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$/) });
