import type { ReactNode } from 'react';
import Image from 'next/image';
import { LegalLinks } from '@/features/legal/components/LegalLinks';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 12% 8%, var(--color-accent-muted), transparent 30%), radial-gradient(circle at 90% 90%, var(--color-accent-muted), transparent 26%)' }} />

      <div className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-lg flex-col rounded-[28px] border border-border bg-card/90 px-5 py-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:min-h-[calc(100dvh-4rem)] sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-[#101112] shadow-sm">
            <Image src="/logo.png" alt="" width={34} height={34} className="h-8 w-8 object-contain" priority />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] text-foreground">PRIMAL POWERHOUSE</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Your next stronger day starts here.</p>
          </div>
        </div>

        <section className="mt-8">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Primal Powerhouse</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>

          <div className="mt-7">{children}</div>
        </section>

        <div className="mt-auto border-t border-border pt-5">
          <LegalLinks compact />
        </div>
      </div>
    </main>
  );
}
