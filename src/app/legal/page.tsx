import { LegalLinks } from '@/features/legal/components/LegalLinks';

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <section className="mx-auto max-w-3xl space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Primal Powerhouse</p>
        <h1 className="text-3xl font-semibold tracking-tight">Legal and privacy information</h1>
        <p className="leading-7 text-muted-foreground">Review the application’s privacy, storage, health, and service terms.</p>
        <LegalLinks />
      </section>
    </main>
  );
}
