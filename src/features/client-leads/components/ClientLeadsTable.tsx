'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon as Calendar, CaretDownIcon as ChevronDown, FileTextIcon as FileText, HandshakeIcon as Handshake, KeyIcon as KeyRound, EnvelopeSimpleIcon as Mail, PencilIcon as Pencil, PhoneIcon as Phone, MagnifyingGlassIcon as Search, TrashIcon as Trash2, UserCheckIcon as UserCheck, UsersIcon as Users } from '@phosphor-icons/react';
import type { ElementType, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeadDetailDrawer } from '@/features/client-leads/components/LeadDetailDrawer';
import { LeadStatusBadge } from '@/features/client-leads/components/LeadStatusBadge';
import { getClientLead } from '@/features/client-leads/api/clientLead.api';
import { useClientLeads } from '@/features/client-leads/hooks/useClientLeads';
import { useDeleteClientLead } from '@/features/client-leads/hooks/useDeleteClientLead';
import { useUpdateClientLead } from '@/features/client-leads/hooks/useUpdateClientLead';
import type { ClientLead, LeadStatus } from '@/features/client-leads/types/clientLead.types';

const ALL_STATUSES: LeadStatus[] = ['CONTACTED', 'HAD_MEETING', 'MADE_DEAL', 'CONVERTED'];

const STATUS_META: Record<LeadStatus, { title: string; description: string }> = {
  CONTACTED: { title: 'Contacted', description: 'New conversations and first-touch follow-ups.' },
  HAD_MEETING: { title: 'Had Meeting', description: 'Prospects who completed a consultation.' },
  MADE_DEAL: { title: 'Made Deal', description: 'Ready to convert into coaching clients.' },
  CONVERTED: { title: 'Converted', description: 'Leads already turned into client accounts.' },
};

type Props = {
  onConvertAction: (lead: ClientLead) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function PipelineStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
}) {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
        <Icon size={18} />
      </div>
    </div>
  );
}

function StatusPicker({
  lead,
  open,
  disabled,
  onToggleAction,
  onChangeAction,
}: {
  lead: ClientLead;
  open: boolean;
  disabled: boolean;
  onToggleAction: () => void;
  onChangeAction: (status: LeadStatus) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onToggleAction();
        }}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        <LeadStatusBadge status={lead.status} />
        <ChevronDown aria-hidden="true" focusable="false" size={12} className="text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.35rem)] z-30 min-w-[170px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 py-1 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {ALL_STATUSES.map(status => (
            <button
              key={status}
              type="button"
              onClick={event => {
                event.stopPropagation();
                onChangeAction(status);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
            >
              <LeadStatusBadge status={status} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LeadCard({
  lead,
  statusDropdownOpen,
  loadingCredentials,
  isUpdating,
  onOpenAction,
  onEditAction,
  onDeleteAction,
  onConvertAction,
  onCredentialsAction,
  onStatusToggleAction,
  onStatusChangeAction,
}: {
  lead: ClientLead;
  statusDropdownOpen: boolean;
  loadingCredentials: boolean;
  isUpdating: boolean;
  onOpenAction: () => void;
  onEditAction: () => void;
  onDeleteAction: () => void;
  onConvertAction: () => void;
  onCredentialsAction: () => void;
  onStatusToggleAction: () => void;
  onStatusChangeAction: (status: LeadStatus) => void;
}) {
  return (
    <article
      onClick={onOpenAction}
      className="group cursor-pointer rounded-[22px] border border-white/10 bg-black/18 p-4 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.045]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-[var(--color-accent)]">
          {getInitials(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{lead.name}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">{lead.subscriptionType || 'No subscription type'}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        {lead.email ? (
          <p className="flex items-center gap-2 truncate">
            <Mail aria-hidden="true" focusable="false" size={13} className="shrink-0" />
            {lead.email}
          </p>
        ) : null}
        {lead.phone ? (
          <p className="flex items-center gap-2 truncate">
            <Phone aria-hidden="true" focusable="false" size={13} className="shrink-0" />
            {lead.phone}
          </p>
        ) : null}
        <p className="flex items-center gap-2">
          <Calendar aria-hidden="true" focusable="false" size={13} className="shrink-0" />
          Added {formatDate(lead.createdAt)}
        </p>
        {lead.notes ? (
          <p className="flex items-start gap-2">
            <FileText aria-hidden="true" focusable="false" size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{lead.notes}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
        <StatusPicker
          lead={lead}
          open={statusDropdownOpen}
          disabled={isUpdating}
          onToggleAction={onStatusToggleAction}
          onChangeAction={onStatusChangeAction}
        />
        <div className="flex items-center gap-1.5" onClick={event => event.stopPropagation()}>
          <button
            type="button"
            title="Edit lead"
            onClick={onEditAction}
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <Pencil aria-hidden="true" focusable="false" size={14} />
          </button>
          {lead.status === 'MADE_DEAL' ? (
            <button
              type="button"
              title="Convert to client"
              onClick={onConvertAction}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15"
            >
              <UserCheck aria-hidden="true" focusable="false" size={13} />
              Convert
            </button>
          ) : null}
          {lead.status === 'CONVERTED' && lead.hasCredentials ? (
            <button
              type="button"
              title="View credentials"
              onClick={onCredentialsAction}
              disabled={loadingCredentials}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)] px-2.5 text-xs font-semibold text-[var(--color-accent)] transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              <KeyRound aria-hidden="true" focusable="false" size={13} />
              {loadingCredentials ? '...' : 'Keys'}
            </button>
          ) : null}
          <button
            type="button"
            title="Delete lead"
            onClick={onDeleteAction}
            className="grid h-8 w-8 place-items-center rounded-xl border border-red-500/15 bg-red-500/5 text-red-300 transition-colors hover:bg-red-500/10"
          >
            <Trash2 aria-hidden="true" focusable="false" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ClientLeadsTable({ onConvertAction }: Props) {
  const { filteredLeads, leads, search, setSearch, isLoading } = useClientLeads();
  const { updateLead, isLoading: isUpdating } = useUpdateClientLead();
  const { deleteLead, isLoading: isDeleting } = useDeleteClientLead();

  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<ClientLead | null>(null);
  const [credentialsLead, setCredentialsLead] = useState<{ email: string; password: string; name: string } | null>(
    null,
  );
  const [loadingCredentialsId, setLoadingCredentialsId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [drawerLead, setDrawerLead] = useState<ClientLead | null>(null);

  const groupedLeads = useMemo(
    () =>
      ALL_STATUSES.reduce(
        (acc, status) => {
          acc[status] = filteredLeads.filter(lead => lead.status === status);
          return acc;
        },
        {} as Record<LeadStatus, ClientLead[]>,
      ),
    [filteredLeads],
  );

  const counts = useMemo(
    () =>
      ALL_STATUSES.reduce(
        (acc, status) => {
          acc[status] = leads.filter(lead => lead.status === status).length;
          return acc;
        },
        {} as Record<LeadStatus, number>,
      ),
    [leads],
  );

  async function handleStatusChange(id: string, status: LeadStatus) {
    setStatusDropdownId(null);
    await updateLead(id, { status });
  }

  async function handleViewCredentials(lead: ClientLead) {
    setLoadingCredentialsId(lead.id);
    try {
      const full = await getClientLead(lead.id);
      setCredentialsLead({
        email: full.credentialEmail ?? '',
        password: (full as { credentialPassword?: string | null }).credentialPassword ?? '',
        name: full.name,
      });
    } finally {
      setLoadingCredentialsId(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteLead(id);
    setConfirmDeleteId(null);
  }

  return (
    <>
      <div className="space-y-5 p-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <PipelineStat label="Total leads" value={leads.length} icon={Users} />
          <PipelineStat label="Contacted" value={counts.CONTACTED} icon={Mail} />
          <PipelineStat label="Meetings" value={counts.HAD_MEETING} icon={Calendar} />
          <PipelineStat label="Deals made" value={counts.MADE_DEAL} icon={Handshake} />
          <PipelineStat label="Converted" value={counts.CONVERTED} icon={UserCheck} />
        </section>

        <div className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pipeline search</h3>
            <p className="mt-1 text-xs text-muted-foreground">Find prospects by name, email, or phone.</p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search aria-hidden="true" focusable="false" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search leads..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--color-accent)]/45 focus:bg-black/30"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {ALL_STATUSES.map(status => (
              <div key={status} className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.025] p-3">
                <div className="h-5 w-1/2 animate-pulse rounded-full bg-white/[0.07]" />
                {[0, 1, 2].map(item => (
                  <div key={item} className="h-36 animate-pulse rounded-[22px] bg-white/[0.055]" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {ALL_STATUSES.map(status => (
              <section key={status} className="flex min-h-[420px] flex-col rounded-[24px] border border-white/10 bg-white/[0.025]">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{STATUS_META[status].title}</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{STATUS_META[status].description}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {groupedLeads[status].length}
                    </span>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                  {groupedLeads[status].length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-black/12 px-4 text-center">
                      <p className="text-xs leading-5 text-muted-foreground">
                        {search ? 'No leads match this search in this stage.' : 'No leads in this stage yet.'}
                      </p>
                    </div>
                  ) : (
                    groupedLeads[status].map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        statusDropdownOpen={statusDropdownId === lead.id}
                        loadingCredentials={loadingCredentialsId === lead.id}
                        isUpdating={isUpdating}
                        onOpenAction={() => setDrawerLead(lead)}
                        onEditAction={() => setEditingLead(lead)}
                        onDeleteAction={() => setConfirmDeleteId(lead.id)}
                        onConvertAction={() => onConvertAction(lead)}
                        onCredentialsAction={() => handleViewCredentials(lead)}
                        onStatusToggleAction={() => setStatusDropdownId(statusDropdownId === lead.id ? null : lead.id)}
                        onStatusChangeAction={nextStatus => handleStatusChange(lead.id, nextStatus)}
                      />
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onCloseAction={() => setEditingLead(null)}
          onSavedAction={() => setEditingLead(null)}
        />
      )}

      {credentialsLead && (
        <CredentialsModal credentials={credentialsLead} onCloseAction={() => setCredentialsLead(null)} />
      )}

      {drawerLead && <LeadDetailDrawer lead={drawerLead} onCloseAction={() => setDrawerLead(null)} />}

      {confirmDeleteId && (
        <Dialog open onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent className="max-w-md overflow-hidden rounded-[28px] border border-red-500/20 bg-zinc-950/95 p-0 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="border-b border-white/10 px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">Delete lead?</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                  This action cannot be undone. The lead record will be permanently removed.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex gap-3 px-6 py-5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

type EditLeadModalProps = {
  lead: ClientLead;
  onCloseAction: () => void;
  onSavedAction: () => void;
};

function EditLeadModal({ lead, onCloseAction, onSavedAction }: EditLeadModalProps) {
  const { updateLead, isLoading } = useUpdateClientLead();
  const [formData, setFormData] = useState({
    name: lead.name,
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    subscriptionType: lead.subscriptionType ?? '',
    notes: lead.notes ?? '',
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await updateLead(lead.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      subscriptionType: formData.subscriptionType.trim() || null,
      notes: formData.notes.trim() || null,
    });
    if (ok) onSavedAction();
  }

  return (
    <Dialog open onOpenChange={onCloseAction}>
      <DialogContent className="max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/95 p-0 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">Edit Lead</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {(['name', 'email', 'phone', 'subscriptionType', 'notes'] as const).map(field => {
            const labels: Record<string, string> = {
              name: 'Full Name',
              email: 'Email',
              phone: 'Phone',
              subscriptionType: 'Subscription Type',
              notes: 'Notes',
            };
            const isTextarea = field === 'notes';
            return (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{labels[field]}</label>
                {isTextarea ? (
                  <textarea
                    value={formData[field]}
                    onChange={event => setFormData(previous => ({ ...previous, [field]: event.target.value }))}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45"
                  />
                ) : (
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={formData[field]}
                    onChange={event => setFormData(previous => ({ ...previous, [field]: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--color-accent)]/45"
                  />
                )}
              </div>
            );
          })}
          <div className="flex gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsModal({
  credentials,
  onCloseAction,
}: {
  credentials: { email: string; password: string; name: string };
  onCloseAction: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleCopy(text: string, field: string) {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <Dialog open onOpenChange={onCloseAction}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/95 p-0 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">Client Credentials</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Login credentials for {credentials.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-200">
            Share securely. Do not send credentials through unencrypted channels.
          </div>

          {[
            { label: 'Email', value: credentials.email, field: 'email' },
            { label: 'Password', value: credentials.password, field: 'password' },
          ].map(({ label, value, field }) => (
            <div key={field}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={value}
                  readOnly
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 font-mono text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(value, field)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                >
                  {copiedField === field ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onCloseAction}
            className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-text-on-accent)]"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
