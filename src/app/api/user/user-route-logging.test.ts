import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeFiles = [
  'src/app/api/user/videos/route.ts',
  'src/app/api/user/videos/today/route.ts',
  'src/app/api/user/videos/[id]/route.ts',
  'src/app/api/user/videos/[id]/complete/route.ts',
  'src/app/api/user/meals/route.ts',
  'src/app/api/user/meals/today/route.ts',
  'src/app/api/user/dashboard/summary/route.ts',
  'src/app/api/user/meals/summary/route.ts',
  'src/app/api/user/feedback/route.ts',
  'src/app/api/user-dashboard/videos/[assignmentId]/complete/route.ts',
];

function readRoute(routeFile: string): string {
  return readFileSync(resolve(process.cwd(), routeFile), 'utf8');
}

describe('user route logging privacy regression', () => {
  it('does not retain verbose auth-result or personal identity logging', () => {
    const source = routeFiles.map(readRoute).join('\n');

    expect(source).not.toMatch(/Auth result for (user videos|videos|all meals|meals)/i);
    expect(source).not.toMatch(/(?:User videos API called|Today videos API called|User all meals API called|Today meals API called)/i);
    expect(source).not.toMatch(/console\.(?:log|info|warn|error)\([^\n]*(?:userId|email|issuedAtMs|authenticatedAt|\biat\s*:|\bexp\s*:)/i);
    expect(source).not.toMatch(/console\.(?:log|info|warn|error)\([^\n]*(?:\{\s*error\s*,\s*user|\buser\s*\})/i);
  });

  it('uses sanitized error logging for touched route failures', () => {
    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile);
      expect(source, routeFile).toContain("from '@/lib/security/log-redaction'");
      expect(source, routeFile).toContain('safeErrorMessage');
    }
  });
});
