import { describe, expect, it } from 'vitest';
import { PRIVACY_DISCLOSURE_SUMMARY } from '@/lib/privacy/disclosure-summary';

describe('privacy disclosure summary', () => {
  it('contains only repository-backed provider statuses', () => {
    const providers = new Map(PRIVACY_DISCLOSURE_SUMMARY.providers.map(provider => [provider.name, provider]));

    expect(providers.get('PostgreSQL')?.status).toBe('ACTIVE_CONFIGURED');
    expect(providers.get('Cloudinary')?.status).toBe('ACTIVE_CONFIGURED');
    expect(providers.get('Pusher')?.status).toBe('CODE_ACTIVE_CONFIG_UNKNOWN');
    expect(providers.get('Pusher')?.purpose).toContain('Web production is currently unconfigured and inactive');
    expect(providers.get('Pusher')?.purpose).toContain('polling/revalidation continue without it');
    expect(providers.get('Pusher')?.purpose).not.toContain('Realtime messaging and notification events.');
    expect(providers.get('Resend')?.status).toBe('ACTIVE_CONFIGURED');
    expect(providers.get('Resend')?.purpose).toContain('primalpowerhouse.com');
    expect(providers.get('Resend')?.purpose).toContain('Ireland (eu-west-1)');
    expect(providers.get('Resend')?.purpose).toContain('Primary processing: United States');
    expect(providers.get('Resend')?.purpose).toContain('signed DPA');
    expect(providers.get('Resend')?.purpose).toContain('Tracking metrics are not configured');
    expect(providers.get('Resend')?.purpose).not.toContain('Ireland is the primary processing');
    expect(providers.get('Expo Push')?.status).toBe('CODE_ACTIVE_CONFIG_UNKNOWN');
    expect(providers.get('Open Food Facts')?.status).toBe('LEGACY_OR_INACTIVE');
  });

  it('does not make off-server or vendor contractual claims', () => {
    expect(PRIVACY_DISCLOSURE_SUMMARY.retention.offServerDisasterRecovery).toContain('has been selected');
    expect(PRIVACY_DISCLOSURE_SUMMARY.retention.providerRetention).toContain('require external confirmation');
    expect(PRIVACY_DISCLOSURE_SUMMARY.reviewNotice).toContain('not a legal approval');
  });
});
