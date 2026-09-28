export function assertDevelopmentSeed(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed scripts cannot run in production');
  }
}
