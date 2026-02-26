import crypto from 'crypto';

export function createDownloadToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashDownloadToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null>>): string {
  const escapeCell = (value: string | number | null): string => {
    if (value == null) return '';
    const stringValue = String(value);
    const escaped = stringValue.replaceAll('"', '""');
    return `"${escaped}"`;
  };

  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }

  return lines.join('\n');
}
