export type AuthActionResponse = {
  success: boolean;
  message?: string;
  requiresVerification?: boolean;
  email?: string;
};

export type SignupResponse = AuthActionResponse;
export type VerifyEmailResponse = AuthActionResponse;
export type ForgotPasswordResponse = AuthActionResponse;
export type ResetPasswordResponse = AuthActionResponse & {
  sessionKept?: boolean;
};
