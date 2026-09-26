'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  CheckIcon as Check,
  CircleNotchIcon as Loader2,
  UploadSimpleIcon as Upload,
  XIcon as X,
} from '@phosphor-icons/react';
import { useDailyCheckInInsights } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { WeeklyWeightLivePreview } from '@/features/weekly-checkin/components/WeeklyWeightLivePreview';
import { useWeeklyCheckInPhotoUpload } from '@/features/weekly-checkin/hooks/useWeeklyCheckInPhotoUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { weeklyCheckInPayloadSchema } from '@/features/weekly-checkin/schemas/weeklyCheckIn.schema';
import type {
  WeeklyCheckInFormValues,
  WeeklyCheckInPayload,
} from '@/features/weekly-checkin/types/weeklyCheckIn.types';
import { useUpsertWeeklyCheckIn, useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';
import { formatDateLabel } from '@/features/weekly-checkin/utils/week';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';

// const TOTAL_STEPS = 3;

type PhotoFieldKey = 'progressPhotoFrontUrl' | 'progressPhotoSideUrl' | 'progressPhotoBackUrl';

function numberOrNull(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function currentWeightValue(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFormValues(record: ReturnType<typeof useWeeklyCheckInCurrentWeek>['checkIn']): WeeklyCheckInFormValues {
  if (!record) {
    return {
      includeWeight: false,
      weightKg: '',
      progressPhotoFrontUrl: '',
      progressPhotoSideUrl: '',
      progressPhotoBackUrl: '',
      strengthUpdate: '',
      blockerText: '',
      notes: '',
    };
  }

  return {
    includeWeight: record.weightKg != null,
    weightKg: record.weightKg != null ? String(record.weightKg) : '',
    progressPhotoFrontUrl: record.progressPhotoFrontUrl ?? '',
    progressPhotoSideUrl: record.progressPhotoSideUrl ?? '',
    progressPhotoBackUrl: record.progressPhotoBackUrl ?? '',
    strengthUpdate: record.strengthUpdate ?? '',
    blockerText: record.blockerText ?? '',
    notes: record.notes ?? '',
  };
}

function PhotoUploadTile({
  label,
  value,
  onUpload,
  onClear,
}: {
  label: string;
  value: string;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="space-y-2 rounded-xl border p-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {value ? (
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
            onClick={onClear}
            aria-label={`Remove ${label} photo`}
          >
            <X aria-hidden="true" focusable="false" size={14} />
          </button>
        ) : null}
      </div>

      {value ? (
        <div
          className="relative h-36 w-full overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Image src={value} alt={`${label} progress`} fill className="object-cover" />
        </div>
      ) : (
        <div
          className="flex h-36 items-center justify-center rounded-lg border border-dashed"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No photo uploaded
          </p>
        </div>
      )}

      <label
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {isUploading ? (
          <Loader2 aria-hidden="true" focusable="false" size={14} className="animate-spin" />
        ) : (
          <Upload aria-hidden="true" focusable="false" size={14} />
        )}
        {isUploading ? 'Uploading...' : value ? 'Replace photo' : 'Upload photo'}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={async event => {
            const file = event.target.files?.[0];
            if (!file) return;

            try {
              setIsUploading(true);
              await onUpload(file);
            } finally {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setIsUploading(false);
            }
          }}
        />
      </label>
    </div>
  );
}

export function WeeklyCheckInFlow() {
  const router = useRouter();
  const { checkIn, weekStartDate, isLoading } = useWeeklyCheckInCurrentWeek();
  const { submit } = useUpsertWeeklyCheckIn();
  const { upload } = useWeeklyCheckInPhotoUpload();
  const { history } = useDailyCheckInInsights();
  const { visibility } = useClientSelfFeatureVisibility();

  // Calculate which steps are enabled based on feature visibility
  const enabledSteps = useMemo(() => {
    const steps: Array<'weight' | 'photos' | 'reflection'> = [];
    if (visibility?.weightChartEnabled) steps.push('weight');
    if (visibility?.progressPhotosEnabled) steps.push('photos');
    steps.push('reflection'); // Reflection is always shown
    return steps;
  }, [visibility]);

  const TOTAL_STEPS = enabledSteps.length;

  const lastWeekBaseline = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      if (item.dayDate < today && item.weightKg != null) return item.weightKg;
    }
    return null;
  }, [history]);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<WeeklyCheckInFormValues>(() => toFormValues(checkIn));

  const initialValues = useMemo(() => toFormValues(checkIn), [checkIn]);

  useEffect(() => {
    if (!isLoading) {
      setFormValues(initialValues);
    }
  }, [initialValues, isLoading]);

  const parsedPayload = useMemo(() => {
    const payload: WeeklyCheckInPayload = {
      weightKg: formValues.includeWeight ? numberOrNull(formValues.weightKg) : null,
      progressPhotoFrontUrl: formValues.progressPhotoFrontUrl.trim() || null,
      progressPhotoSideUrl: formValues.progressPhotoSideUrl.trim() || null,
      progressPhotoBackUrl: formValues.progressPhotoBackUrl.trim() || null,
      strengthUpdate: formValues.strengthUpdate.trim() ? formValues.strengthUpdate.trim() : null,
      blockerText: formValues.blockerText.trim() ? formValues.blockerText.trim() : null,
      notes: formValues.notes.trim() ? formValues.notes.trim() : null,
    };

    return weeklyCheckInPayloadSchema.safeParse(payload);
  }, [formValues]);

  const submitDisabled = !parsedPayload.success || isSubmitting;

  useEffect(() => {
    if (!successDialogOpen) return;

    const timeout = window.setTimeout(() => {
      setSuccessDialogOpen(false);
      router.push('/user/dashboard');
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [router, successDialogOpen]);

  const uploadPhoto = async (field: PhotoFieldKey, file: File) => {
    setErrorMessage(null);
    const imageUrl = await upload(file);
    setFormValues(current => ({ ...current, [field]: imageUrl }));
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!parsedPayload.success) {
      setErrorMessage(parsedPayload.error.issues[0]?.message ?? 'Please review your check-in details.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submit(weekStartDate, parsedPayload.data);
      setSuccessMessage(`Saved for week of ${formatDateLabel(new Date(`${weekStartDate}T00:00:00`))}`);
      setSuccessDialogOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save check-in';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
        <div className="h-80 animate-pulse rounded-3xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Weekly Check-In</CardTitle>
              <CardDescription>
                Step {step} of {TOTAL_STEPS} • ~60 sec
              </CardDescription>
            </div>
            <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              Week of {formatDateLabel(new Date(`${weekStartDate}T00:00:00`))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {enabledSteps[step - 1] === 'weight' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Weight Update</h2>
                <p className="text-sm text-muted-foreground">Optional weekly scale check-in.</p>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  checked={formValues.includeWeight}
                  className="h-4 w-4 rounded border-border"
                  onChange={event => setFormValues(current => ({ ...current, includeWeight: event.target.checked }))}
                  type="checkbox"
                />
                Include weight this week
              </label>

              {formValues.includeWeight && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Weight (kg)</label>
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 82.4"
                    value={formValues.weightKg}
                    onChange={event => setFormValues(current => ({ ...current, weightKg: event.target.value }))}
                  />
                  <WeeklyWeightLivePreview
                    lastWeekWeight={lastWeekBaseline}
                    currentWeight={currentWeightValue(formValues.weightKg)}
                  />
                </div>
              )}
            </section>
          )}

          {enabledSteps[step - 1] === 'photos' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Progress Photos</h2>
                <p className="text-sm text-muted-foreground">
                  Upload up to 3 photos so your coach can review visual changes.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <PhotoUploadTile
                  label="Front"
                  value={formValues.progressPhotoFrontUrl}
                  onUpload={file => uploadPhoto('progressPhotoFrontUrl', file)}
                  onClear={() => setFormValues(current => ({ ...current, progressPhotoFrontUrl: '' }))}
                />
                <PhotoUploadTile
                  label="Side"
                  value={formValues.progressPhotoSideUrl}
                  onUpload={file => uploadPhoto('progressPhotoSideUrl', file)}
                  onClear={() => setFormValues(current => ({ ...current, progressPhotoSideUrl: '' }))}
                />
                <PhotoUploadTile
                  label="Back"
                  value={formValues.progressPhotoBackUrl}
                  onUpload={file => uploadPhoto('progressPhotoBackUrl', file)}
                  onClear={() => setFormValues(current => ({ ...current, progressPhotoBackUrl: '' }))}
                />
              </div>
            </section>
          )}

          {enabledSteps[step - 1] === 'reflection' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Weekly Reflection</h2>
                <p className="text-sm text-muted-foreground">
                  Share wins, blockers, and any context your coach should know.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Strength update</label>
                <textarea
                  className="min-h-[96px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="What felt stronger this week?"
                  value={formValues.strengthUpdate}
                  onChange={event => setFormValues(current => ({ ...current, strengthUpdate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Main blocker this week</label>
                <textarea
                  className="min-h-[96px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="What made this week harder than expected?"
                  value={formValues.blockerText}
                  onChange={event => setFormValues(current => ({ ...current, blockerText: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="Any extra context for your coach"
                  value={formValues.notes}
                  onChange={event => setFormValues(current => ({ ...current, notes: event.target.value }))}
                />
              </div>
            </section>
          )}

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(current => Math.max(1, current - 1))}
              disabled={step === 1 || isSubmitting}
            >
              <ArrowLeft aria-hidden="true" focusable="false" className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={() => setStep(current => Math.min(TOTAL_STEPS, current + 1))}
                disabled={isSubmitting}
              >
                Next
                <ArrowRight aria-hidden="true" focusable="false" className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" focusable="false" className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check aria-hidden="true" focusable="false" className="mr-2 h-4 w-4" />
                    Submit check-in
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Weekly check-in saved</DialogTitle>
            <DialogDescription>{successMessage ?? 'Your coach can now review this update.'}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
