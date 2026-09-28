import { NextResponse } from 'next/server';
import { getAgePolicy } from '@/lib/privacy/age-policy';

export function GET() {
  const policy = getAgePolicy();
  return NextResponse.json({
    enabled: policy.enabled,
    minimumAge: policy.enabled ? policy.minimumAge : null,
    version: policy.enabled ? policy.version : null,
  });
}
