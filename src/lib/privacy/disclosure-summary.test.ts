import { describe, expect, it } from 'vitest';
import { PRIVACY_DISCLOSURE_SUMMARY } from '@/lib/privacy/disclosure-summary';

describe('privacy disclosure summary', () => {
  it('contains only repository-backed provider statuses', () => {
    const providers = new Map(PRIVACY_DISCLOSURE_SUMMARY.providers.map(provider => [provider.name, provider]));

    expect(providers.get('PostgreSQL')?.status).toBe('ACTIVE_CONFIGURED');
    expect(providers.get('Cloudinary')?.status).toBe('ACTIVE_CONFIGURED');
    expect(providers.get('Pusher')?.status).toBe('CODE_ACTIVE_CONFIG_UNKNOWN');
    expect(providers.get('Expo Push')?.status).toBe('CODE_ACTIVE_CONFIG_UNKNOWN');
    expect(providers.get('Open Food Facts')?.status).toBe('LEGACY_OR_INACTIVE');
  });

  it('does not make off-server or vendor contractual claims', () => {
    expect(PRIVACY_DISCLOSURE_SUMMARY.retention.offServerDisasterRecovery).toContain('has been selected');
    expect(PRIVACY_DISCLOSURE_SUMMARY.retention.providerRetention).toContain('require external confirmation');
    expect(PRIVACY_DISCLOSURE_SUMMARY.reviewNotice).toContain('not a legal approval');
  });
});
