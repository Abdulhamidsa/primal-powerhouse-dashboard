import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email/transactional-email';
import { getOrCreateSystemCoachId } from './systemCoach.server';
import { createRawToken, hashToken, hoursFromNow } from './token.server';
import { findClientByIdentifier } from './identifier.server';
import { normalizeUsername, validateUsername } from './username.server';
import { getClientDisplayName } from '@/lib/client-display-name';
import { recordConfiguredAgeDeclaration, assertAgeDeclaration } from '@/lib/privacy/age-policy';

const VERIFICATION_TOKEN_HOURS = 24;
const RESET_TOKEN_HOURS = 1;
export const GENERIC_FORGOT_RESPONSE = 'If recovery is available for this account, instructions have been sent.';

type SignupInput =
  | { method?: 'email'; email: string; password: string; ageDeclared?: boolean }
  | { method: 'username'; username: string; password: string; ageDeclared?: boolean };

export async function createSelfSignupClient(input: SignupInput) {
  assertAgeDeclaration(input.ageDeclared);
  const isUsernameSignup = input.method === 'username';
  const email = isUsernameSignup ? null : input.email.toLowerCase().trim();
  const username = isUsernameSignup ? input.username.trim() : null;
  const usernameNormalized = username ? normalizeUsername(username) : null;
  const usernameError = username ? validateUsername(username) : null;
  if (usernameError) throw new Error(usernameError);

  const password = await AuthService.hashPassword(input.password);
  const rawToken = isUsernameSignup ? null : createRawToken();
  const tokenHash = rawToken ? hashToken(rawToken) : null;

  const client = await prisma.$transaction(async tx => {
    const existing = email
      ? await tx.client.findUnique({ where: { email }, select: { id: true } })
      : await tx.client.findUnique({ where: { usernameNormalized: usernameNormalized! }, select: { id: true } });
    if (existing) throw new Error(isUsernameSignup ? 'That username is already taken' : 'An account with this email already exists');

    const coachId = await getOrCreateSystemCoachId(tx as typeof prisma);
    const created = await tx.client.create({
      data: {
        name: null,
        email,
        username,
        usernameNormalized,
        password,
        accessMode: 'SELF_SERVICE',
        coachId,
        serviceTier: 'FREE_PROGRAM',
        signupSource: isUsernameSignup ? 'USERNAME_SIGNUP' : 'SELF_SIGNUP',
      },
      select: { id: true, name: true, email: true, username: true },
    });

    await recordConfiguredAgeDeclaration({
      clientId: created.id,
      declared: input.ageDeclared,
      source: 'email-signup',
      platform: 'web',
      tx,
    });

    if (rawToken && tokenHash && created.email) {
      await tx.emailVerificationToken.create({
        data: { clientId: created.id, targetEmail: created.email, tokenHash, expiresAt: hoursFromNow(VERIFICATION_TOKEN_HOURS) },
      });
    }
    return created;
  });

  if (rawToken && client.email) await sendVerificationEmail({ to: client.email, name: getClientDisplayName(client), token: rawToken });
  return client;
}

export async function resendVerificationEmail(emailInput: string) {
  const email = emailInput.toLowerCase().trim();
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);

  const client = await prisma.$transaction(async tx => {
    const found = await tx.client.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, signupSource: true, emailVerifiedAt: true },
    });
    if (!found || !found.email || !['SELF_SIGNUP', 'USERNAME_SIGNUP'].includes(found.signupSource) || found.emailVerifiedAt) return null;

    await tx.emailVerificationToken.updateMany({ where: { clientId: found.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.emailVerificationToken.create({
      data: { clientId: found.id, targetEmail: found.email, tokenHash, expiresAt: hoursFromNow(VERIFICATION_TOKEN_HOURS) },
    });
    return found;
  });

  if (client?.email) await sendVerificationEmail({ to: client.email, name: getClientDisplayName(client), token: rawToken });
}

export async function addRecoveryEmail(clientId: string, emailInput: string) {
  const email = emailInput.toLowerCase().trim();
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);

  const client = await prisma.$transaction(async tx => {
    const current = await tx.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, emailVerifiedAt: true },
    });
    if (!current) throw new Error('Client not found');
    if (current.emailVerifiedAt) throw new Error('A verified email cannot be replaced here');

    const existing = await tx.client.findUnique({ where: { email }, select: { id: true } });
    if (existing && existing.id !== clientId) throw new Error('That email is already in use');

    await tx.emailVerificationToken.updateMany({ where: { clientId, usedAt: null }, data: { usedAt: new Date() } });
    const updated = await tx.client.update({
      where: { id: clientId },
      data: { email, emailVerifiedAt: null },
      select: { id: true, name: true, email: true },
    });
    await tx.emailVerificationToken.create({
      data: { clientId, targetEmail: email, tokenHash, expiresAt: hoursFromNow(VERIFICATION_TOKEN_HOURS) },
    });
    return updated;
  });

  if (client.email) await sendVerificationEmail({ to: client.email, name: getClientDisplayName(client), token: rawToken });
}

export async function verifyEmailToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  return prisma.$transaction(async tx => {
    const token = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { client: { select: { id: true, email: true, emailVerifiedAt: true } } },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) return false;
    if (!token.client.email || (token.targetEmail && token.targetEmail !== token.client.email)) return false;

    await tx.emailVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    if (!token.client.emailVerifiedAt) await tx.client.update({ where: { id: token.client.id }, data: { emailVerifiedAt: new Date() } });
    return true;
  });
}

export async function sendForgotPasswordEmail(identifierInput: string) {
  const client = await findClientByIdentifier(identifierInput);
  if (!client?.password || !client.email || !client.emailVerifiedAt) return GENERIC_FORGOT_RESPONSE;

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  await prisma.$transaction(async tx => {
    await tx.passwordResetToken.updateMany({ where: { clientId: client.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordResetToken.create({ data: { clientId: client.id, tokenHash, expiresAt: hoursFromNow(RESET_TOKEN_HOURS) } });
  });
  await sendPasswordResetEmail({ to: client.email, name: getClientDisplayName(client), token: rawToken });
  return GENERIC_FORGOT_RESPONSE;
}

export async function sendAuthenticatedPasswordLink(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true, email: true, emailVerifiedAt: true } });
  if (!client?.email || !client.emailVerifiedAt) return false;

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  await prisma.$transaction(async tx => {
    await tx.passwordResetToken.updateMany({ where: { clientId: client.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordResetToken.create({ data: { clientId: client.id, tokenHash, expiresAt: hoursFromNow(RESET_TOKEN_HOURS) } });
  });
  await sendPasswordResetEmail({ to: client.email, name: getClientDisplayName(client), token: rawToken });
  return true;
}

export async function resetPasswordWithToken(rawToken: string, passwordInput: string) {
  const tokenHash = hashToken(rawToken);
  const hashedPassword = await AuthService.hashPassword(passwordInput);

  return prisma.$transaction(async tx => {
    const token = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { client: { select: { id: true, email: true } } } });
    if (!token || token.usedAt || token.expiresAt <= new Date()) return false;

    const invalidBefore = new Date();
    await tx.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: invalidBefore } });
    await tx.client.update({ where: { id: token.client.id }, data: { password: hashedPassword, authInvalidBefore: invalidBefore } });
    await tx.mobileSession.updateMany({ where: { clientId: token.client.id, revokedAt: null }, data: { revokedAt: invalidBefore } });
    return { clientId: token.client.id, email: token.client.email, invalidBefore };
  });
}
