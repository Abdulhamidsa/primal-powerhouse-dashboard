'use client';

import { useState } from 'react';
import { X, KeyRound, Mail, Phone, CreditCard, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
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
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className="text-sm break-words" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
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
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onCloseAction}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: 'min(420px, 100vw)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>
              {lead.name}
            </h2>
            <div className="mt-1">
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            className="p-2 rounded-lg flex-shrink-0 ml-3 transition-opacity hover:opacity-70"
            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Contact info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Contact
            </h3>
            <div className="space-y-4">
              <Field icon={<Mail size={14} />} label="Email" value={lead.email} />
              <Field icon={<Phone size={14} />} label="Phone" value={lead.phone} />
            </div>
          </section>

          <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

          {/* Lead info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Lead Details
            </h3>
            <div className="space-y-4">
              <Field icon={<CreditCard size={14} />} label="Subscription Type" value={lead.subscriptionType} />
              <Field icon={<FileText size={14} />} label="Notes" value={lead.notes} />
              <Field
                icon={<Calendar size={14} />}
                label="Added"
                value={new Date(lead.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              />
              {lead.email == null && (
                <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  No email address recorded.
                </p>
              )}
              {lead.phone == null && (
                <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  No phone number recorded.
                </p>
              )}
            </div>
          </section>

          {/* Credentials — only for CONVERTED leads */}
          {lead.status === 'CONVERTED' && lead.hasCredentials && (
            <>
              <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Login Credentials
                </h3>

                {!credentials ? (
                  <button
                    type="button"
                    onClick={handleLoadCredentials}
                    disabled={loadingCreds}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
                  >
                    <KeyRound size={14} />
                    {loadingCreds ? 'Loading...' : 'View Credentials'}
                  </button>
                ) : (
                  <div
                    className="rounded-lg border p-4 space-y-3"
                    style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                  >
                    <p className="text-xs" style={{ color: 'rgb(234,179,8)' }}>
                      Share securely. Do not send via unencrypted channels.
                    </p>

                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Email</p>
                      <p className="text-sm font-mono break-all" style={{ color: 'var(--color-text)' }}>
                        {credentials.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Password</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono flex-1 break-all" style={{ color: 'var(--color-text)' }}>
                          {showPassword ? credentials.password : '••••••••••••'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="p-1.5 rounded transition-opacity hover:opacity-70"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            onClick={onCloseAction}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
