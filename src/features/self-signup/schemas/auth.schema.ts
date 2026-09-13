import { z } from 'zod';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
});

export const emailSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(32).max(512),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(512),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
