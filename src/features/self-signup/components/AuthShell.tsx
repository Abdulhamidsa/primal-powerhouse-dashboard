import type { ReactNode } from 'react';
import Image from 'next/image';
import { LegalLinks } from '@/features/legal/components/LegalLinks';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-sm flex-col">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Primal Powerhouse" width={42} height={42} className="h-10 w-10 object-contain" priority />
        </div>

        <section className="mt-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}

          <div className="mt-6">{children}</div>
        </section>

        <div className="mt-10 border-t border-border pt-4">
          <LegalLinks compact tone="neutral" />
        </div>
      </div>
    </main>
  );
}
