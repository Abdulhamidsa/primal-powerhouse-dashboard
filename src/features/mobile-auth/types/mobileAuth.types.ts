export type MobileUser = { id: string; name: string | null; username?: string | null; displayName?: string; email: string | null };
export type MobileTokenPair = { accessToken: string; refreshToken: string; expiresIn: number; user: MobileUser };
