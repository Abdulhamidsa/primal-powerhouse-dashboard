'use client';

import { useState } from 'react';
import { usePrivacyActions, usePrivacyCenter } from '@/features/privacy/hooks/usePrivacyCenter';

export function PolicyUpdatePrompt() {
  const { data } = usePrivacyCenter();
  const { acknowledgePolicy } = usePrivacyActions();
  const [pending, setPending] = useState<string | null>(null);

  if (!data?.pendingPolicyAcknowledgements.length) return null;

  async function acknowledge(type: 'TERMS' | 'PRIVACY_POLICY' | 'AI_DISCLOSURE', version: string) {
    setPending(`${type}:${version}`);
    try {
      await acknowledgePolicy({ type, version });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-4" aria-label="Policy updates">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Policy update</p>
        <p className="mt-1 text-sm text-muted-foreground">Please review the current approved document before acknowledging it.</p>
        <div className="mt-3 space-y-2">
          {data.pendingPolicyAcknowledgements.map(document => {
            const key = `${document.type}:${document.version}`;
            const type = document.type;
            if (type !== 'TERMS' && type !== 'PRIVACY_POLICY' && type !== 'AI_DISCLOSURE') return null;
            return (
              <div key={key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <a href={`/legal/${document.slug}`} className="text-primary underline-offset-4 hover:underline">{document.title} · v{document.version}</a>
                <button type="button" onClick={() => acknowledge(type, document.version)} disabled={pending !== null} className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                  {pending === key ? 'Saving…' : 'Acknowledge'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
