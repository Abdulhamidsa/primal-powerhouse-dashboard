'use client';

import { useState } from 'react';
import {
  XIcon as X,
  KeyIcon as KeyRound,
  EnvelopeSimpleIcon as Mail,
  PhoneIcon as Phone,
  CreditCardIcon as CreditCard,
  FileTextIcon as FileText,
  CalendarIcon as Calendar,
  EyeIcon as Eye,
  EyeSlashIcon as EyeOff,
} from '@phosphor-icons/react';
import { LeadStatusBadge } from '@/features/client-leads/components/LeadStatusBadge';
import { getClientLead } from '@/features/client-leads/api/clientLead.api';
import type { ClientLead } from '@/features/client-leads/types/clientLead.types';

type Props = {
  lead: ClientLead;
  onCloseAction: () => void;
};

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="mt-0.5 flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="break-words text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function LeadDetailDrawer({ lead, onCloseAction }: Props) {
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);

  async function handleLoadCredentials() {
    setLoadingCreds(true);
    try {
      const full = await getClientLead(lead.id);
      setCredentials({
        email: full.credentialEmail ?? '',
        password: (full as any).credentialPassword ?? '',
      });
    } finally {
      setLoadingCreds(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onCloseAction} />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full flex-col overflow-hidden border-l border-white/10 bg-zinc-950/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
        style={{
          width: 'min(420px, 100vw)',
        }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Lead profile
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-foreground">{lead.name}</h2>
            <div className="mt-1">
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            className="ml-3 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <X aria-hidden="true" focusable="false" size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Contact info */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
            <div className="space-y-4">
              <Field icon={<Mail aria-hidden="true" focusable="false" size={14} />} label="Email" value={lead.email} />
              <Field icon={<Phone aria-hidden="true" focusable="false" size={14} />} label="Phone" value={lead.phone} />
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Lead info */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Details</h3>
            <div className="space-y-4">
              <Field
                icon={<CreditCard aria-hidden="true" focusable="false" size={14} />}
                label="Subscription Type"
                value={lead.subscriptionType}
              />
              <Field
                icon={<FileText aria-hidden="true" focusable="false" size={14} />}
                label="Notes"
                value={lead.notes}
              />
              <Field
                icon={<Calendar aria-hidden="true" focusable="false" size={14} />}
                label="Added"
                value={new Date(lead.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              />
              {lead.email == null && <p className="text-xs italic text-muted-foreground">No email address recorded.</p>}
              {lead.phone == null && <p className="text-xs italic text-muted-foreground">No phone number recorded.</p>}
            </div>
          </section>

          {/* Credentials — only for CONVERTED leads */}
          {lead.status === 'CONVERTED' && lead.hasCredentials && (
            <>
              <div className="border-t border-white/10" />
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Login Credentials
                </h3>

                {!credentials ? (
                  <button
                    type="button"
                    onClick={handleLoadCredentials}
                    disabled={loadingCreds}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent)] transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    <KeyRound aria-hidden="true" focusable="false" size={14} />
                    {loadingCreds ? 'Loading...' : 'View Credentials'}
                  </button>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-200">
                      Share securely. Do not send via unencrypted channels.
                    </p>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">Email</p>
                      <p className="break-all font-mono text-sm text-foreground">{credentials.email}</p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">Password</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 break-all font-mono text-sm text-foreground">
                          {showPassword ? credentials.password : '••••••••••••'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff aria-hidden="true" focusable="false" size={14} />
                          ) : (
                            <Eye aria-hidden="true" focusable="false" size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onCloseAction}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
