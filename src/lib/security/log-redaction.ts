type RedactionOptions = {
  maxDepth?: number;
};

const SENSITIVE_KEY_PATTERN =
  /(password|token|secret|authorization|cookie|set-cookie|auth|cipher|encrypted|phone|email|notes|message)/i;

function redactValue(value: unknown): string {
  if (value == null) return '[REDACTED]';
  if (typeof value === 'string' && value.length <= 4) return '****';
  return '[REDACTED]';
}

function sanitizeRecursive(input: unknown, depth: number, maxDepth: number): unknown {
  if (depth > maxDepth) return '[TRUNCATED]';

  if (Array.isArray(input)) {
    return input.map(item => sanitizeRecursive(item, depth + 1, maxDepth));
  }

  if (input && typeof input === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = redactValue(value);
        continue;
      }
      result[key] = sanitizeRecursive(value, depth + 1, maxDepth);
    }

    return result;
  }

  return input;
}

export function sanitizeForLog(input: unknown, options?: RedactionOptions): unknown {
  return sanitizeRecursive(input, 0, options?.maxDepth ?? 4);
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}
