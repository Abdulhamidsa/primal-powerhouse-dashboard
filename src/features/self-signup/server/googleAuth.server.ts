import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/email/transactional-email';
import { getOrCreateSystemCoachId } from './systemCoach.server';

export const GOOGLE_OAUTH_STATE_COOKIE = 'google-oauth-state';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

function googleClientId() {
  const value = process.env.GOOGLE_CLIENT_ID;
  if (!value) throw new Error('GOOGLE_CLIENT_ID is not configured');
  return value;
}

function googleClientSecret() {
  const value = process.env.GOOGLE_CLIENT_SECRET;
  if (!value) throw new Error('GOOGLE_CLIENT_SECRET is not configured');
  return value;
}

export function googleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || `${getAppBaseUrl()}/api/auth/google/callback`;
}

export function createGoogleOAuthState() {
  return randomBytes(24).toString('base64url');
}

export function createGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeAndVerifyGoogleCode(code: string) {
  const client = new OAuth2Client(googleClientId(), googleClientSecret(), googleRedirectUri());
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error('Google did not return an identity token');

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: googleClientId(),
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Google identity payload is missing');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss ?? '')) {
    throw new Error('Invalid Google identity issuer');
  }
  if (payload.aud !== googleClientId()) throw new Error('Invalid Google identity audience');
  if (!payload.sub) throw new Error('Google identity subject is missing');
  if (!payload.email) throw new Error('Google identity email is missing');
  if (!payload.email_verified) throw new Error('Google email is not verified');

  return {
    providerAccountId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
  };
}

export async function findOrCreateGoogleClient(input: { providerAccountId: string; email: string; name: string }) {
  return prisma.$transaction(async tx => {
    const existingIdentity = await tx.clientAuthIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: input.providerAccountId,
        },
      },
      include: { client: true },
    });

    if (existingIdentity) {
      if (existingIdentity.email && existingIdentity.email.toLowerCase() !== input.email) {
        throw new Error('Google identity email conflict');
      }
      return existingIdentity.client;
    }

    const existingClient = await tx.client.findUnique({ where: { email: input.email } });
    if (existingClient) {
      const conflictingIdentity = await tx.clientAuthIdentity.findFirst({
        where: {
          provider: 'GOOGLE',
          clientId: existingClient.id,
          providerAccountId: { not: input.providerAccountId },
        },
      });
      if (conflictingIdentity) throw new Error('This client already has a different Google account linked');

      await tx.clientAuthIdentity.create({
        data: {
          clientId: existingClient.id,
          provider: 'GOOGLE',
          providerAccountId: input.providerAccountId,
          email: input.email,
          emailVerified: true,
        },
      });

      if (!existingClient.emailVerifiedAt) {
        return tx.client.update({
          where: { id: existingClient.id },
          data: { emailVerifiedAt: new Date() },
        });
      }
      return existingClient;
    }

    const coachId = await getOrCreateSystemCoachId(tx as typeof prisma);
    const created = await tx.client.create({
      data: {
        name: input.name,
        email: input.email,
        password: null,
        accessMode: 'SELF_SERVICE',
        coachId,
        serviceTier: 'FREE_PROGRAM',
        signupSource: 'SELF_SIGNUP',
        emailVerifiedAt: new Date(),
        authIdentities: {
          create: {
            provider: 'GOOGLE',
            providerAccountId: input.providerAccountId,
            email: input.email,
            emailVerified: true,
          },
        },
      },
    });
    return created;
  });
}
