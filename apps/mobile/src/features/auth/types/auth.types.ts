export type Session = { accessToken: string; refreshToken: string; expiresIn: number; user: { id: string; name: string; email: string } };
export type AuthState = { session: Session | null; ready: boolean };
