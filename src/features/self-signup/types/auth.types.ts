export type AuthActionResponse = {
  success: boolean;
  message?: string;
  requiresVerification?: boolean;
  email?: string | null;
  username?: string | null;
};

export type SignupResponse = AuthActionResponse;
export type VerifyEmailResponse = AuthActionResponse;
export type ForgotPasswordResponse = AuthActionResponse;
export type ResetPasswordResponse = AuthActionResponse & {
  sessionKept?: boolean;
};
