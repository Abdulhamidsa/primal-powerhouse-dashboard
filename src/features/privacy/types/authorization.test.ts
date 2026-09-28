import { describe, expect, it } from 'vitest';
import { canAccessOwnExportJob } from '@/features/privacy/types/authorization.types';

describe('privacy authorization policy', () => {
  it('allows exporting own job', () => {
    expect(canAccessOwnExportJob({ jobClientId: 'client-1', requesterClientId: 'client-1' })).toBe(true);
  });

  it('denies exporting someone else job', () => {
    expect(canAccessOwnExportJob({ jobClientId: 'client-2', requesterClientId: 'client-1' })).toBe(false);
  });
});
