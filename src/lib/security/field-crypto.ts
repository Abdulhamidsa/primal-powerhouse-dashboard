import crypto from 'crypto';

export type EncryptedFieldPayload = {
  keyVersion: string;
  iv: string;
  authTag: string;
  ciphertext: string;
};

const ALGO = 'aes-256-gcm';
const DEFAULT_KEY_VERSION = process.env.FIELD_ENCRYPTION_KEY_VERSION || 'v1';

function getMasterKeyBuffer(): Buffer {
  const fromBase64 = process.env.FIELD_ENCRYPTION_MASTER_KEY_BASE64;
  const fromRaw = process.env.FIELD_ENCRYPTION_MASTER_KEY;

  if (fromBase64) {
    const key = Buffer.from(fromBase64, 'base64');
    if (key.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_MASTER_KEY_BASE64 must decode to exactly 32 bytes');
    }
    return key;
  }

  if (fromRaw) {
    const key = Buffer.from(fromRaw, 'utf8');
    if (key.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_MASTER_KEY must be exactly 32 UTF-8 bytes');
    }
    return key;
  }

  throw new Error('Field encryption key is not configured. Set FIELD_ENCRYPTION_MASTER_KEY_BASE64 (preferred).');
}

function deriveDataKey(context: string, keyVersion: string): Buffer {
  const masterKey = getMasterKeyBuffer();
  const salt = crypto.createHash('sha256').update(`primal-powerhouse:${keyVersion}`).digest();
  const derived = crypto.hkdfSync('sha256', masterKey, salt, Buffer.from(context, 'utf8'), 32);

  return Buffer.isBuffer(derived) ? derived : Buffer.from(derived);
}

function toBase64Url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

export function encryptField(plaintext: string, context: string, keyVersion = DEFAULT_KEY_VERSION): string {
  if (plaintext.length === 0) return plaintext;

  const iv = crypto.randomBytes(12);
  const key = deriveDataKey(context, keyVersion);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  cipher.setAAD(Buffer.from(context, 'utf8'));

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload: EncryptedFieldPayload = {
    keyVersion,
    iv: toBase64Url(iv),
    authTag: toBase64Url(authTag),
    ciphertext: toBase64Url(ciphertext),
  };

  return JSON.stringify(payload);
}

export function decryptField(serializedPayload: string, context: string): string {
  if (!serializedPayload) return serializedPayload;

  let payload: EncryptedFieldPayload;
  try {
    payload = JSON.parse(serializedPayload) as EncryptedFieldPayload;
  } catch {
    return serializedPayload;
  }

  if (!payload?.keyVersion || !payload?.iv || !payload?.authTag || !payload?.ciphertext) {
    return serializedPayload;
  }

  const key = deriveDataKey(context, payload.keyVersion);
  const decipher = crypto.createDecipheriv(ALGO, key, fromBase64Url(payload.iv));
  decipher.setAAD(Buffer.from(context, 'utf8'));
  decipher.setAuthTag(fromBase64Url(payload.authTag));

  const plaintext = Buffer.concat([decipher.update(fromBase64Url(payload.ciphertext)), decipher.final()]);

  return plaintext.toString('utf8');
}

export function isEncryptedPayload(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const payload = JSON.parse(value) as Partial<EncryptedFieldPayload>;
    return Boolean(payload.keyVersion && payload.iv && payload.authTag && payload.ciphertext);
  } catch {
    return false;
  }
}

export function decryptOrFallback(value: string | null | undefined, context: string): string | null {
  if (!value) return null;
  if (!isEncryptedPayload(value)) return value;
  return decryptField(value, context);
}
