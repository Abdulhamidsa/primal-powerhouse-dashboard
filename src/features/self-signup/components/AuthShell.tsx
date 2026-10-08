import type { ReactNode } from 'react';
import Image from 'next/image';
import { LegalLinks } from '@/features/legal/components/LegalLinks';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 12% 8%, var(--color-accent-muted), transparent 30%), radial-gradient(circle at 90% 90%, var(--color-accent-muted), transparent 26%)' }} />

      <div className="relative mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:min-h-[calc(100dvh-4rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-[#101112] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-accent)] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-[var(--color-accent)] opacity-20" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#080909] shadow-[0_0_32px_rgba(196,123,89,0.18)]">
              <Image src="/logo.png" alt="" width={42} height={42} className="h-10 w-10 object-contain" priority />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-white">PRIMAL POWERHOUSE</p>
              <p className="mt-1 text-xs text-white/50">Your next stronger day starts here.</p>
            </div>
          </div>

          <div className="relative mt-auto max-w-md pb-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Built for consistency</p>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white xl:text-5xl">Train with purpose. Live with momentum.</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">Training, nutrition, and progress in one focused space.</p>
          </div>
        </aside>

        <section className="flex items-center bg-card/85 px-5 py-8 backdrop-blur-xl sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#101112] shadow-sm">
                <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" priority />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-foreground">PRIMAL POWERHOUSE</p>
                <p className="mt-1 text-xs text-muted-foreground">Your next stronger day starts here.</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Primal Powerhouse</p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>
            <div className="mt-8 border-t border-border pt-5"><LegalLinks compact /></div>
          </div>
        </section>
      </div>
    </div>
  );
}
