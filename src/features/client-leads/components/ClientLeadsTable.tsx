'use client';

import { useState } from 'react';
import { Search, Trash2, UserCheck, KeyRound, ChevronDown, Pencil, Eye } from 'lucide-react';
import { LeadStatusBadge } from '@/features/client-leads/components/LeadStatusBadge';
import { useClientLeads } from '@/features/client-leads/hooks/useClientLeads';
import { useUpdateClientLead } from '@/features/client-leads/hooks/useUpdateClientLead';
import { useDeleteClientLead } from '@/features/client-leads/hooks/useDeleteClientLead';
import type { ClientLead, LeadStatus } from '@/features/client-leads/types/clientLead.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getClientLead } from '@/features/client-leads/api/clientLead.api';
import { LeadDetailDrawer } from '@/features/client-leads/components/LeadDetailDrawer';

const ALL_STATUSES: LeadStatus[] = ['CONTACTED', 'HAD_MEETING', 'MADE_DEAL', 'CONVERTED'];

type Props = {
  onConvertAction: (lead: ClientLead) => void;
};

export function ClientLeadsTable({ onConvertAction }: Props) {
  const { filteredLeads, search, setSearch, isLoading } = useClientLeads();
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
        password: (full as any).credentialPassword ?? '',
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
      {/* Search bar */}
      <div className="mb-4 relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden "
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="overflow-x-auto h-screen">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-alt)' }}>
                {['Name', 'Email', 'Phone', 'Status', 'Subscription', 'Notes', 'Added', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No leads yet.
                  </td>
                </tr>
              )}
              {filteredLeads.map((lead, i) => (
                <tr
                  key={lead.id}
                  style={{
                    borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-[var(--color-bg-alt)] transition-colors"
                  onClick={() => setDrawerLead(lead)}
                >
                  {/* Name */}
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                    {lead.name}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {lead.email ?? <span className="opacity-40">—</span>}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {lead.phone ?? <span className="opacity-40">—</span>}
                  </td>

                  {/* Status — inline dropdown toggle */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setStatusDropdownId(statusDropdownId === lead.id ? null : lead.id)}
                        className="flex items-center gap-1 rounded-full transition-opacity hover:opacity-80"
                        disabled={isUpdating}
                      >
                        <LeadStatusBadge status={lead.status} />
                        <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
                      </button>

                      {statusDropdownId === lead.id && (
                        <div
                          className="absolute z-50 mt-1 min-w-[160px] rounded-lg border shadow-lg py-1"
                          style={{
                            background: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            top: '100%',
                            left: 0,
                          }}
                        >
                          {ALL_STATUSES.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleStatusChange(lead.id, s)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:opacity-80 transition-opacity text-left"
                              style={{ color: s === lead.status ? 'var(--color-accent)' : 'var(--color-text)' }}
                            >
                              <LeadStatusBadge status={s} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Subscription */}
                  <td className="px-4 py-3 max-w-[140px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {lead.subscriptionType ?? <span className="opacity-40">—</span>}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {lead.notes ?? <span className="opacity-40">—</span>}
                  </td>

                  {/* Added */}
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(lead.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <button
                        type="button"
                        title="Edit lead"
                        onClick={() => setEditingLead(lead)}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Convert to Client — only when MADE_DEAL */}
                      {lead.status === 'MADE_DEAL' && (
                        <button
                          type="button"
                          title="Convert to Client"
                          onClick={() => onConvertAction(lead)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                          style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(74,222,128)' }}
                        >
                          <UserCheck size={13} />
                          Convert
                        </button>
                      )}

                      {/* View Credentials — only when CONVERTED */}
                      {lead.status === 'CONVERTED' && lead.hasCredentials && (
                        <button
                          type="button"
                          title="View Credentials"
                          onClick={() => handleViewCredentials(lead)}
                          disabled={loadingCredentialsId === lead.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                        >
                          <KeyRound size={13} />
                          {loadingCredentialsId === lead.id ? '...' : 'Credentials'}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        title="Delete lead"
                        onClick={() => setConfirmDeleteId(lead.id)}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'rgb(248,113,113)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onCloseAction={() => setEditingLead(null)}
          onSavedAction={() => setEditingLead(null)}
        />
      )}

      {/* Credentials Display Modal */}
      {credentialsLead && (
        <CredentialsModal credentials={credentialsLead} onCloseAction={() => setCredentialsLead(null)} />
      )}

      {/* Lead Detail Drawer */}
      {drawerLead && <LeadDetailDrawer lead={drawerLead} onCloseAction={() => setDrawerLead(null)} />}

      {/* Lead Detail Drawer */}
      {drawerLead && <LeadDetailDrawer lead={drawerLead} onCloseAction={() => setDrawerLead(null)} />}

      {/* Confirm Delete */}
      {confirmDeleteId && (
        <Dialog open onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent
            className="max-w-sm p-6"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--color-text)' }}>Delete Lead</DialogTitle>
              <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
                This action cannot be undone. The lead record will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ background: 'rgb(239,68,68)', color: '#fff' }}
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

/* ─── Inline edit modal ─── */

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await updateLead(lead.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      subscriptionType: formData.subscriptionType.trim() || null,
      notes: formData.notes.trim() || null,
    });
    if (ok) {
      onSavedAction();
    }
  }

  return (
    <Dialog open onOpenChange={onCloseAction}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Edit Lead
            </DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  {labels[field]}
                </label>
                {isTextarea ? (
                  <textarea
                    value={formData[field]}
                    onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                ) : (
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={formData[field]}
                    onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    style={{
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                )}
              </div>
            );
          })}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Credentials display modal ─── */

function CredentialsModal({
  credentials,
  onCloseAction,
}: {
  credentials: { email: string; password: string; name: string };
  onCloseAction: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <Dialog open onOpenChange={onCloseAction}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>
              Client Credentials
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
              Login credentials for {credentials.name}
            </DialogDescription>
          </DialogHeader>

          <div
            className="mt-4 p-4 rounded-lg border space-y-4"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs text-yellow-500 flex items-start gap-2">
              <KeyRound size={13} className="mt-0.5 flex-shrink-0" />
              Share these credentials securely. Do not send via unencrypted channels.
            </p>

            {[
              { label: 'Email', value: credentials.email, field: 'email' },
              { label: 'Password', value: credentials.password, field: 'password' },
            ].map(({ label, value, field }) => (
              <div key={field}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={value}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-sm font-mono"
                    style={{
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(value, field)}
                    className="p-2 rounded transition-colors"
                    style={{
                      background: copiedField === field ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                      color: copiedField === field ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {copiedField === field ? '✓' : '⧉'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            className="mt-4 w-full px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
