'use client';

import { useState } from 'react';
import { useCoachPlans } from '../hooks/useCoachPlans';
import { planStatusEnum } from '../enums/training.enums';
import type { ClientTrainingPlan } from '@prisma/client';
import { useAdminClientsList } from '@/features/admin-clients-dashboard/hooks/useAdminClientsList';

export function PlanManager() {
  const { plans, isLoading, isError, createPlan, updatePlan } = useCoachPlans();
  const { clients, isLoading: isClientsLoading, error: clientsError } = useAdminClientsList();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    clientId: string;
    startDate: string;
    endDate: string;
    status?: string;
  }>({
    name: '',
    clientId: '',
    startDate: '',
    endDate: '',
  });

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenForm = (plan?: ClientTrainingPlan) => {
    if (plan) {
      setEditingId(plan.id);
      const formatDateForInput = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0];
      };
      setFormData({
        name: plan.name,
        clientId: plan.clientId,
        startDate: formatDateForInput(plan.startDate),
        endDate: formatDateForInput(plan.endDate ?? new Date()),
        status: plan.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        clientId: '',
        startDate: '',
        endDate: '',
      });
    }
    setShowForm(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      clientId: '',
      startDate: '',
      endDate: '',
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.clientId || !formData.startDate || !formData.endDate) {
        setError('All fields are required');
        setIsSubmitting(false);
        return;
      }

      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updatePlan(editingId, {
          name: formData.name,
          endDate: formData.endDate,
          status: formData.status,
        });
      } else {
        await createPlan({
          name: formData.name,
          clientId: formData.clientId,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }

      handleCloseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusOptions = planStatusEnum.options;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Client Training Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create the active date windows that weekly patterns repeat inside.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
        >
          Create Plan
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl space-y-4 rounded-[28px] border border-white/10 bg-[var(--color-surface)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-foreground">{editingId ? 'Edit Training Plan' : 'Create Training Plan'}</h2>

            {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Plan name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
                  placeholder="e.g., Strength Block A"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Client *</label>
                <select
                  disabled={!!editingId || isClientsLoading}
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                >
                  <option value="">{isClientsLoading ? 'Loading clients...' : 'Select a client'}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.email ? `(${client.email})` : ''}
                    </option>
                  ))}
                </select>
                {clientsError ? (
                  <p className="mt-1 text-xs text-red-200">Unable to load clients. Please refresh the page.</p>
                ) : null}
                {!isClientsLoading && clients.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">No clients found.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Start Date *</label>
                  <input
                    type="date"
                    disabled={!!editingId}
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
                  <select
                    value={formData.status ?? ''}
                    onChange={e => setFormData({ ...formData, status: e.target.value || undefined })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="">Select status</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-foreground transition-colors hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading plans...</p>}
        {isError && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">Error loading plans. Please try again.</div>
        )}
        {plans && plans.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-muted-foreground">
            No training plans created yet. Create one to get started!
          </div>
        )}

        {plans?.map(plan => (
          <div
            key={plan.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-colors hover:border-white/20"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">Client: {plan.clientId}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(plan.startDate)} - {formatDate(plan.endDate ?? undefined)}
                </p>
                <span className="mt-2 inline-block rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-translucent)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  {plan.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenForm(plan);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.07]"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Days Preview */}
            {expandedPlan === plan.id && (
              <div className="space-y-2 border-t border-white/10 bg-black/10 p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Plan days will be managed in the day assignment view
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
