export type UserProfileCoach = {
  name: string;
  email: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  age: number | null;
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  coach: UserProfileCoach | null;
};

export type UserProfileResponse = {
  user: UserProfile;
};

