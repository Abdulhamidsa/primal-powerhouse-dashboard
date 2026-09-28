import { notFound } from 'next/navigation';
import { LegalLinks } from '@/features/legal/components/LegalLinks';
import { getLegalDocumentBySlug } from '@/features/legal/legal-registry';

export default async function LegalDocumentPage({ params }: { params: Promise<{ document: string }> }) {
  const { document: slug } = await params;
  const legalDocument = getLegalDocumentBySlug(slug);
  if (!legalDocument) notFound();

  const isApproved = legalDocument.publicationStatus === 'APPROVED';

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Primal Powerhouse</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{legalDocument.title}</h1>
          <p className="text-sm text-muted-foreground">
            Version {legalDocument.version}
            {legalDocument.effectiveDate ? ` · Effective ${legalDocument.effectiveDate}` : ''}
          </p>
          {!isApproved ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {legalDocument.publicationStatus === 'DRAFT'
                ? 'Draft — not approved. This document is not used for mandatory acknowledgement.'
                : 'Retired — not current. This document is not used for mandatory acknowledgement.'}
            </p>
          ) : null}
        </header>

        <div className="space-y-7">
          {legalDocument.sections.map(section => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              <p className="whitespace-pre-line leading-7 text-muted-foreground">{section.content}</p>
            </section>
          ))}
        </div>

        <footer className="border-t border-border pt-6">
          <LegalLinks compact />
        </footer>
      </article>
    </main>
  );
}
