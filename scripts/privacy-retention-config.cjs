const defaults = require('../config/privacy-retention.json');

function readPositiveInteger(environment, name, fallback, required) {
  const raw = typeof environment[name] === 'string' ? environment[name].trim() : '';
  if (!raw) {
    if (required) throw new Error(`${name} is required in production`);
    return fallback;
  }
  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be a positive integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function getPrivacyRetentionConfig(environment = process.env) {
  const required = environment.NODE_ENV === 'production';
  return {
    deletionGraceDays: readPositiveInteger(environment, 'PRIVACY_DELETION_GRACE_DAYS', defaults.deletionGraceDays, required),
    exportExpiryHours: readPositiveInteger(environment, 'PRIVACY_EXPORT_EXPIRY_HOURS', defaults.exportExpiryHours, required),
    auditRetentionDays: readPositiveInteger(environment, 'PRIVACY_AUDIT_RETENTION_DAYS', defaults.auditRetentionDays, required),
  };
}

function validatePrivacyRetentionConfig(environment = process.env) {
  const config = getPrivacyRetentionConfig(environment);
  if (environment.NODE_ENV === 'production') {
    for (const [key, expected] of Object.entries({
      deletionGraceDays: defaults.deletionGraceDays,
      exportExpiryHours: defaults.exportExpiryHours,
      auditRetentionDays: defaults.auditRetentionDays,
    })) {
      if (config[key] !== expected) throw new Error(`${key} must remain ${expected} in production`);
    }
  }
  return config;
}

module.exports = { DEFAULT_PRIVACY_RETENTION: defaults, getPrivacyRetentionConfig, validatePrivacyRetentionConfig };
