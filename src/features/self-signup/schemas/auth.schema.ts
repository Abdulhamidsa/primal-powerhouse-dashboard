import { z } from 'zod';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);
const usernameSchema = z.string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{2,23}$/, 'Username must be 3–24 characters and start with a letter.');

export const emailSignupSchema = z.object({
  method: z.literal('email').optional(),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: passwordSchema,
});

export const usernameSignupSchema = z.object({
  method: z.literal('username'),
  username: usernameSchema,
  password: passwordSchema,
});

export const signupSchema = z.union([emailSignupSchema, usernameSignupSchema]);

export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
});

export const recoveryIdentifierSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
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
export type EmailSignupInput = z.infer<typeof emailSignupSchema>;
export type UsernameSignupInput = z.infer<typeof usernameSignupSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
