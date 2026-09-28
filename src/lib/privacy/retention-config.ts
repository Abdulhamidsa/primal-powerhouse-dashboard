import defaults from '../../../config/privacy-retention.json';

export const DEFAULT_PRIVACY_RETENTION = defaults;

export type PrivacyRetentionConfig = {
  deletionGraceDays: number;
  exportExpiryHours: number;
  auditRetentionDays: number;
};

type Environment = Record<string, string | undefined>;

function readPositiveInteger(environment: Environment, name: string, fallback: number, required: boolean): number {
  const raw = environment[name]?.trim();
  if (!raw) {
    if (required) throw new Error(`${name} is required in production`);
    return fallback;
  }

  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be a positive integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

export function getPrivacyRetentionConfig(environment: Environment = process.env): PrivacyRetentionConfig {
  const required = environment.NODE_ENV === 'production';
  return {
    deletionGraceDays: readPositiveInteger(environment, 'PRIVACY_DELETION_GRACE_DAYS', DEFAULT_PRIVACY_RETENTION.deletionGraceDays, required),
    exportExpiryHours: readPositiveInteger(environment, 'PRIVACY_EXPORT_EXPIRY_HOURS', DEFAULT_PRIVACY_RETENTION.exportExpiryHours, required),
    auditRetentionDays: readPositiveInteger(environment, 'PRIVACY_AUDIT_RETENTION_DAYS', DEFAULT_PRIVACY_RETENTION.auditRetentionDays, required),
  };
}

export function validatePrivacyRetentionConfig(environment: Environment = process.env): PrivacyRetentionConfig {
  const config = getPrivacyRetentionConfig(environment);
  if (environment.NODE_ENV === 'production') {
    if (config.deletionGraceDays !== DEFAULT_PRIVACY_RETENTION.deletionGraceDays) {
      throw new Error(`PRIVACY_DELETION_GRACE_DAYS must be ${DEFAULT_PRIVACY_RETENTION.deletionGraceDays} in production`);
    }
    if (config.exportExpiryHours !== DEFAULT_PRIVACY_RETENTION.exportExpiryHours) {
      throw new Error(`PRIVACY_EXPORT_EXPIRY_HOURS must be ${DEFAULT_PRIVACY_RETENTION.exportExpiryHours} in production`);
    }
    if (config.auditRetentionDays !== DEFAULT_PRIVACY_RETENTION.auditRetentionDays) {
      throw new Error(`PRIVACY_AUDIT_RETENTION_DAYS must be ${DEFAULT_PRIVACY_RETENTION.auditRetentionDays} in production`);
    }
  }
  return config;
}
