export type Session = { accessToken: string; refreshToken: string; expiresIn: number; user: { id: string; name: string | null; username?: string | null; displayName?: string; email: string | null } };
export type AuthState = { session: Session | null; ready: boolean };
