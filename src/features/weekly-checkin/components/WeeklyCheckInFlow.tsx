'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
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

const TOTAL_STEPS = 4;

const SCALE_TEXT: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very high',
};

function clampToFive(value: number | null): number | null {
  if (value == null) return null;

  if (value <= 5) return Math.max(1, Math.min(5, value));

  const mapped = Math.round(value / 2);
  return Math.max(1, Math.min(5, mapped));
}

function SliderScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground">
          {SCALE_TEXT[value]}
        </span>
      </div>
      <input
        className="ios-range"
        max={5}
        min={1}
        onChange={event => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

function numberOrNull(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFormValues(record: ReturnType<typeof useWeeklyCheckInCurrentWeek>['checkIn']): WeeklyCheckInFormValues {
  if (!record) {
    return {
      includeWeight: false,
      weightKg: '',
      waistCm: '',
      trainingAdherence: '',
      nutritionAdherence: '',
      energyRating: 3,
      stressRating: 3,
      hungerRating: 3,
      digestionRating: 3,
      sleepHours: '',
      strengthUpdate: '',
      blockerText: '',
      notes: '',
    };
  }

  return {
    includeWeight: record.weightKg != null,
    weightKg: record.weightKg != null ? String(record.weightKg) : '',
    waistCm: record.waistCm != null ? String(record.waistCm) : '',
    trainingAdherence: String(record.trainingAdherence),
    nutritionAdherence: String(record.nutritionAdherence),
    energyRating: clampToFive(record.energyRating) ?? 3,
    stressRating: clampToFive(record.stressRating) ?? 3,
    hungerRating: clampToFive(record.hungerRating) ?? 3,
    digestionRating: clampToFive(record.digestionRating) ?? 3,
    sleepHours: record.sleepHours != null ? String(record.sleepHours) : '',
    strengthUpdate: record.strengthUpdate ?? '',
    blockerText: record.blockerText ?? '',
    notes: record.notes ?? '',
  };
}

export function WeeklyCheckInFlow() {
  const router = useRouter();
  const { checkIn, weekStartDate, isLoading } = useWeeklyCheckInCurrentWeek();
  const { submit } = useUpsertWeeklyCheckIn();

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

  const canContinueStep1 = true;
  const canContinueStep2 =
    formValues.trainingAdherence.trim().length > 0 &&
    formValues.nutritionAdherence.trim().length > 0 &&
    Number(formValues.trainingAdherence) >= 0 &&
    Number(formValues.trainingAdherence) <= 100 &&
    Number(formValues.nutritionAdherence) >= 0 &&
    Number(formValues.nutritionAdherence) <= 100;
  const canContinueStep3 = true;

  const parsedPayload = useMemo(() => {
    const payload: WeeklyCheckInPayload = {
      weightKg: formValues.includeWeight ? numberOrNull(formValues.weightKg) : null,
      waistCm: numberOrNull(formValues.waistCm),
      trainingAdherence: Number(formValues.trainingAdherence),
      nutritionAdherence: Number(formValues.nutritionAdherence),
      energyRating: formValues.energyRating ?? 0,
      stressRating: formValues.stressRating ?? 0,
      hungerRating: formValues.hungerRating ?? 0,
      digestionRating: formValues.digestionRating ?? 0,
      sleepHours: numberOrNull(formValues.sleepHours),
      strengthUpdate: formValues.strengthUpdate.trim().length > 0 ? formValues.strengthUpdate.trim() : null,
      blockerText: formValues.blockerText.trim().length > 0 ? formValues.blockerText.trim() : null,
      notes: formValues.notes.trim().length > 0 ? formValues.notes.trim() : null,
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

  const nextStep = () => {
    if (step === 1 && !canContinueStep1) return;
    if (step === 2 && !canContinueStep2) return;
    if (step === 3 && !canContinueStep3) return;
    setStep(current => Math.min(TOTAL_STEPS, current + 1));
  };

  const prevStep = () => {
    setStep(current => Math.max(1, current - 1));
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
              <CardDescription>Step {step} of 4 • ~60 sec</CardDescription>
            </div>
            <div className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              Week of {formatDateLabel(new Date(`${weekStartDate}T00:00:00`))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Body Metrics</h2>
                <p className="text-sm text-muted-foreground">Track body feedback in kg/cm.</p>
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
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Waist (cm)</label>
                <Input
                  inputMode="decimal"
                  placeholder="e.g. 90"
                  value={formValues.waistCm}
                  onChange={event => setFormValues(current => ({ ...current, waistCm: event.target.value }))}
                />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Training & Nutrition</h2>
                <p className="text-sm text-muted-foreground">Percent adherence for this week.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Training adherence %</label>
                <Input
                  inputMode="numeric"
                  max="100"
                  min="0"
                  placeholder="0 - 100"
                  type="number"
                  value={formValues.trainingAdherence}
                  onChange={event => setFormValues(current => ({ ...current, trainingAdherence: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nutrition adherence %</label>
                <Input
                  inputMode="numeric"
                  max="100"
                  min="0"
                  placeholder="0 - 100"
                  type="number"
                  value={formValues.nutritionAdherence}
                  onChange={event => setFormValues(current => ({ ...current, nutritionAdherence: event.target.value }))}
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recovery</h2>
                <p className="text-sm text-muted-foreground">Quick readiness and biofeedback scores (1–5).</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Energy rating</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {([1, 2, 3, 4, 5] as const).map(option => {
                    const active = formValues.energyRating === option;

                    return (
                      <button
                        key={option}
                        className={`h-11 rounded-xl border px-3 text-xs font-semibold transition-colors sm:text-[11px] ${
                          active
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border bg-card text-foreground hover:bg-muted/40'
                        }`}
                        onClick={() => setFormValues(current => ({ ...current, energyRating: option }))}
                        type="button"
                      >
                        {SCALE_TEXT[option]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">1 = low energy, 5 = high energy</p>
              </div>

              <SliderScaleField
                label="Stress"
                value={formValues.stressRating ?? 3}
                onChange={value => setFormValues(current => ({ ...current, stressRating: value }))}
              />

              <SliderScaleField
                label="Hunger / Appetite"
                value={formValues.hungerRating ?? 3}
                onChange={value => setFormValues(current => ({ ...current, hungerRating: value }))}
              />

              <SliderScaleField
                label="Digestion quality"
                value={formValues.digestionRating ?? 3}
                onChange={value => setFormValues(current => ({ ...current, digestionRating: value }))}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Average sleep (hours)</label>
                <Input
                  inputMode="decimal"
                  placeholder="e.g. 7.5"
                  value={formValues.sleepHours}
                  onChange={event => setFormValues(current => ({ ...current, sleepHours: event.target.value }))}
                />
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Strength & Notes</h2>
                <p className="text-sm text-muted-foreground">Share one strength highlight and optional reflection.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Strength update</label>
                <textarea
                  className="min-h-[96px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="e.g. Squat felt stronger this week"
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
                  placeholder="Anything your coach should know this week"
                  value={formValues.notes}
                  onChange={event => setFormValues(current => ({ ...current, notes: event.target.value }))}
                />
              </div>

              {!parsedPayload.success && (
                <p className="text-sm text-destructive">
                  {parsedPayload.error.issues[0]?.message ?? 'Please complete required fields.'}
                </p>
              )}
            </section>
          )}

          {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}

          {successMessage && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <Check className="h-4 w-4 text-accent" />
                {successMessage}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={step === 1 ? () => router.push('/user/dashboard') : prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 1 ? 'Back to Dashboard' : 'Previous'}
            </Button>

            <div className="flex items-center gap-2">
              {step < TOTAL_STEPS ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button disabled={submitDisabled} onClick={handleSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Check-In'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="rounded-2xl border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2 text-foreground">
              <Check className="h-5 w-5 text-accent" />
              Check-In Submitted
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {successMessage ?? 'Your weekly check-in has been saved.'}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
