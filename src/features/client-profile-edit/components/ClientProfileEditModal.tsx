'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { clientProfileEditFormSchema } from '@/features/client-profile-edit/schemas/clientProfileEdit.schema';
import { useClientProfileEdit } from '@/features/client-profile-edit/hooks/useClientProfileEdit';
import type {
  ClientProfileEditFieldErrors,
  ClientProfileEditFormValues,
  ClientProfileEditResponse,
} from '@/features/client-profile-edit/types/clientProfileEdit.types';

interface ClientProfileEditModalProps {
  isOpen: boolean;
  clientId: string;
  initialValues: {
    name: string;
    age?: number | null;
    gender?: 'MALE' | 'FEMALE' | null;
    activityLevel?: 'LOW' | 'MODERATE' | 'HIGH' | null;
    height?: number | null;
    currentWeight?: number | null;
    targetWeight?: number | null;
  };
  onCloseAction: () => void;
  onSavedAction: (client: ClientProfileEditResponse) => void;
}

function parseMetric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseAge(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return Number.NaN;
  return parsed;
}

export function ClientProfileEditModal({
  isOpen,
  clientId,
  initialValues,
  onCloseAction,
  onSavedAction,
}: ClientProfileEditModalProps) {
  const [formValues, setFormValues] = useState<ClientProfileEditFormValues>({
    name: initialValues.name,
    age: initialValues.age ?? null,
    gender: initialValues.gender ?? null,
    activityLevel: initialValues.activityLevel ?? null,
    height: initialValues.height ?? null,
    currentWeight: initialValues.currentWeight ?? null,
    targetWeight: initialValues.targetWeight ?? null,
  });
  const [fieldErrors, setFieldErrors] = useState<ClientProfileEditFieldErrors>({});

  const { submit, isSubmitting, error } = useClientProfileEdit(clientId);

  useEffect(() => {
    if (!isOpen) return;
    setFormValues({
      name: initialValues.name,
      age: initialValues.age ?? null,
      gender: initialValues.gender ?? null,
      activityLevel: initialValues.activityLevel ?? null,
      height: initialValues.height ?? null,
      currentWeight: initialValues.currentWeight ?? null,
      targetWeight: initialValues.targetWeight ?? null,
    });
    setFieldErrors({});
  }, [initialValues, isOpen]);

  const hasChanges = useMemo(() => {
    return (
      formValues.name !== initialValues.name ||
      (formValues.age ?? null) !== (initialValues.age ?? null) ||
      (formValues.gender ?? null) !== (initialValues.gender ?? null) ||
      (formValues.activityLevel ?? null) !== (initialValues.activityLevel ?? null) ||
      (formValues.height ?? null) !== (initialValues.height ?? null) ||
      (formValues.currentWeight ?? null) !== (initialValues.currentWeight ?? null) ||
      (formValues.targetWeight ?? null) !== (initialValues.targetWeight ?? null)
    );
  }, [formValues, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = clientProfileEditFormSchema.safeParse(formValues);
    if (!parsed.success) {
      const nextErrors: ClientProfileEditFieldErrors = {};
      const flattened = parsed.error.flatten().fieldErrors;
      if (flattened.name?.[0]) nextErrors.name = flattened.name[0];
      if (flattened.age?.[0]) nextErrors.age = flattened.age[0];
      if (flattened.gender?.[0]) nextErrors.gender = flattened.gender[0];
      if (flattened.activityLevel?.[0]) nextErrors.activityLevel = flattened.activityLevel[0];
      if (flattened.height?.[0]) nextErrors.height = flattened.height[0];
      if (flattened.currentWeight?.[0]) nextErrors.currentWeight = flattened.currentWeight[0];
      if (flattened.targetWeight?.[0]) nextErrors.targetWeight = flattened.targetWeight[0];
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    const result = await submit(parsed.data);
    onSavedAction(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Edit Client Profile</h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="client-name" className="mb-1 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="client-name"
              value={formValues.name}
              onChange={event => setFormValues(prev => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Client name"
            />
            {fieldErrors.name ? <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="client-age" className="mb-1 block text-sm font-medium text-foreground">
                Age
              </label>
              <input
                id="client-age"
                value={formValues.age ?? ''}
                onChange={event => setFormValues(prev => ({ ...prev, age: parseAge(event.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                inputMode="numeric"
                placeholder="e.g. 28"
              />
              {fieldErrors.age ? <p className="mt-1 text-xs text-destructive">{fieldErrors.age}</p> : null}
            </div>

            <div>
              <label htmlFor="client-gender" className="mb-1 block text-sm font-medium text-foreground">
                Gender
              </label>
              <select
                id="client-gender"
                value={formValues.gender ?? ''}
                onChange={event =>
                  setFormValues(prev => ({
                    ...prev,
                    gender: event.target.value ? (event.target.value as 'MALE' | 'FEMALE') : null,
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {fieldErrors.gender ? <p className="mt-1 text-xs text-destructive">{fieldErrors.gender}</p> : null}
            </div>

            <div>
              <label htmlFor="client-activity" className="mb-1 block text-sm font-medium text-foreground">
                Activity Level
              </label>
              <select
                id="client-activity"
                value={formValues.activityLevel ?? ''}
                onChange={event =>
                  setFormValues(prev => ({
                    ...prev,
                    activityLevel: event.target.value ? (event.target.value as 'LOW' | 'MODERATE' | 'HIGH') : null,
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select activity</option>
                <option value="LOW">Low</option>
                <option value="MODERATE">Moderate</option>
                <option value="HIGH">High</option>
              </select>
              {fieldErrors.activityLevel ? (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.activityLevel}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="client-height" className="mb-1 block text-sm font-medium text-foreground">
                Height (cm)
              </label>
              <input
                id="client-height"
                value={formValues.height ?? ''}
                onChange={event => setFormValues(prev => ({ ...prev, height: parseMetric(event.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                inputMode="decimal"
                placeholder="e.g. 178"
              />
              {fieldErrors.height ? <p className="mt-1 text-xs text-destructive">{fieldErrors.height}</p> : null}
            </div>

            <div>
              <label htmlFor="client-current-weight" className="mb-1 block text-sm font-medium text-foreground">
                Current (kg)
              </label>
              <input
                id="client-current-weight"
                value={formValues.currentWeight ?? ''}
                onChange={event => setFormValues(prev => ({ ...prev, currentWeight: parseMetric(event.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                inputMode="decimal"
                placeholder="e.g. 85"
              />
              {fieldErrors.currentWeight ? (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.currentWeight}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="client-target-weight" className="mb-1 block text-sm font-medium text-foreground">
                Target (kg)
              </label>
              <input
                id="client-target-weight"
                value={formValues.targetWeight ?? ''}
                onChange={event => setFormValues(prev => ({ ...prev, targetWeight: parseMetric(event.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                inputMode="decimal"
                placeholder="e.g. 78"
              />
              {fieldErrors.targetWeight ? (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.targetWeight}</p>
              ) : null}
            </div>
          </div>

          {error?.message ? (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error.message}</div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCloseAction}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
