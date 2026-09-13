import { Resend } from 'resend';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let resend: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

export function getAppBaseUrl() {
  return (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const client = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!client || !from) {
    console.warn('[EMAIL] Resend is not configured; skipping transactional email:', input.subject);
    return { skipped: true };
  }

  await client.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { skipped: false };
}

export async function sendVerificationEmail(args: { to: string; name: string; token: string }) {
  const url = `${getAppBaseUrl()}/user/verify-email?token=${encodeURIComponent(args.token)}`;
  return sendTransactionalEmail({
    to: args.to,
    subject: 'Verify your Primal Power account',
    text: `Hi ${args.name}, verify your email here: ${url}`,
    html: `<p>Hi ${escapeHtml(args.name)},</p><p>Verify your email to start using Primal Power.</p><p><a href="${url}">Verify email</a></p>`,
  });
}

export async function sendPasswordResetEmail(args: { to: string; name: string; token: string }) {
  const url = `${getAppBaseUrl()}/user/reset-password?token=${encodeURIComponent(args.token)}`;
  return sendTransactionalEmail({
    to: args.to,
    subject: 'Reset your Primal Power password',
    text: `Hi ${args.name}, reset your password here: ${url}`,
    html: `<p>Hi ${escapeHtml(args.name)},</p><p>Use this secure link to reset your password.</p><p><a href="${url}">Reset password</a></p>`,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
