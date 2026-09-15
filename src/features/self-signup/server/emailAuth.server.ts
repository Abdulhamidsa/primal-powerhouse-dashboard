import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email/transactional-email';
import { getOrCreateSystemCoachId } from './systemCoach.server';
import { createRawToken, hashToken, hoursFromNow } from './token.server';

const VERIFICATION_TOKEN_HOURS = 24;
const RESET_TOKEN_HOURS = 1;
const GENERIC_FORGOT_RESPONSE = 'If an account exists for this email, a reset link has been sent.';

export async function createSelfSignupClient(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const password = await AuthService.hashPassword(input.password);
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);

  const client = await prisma.$transaction(async tx => {
    const existing = await tx.client.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new Error('An account with this email already exists');

    const coachId = await getOrCreateSystemCoachId(tx as typeof prisma);
    const created = await tx.client.create({
      data: {
        name: input.name.trim(),
        email,
        password,
        coachId,
        serviceTier: 'FREE_PROGRAM',
        signupSource: 'SELF_SIGNUP',
      },
      select: { id: true, name: true, email: true },
    });

    await tx.emailVerificationToken.create({
      data: {
        clientId: created.id,
        tokenHash,
        expiresAt: hoursFromNow(VERIFICATION_TOKEN_HOURS),
      },
    });

    return created;
  });

  await sendVerificationEmail({ to: client.email, name: client.name, token: rawToken });
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
    if (!found || found.signupSource !== 'SELF_SIGNUP' || found.emailVerifiedAt) return null;

    await tx.emailVerificationToken.updateMany({
      where: { clientId: found.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.emailVerificationToken.create({
      data: { clientId: found.id, tokenHash, expiresAt: hoursFromNow(VERIFICATION_TOKEN_HOURS) },
    });
    return found;
  });

  if (client) await sendVerificationEmail({ to: client.email, name: client.name, token: rawToken });
}

export async function verifyEmailToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  return prisma.$transaction(async tx => {
    const token = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { client: { select: { id: true, emailVerifiedAt: true } } },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) return false;

    await tx.emailVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    if (!token.client.emailVerifiedAt) {
      await tx.client.update({ where: { id: token.client.id }, data: { emailVerifiedAt: new Date() } });
    }
    return true;
  });
}

export async function sendForgotPasswordEmail(emailInput: string) {
  const email = emailInput.toLowerCase().trim();
  const client = await prisma.client.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true },
  });

  if (!client?.password) return GENERIC_FORGOT_RESPONSE;

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  await prisma.$transaction(async tx => {
    await tx.passwordResetToken.updateMany({
      where: { clientId: client.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: { clientId: client.id, tokenHash, expiresAt: hoursFromNow(RESET_TOKEN_HOURS) },
    });
  });

  await sendPasswordResetEmail({ to: client.email, name: client.name, token: rawToken });
  return GENERIC_FORGOT_RESPONSE;
}

export async function sendAuthenticatedPasswordLink(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, email: true },
  });

  if (!client) return false;

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);

  await prisma.$transaction(async tx => {
    await tx.passwordResetToken.updateMany({
      where: { clientId: client.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: { clientId: client.id, tokenHash, expiresAt: hoursFromNow(RESET_TOKEN_HOURS) },
    });
  });

  await sendPasswordResetEmail({ to: client.email, name: client.name, token: rawToken });
  return true;
}

export async function resetPasswordWithToken(rawToken: string, passwordInput: string) {
  const tokenHash = hashToken(rawToken);
  const hashedPassword = await AuthService.hashPassword(passwordInput);

  return prisma.$transaction(async tx => {
    const token = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { client: { select: { id: true, email: true } } },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) return false;

    const invalidBefore = new Date();
    await tx.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: invalidBefore } });
    await tx.client.update({
      where: { id: token.client.id },
      data: { password: hashedPassword, authInvalidBefore: invalidBefore },
    });
    await tx.mobileSession.updateMany({
      where: { clientId: token.client.id, revokedAt: null },
      data: { revokedAt: invalidBefore },
    });
    return {
      clientId: token.client.id,
      email: token.client.email,
      invalidBefore,
    };
  });
}
