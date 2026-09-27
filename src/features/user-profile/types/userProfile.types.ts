export type UserProfileCoach = {
  name: string;
  email: string;
};

export type UserProfile = {
  id: string;
  name: string | null;
  displayName: string;
  username: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  avatar: string | null;
  age: number | null;
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  hasPassword: boolean;
  accessMode: 'SELF_SERVICE' | 'COACHING';
  coach: UserProfileCoach | null;
};

export type UserProfileResponse = {
  user: UserProfile;
};

export type PasswordLinkResponse = {
  success: boolean;
  message: string;
};

export type RecoveryEmailResponse = {
  success: boolean;
  message: string;
};

export type DisplayNameResponse = {
  user: UserProfile;
};
