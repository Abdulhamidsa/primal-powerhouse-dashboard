'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCoachPlans, useCoachPlanDays } from '../hooks/useCoachPlans';
import { useCoachTemplates } from '../hooks/useCoachTemplates';
import type { ClientTrainingPlanWithDays } from '../types';

type WeekdayFormState = {
  weekday: number;
  type: 'WORKOUT' | 'REST';
  workoutTemplateId: string;
  title: string;
  note: string;
};

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function emptyWeek(): WeekdayFormState[] {
  return weekdays.map((_, weekday) => ({
    weekday,
    type: 'REST',
    workoutTemplateId: '',
    title: '',
    note: '',
  }));
}

function formatDisplayDate(value: string | Date | null | undefined) {
  if (!value) return 'Open ended';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function weekdayFromDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function PlanAssignmentManager() {
  const { plans, isLoading: plansLoading, isError: plansError } = useCoachPlans();
  const { templates, isLoading: templatesLoading, isError: templatesError } = useCoachTemplates();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [week, setWeek] = useState<WeekdayFormState[]>(emptyWeek);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planDaysActions = useCoachPlanDays(selectedPlanId || undefined);
  const plansWithDetails = useMemo(() => (plans ?? []) as ClientTrainingPlanWithDays[], [plans]);
  const selectedPlan = useMemo(
    () => plansWithDetails.find(plan => plan.id === selectedPlanId) ?? null,
    [plansWithDetails, selectedPlanId],
  );
  const selectedPlanTemplateOptions = templates ?? [];

  useEffect(() => {
    if (selectedPlanId || plansWithDetails.length === 0) return;
    setSelectedPlanId(plansWithDetails[0].id);
  }, [plansWithDetails, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlan) {
      setWeek(emptyWeek());
      return;
    }

    const nextWeek = emptyWeek();
    for (const day of selectedPlan.days) {
      const weekday = typeof day.weekday === 'number' ? day.weekday : weekdayFromDate(day.date);
      if (weekday < 0 || weekday > 6) continue;
      nextWeek[weekday] = {
        weekday,
        type: day.type,
        workoutTemplateId: day.workoutTemplateId ?? '',
        title: day.title ?? '',
        note: day.note ?? '',
      };
    }

    setWeek(nextWeek);
    setError(null);
  }, [selectedPlan]);

  const updateWeekday = (weekday: number, patch: Partial<WeekdayFormState>) => {
    setWeek(previous =>
      previous.map(day => {
        if (day.weekday !== weekday) return day;
        const next = { ...day, ...patch };
        if (next.type === 'REST') next.workoutTemplateId = '';
        return next;
      }),
    );
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setError(null);
  };

  const handleSaveWeek = async () => {
    if (!selectedPlanId) return;

    const missingTemplate = week.find(day => day.type === 'WORKOUT' && !day.workoutTemplateId);
    if (missingTemplate) {
      setError(`Choose a workout template for ${weekdays[missingTemplate.weekday]}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await planDaysActions.saveWeeklyPattern(
        week.map(day => ({
          weekday: day.weekday,
          type: day.type,
          workoutTemplateId: day.type === 'WORKOUT' ? day.workoutTemplateId : null,
          title: day.title.trim() || null,
          note: day.note.trim() || null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save weekly training pattern');
    } finally {
      setIsSubmitting(false);
    }
  };

  const workoutCount = week.filter(day => day.type === 'WORKOUT').length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Training Pattern</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pick a client plan, then assign workout templates to Monday through Sunday. The pattern repeats while the plan is active.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training plan</label>
            <select
              value={selectedPlanId}
              onChange={e => handleSelectPlan(e.target.value)}
              disabled={plansLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{plansLoading ? 'Loading plans...' : 'Select a plan'}</option>
              {plansWithDetails.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} {plan.client?.name ? `- ${plan.client.name}` : `- ${plan.clientId}`}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
              <p>Client: {selectedPlan.client?.name ?? selectedPlan.clientId}</p>
              <p>
                Active: {formatDisplayDate(selectedPlan.startDate)}
                {selectedPlan.endDate ? ` - ${formatDisplayDate(selectedPlan.endDate)}` : ''}
              </p>
              <p>Status: {selectedPlan.status}</p>
              <p>Weekly workouts: {workoutCount}</p>
            </div>
          ) : null}

          {plansError ? <p className="text-sm text-red-600">Failed to load training plans.</p> : null}
          {templatesError ? <p className="text-sm text-red-600">Failed to load workout templates.</p> : null}
        </aside>

        <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Monday to Sunday</h2>
              <p className="text-sm text-gray-500">Changes apply to future workouts. Completed sessions stay in history.</p>
            </div>
            <button
              type="button"
              onClick={handleSaveWeek}
              disabled={isSubmitting || !selectedPlanId || week.some(day => day.type === 'WORKOUT' && !day.workoutTemplateId)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save weekly pattern'}
            </button>
          </div>

          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          {!selectedPlan ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              Choose a training plan to configure its weekly pattern.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {week.map(day => (
                <div key={day.weekday} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">{weekdays[day.weekday]}</h3>
                    <select
                      value={day.type}
                      onChange={event => updateWeekday(day.weekday, { type: event.target.value as WeekdayFormState['type'] })}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                    >
                      <option value="WORKOUT">Workout</option>
                      <option value="REST">Rest</option>
                    </select>
                  </div>

                  <select
                    value={day.workoutTemplateId}
                    onChange={event => updateWeekday(day.weekday, { workoutTemplateId: event.target.value })}
                    disabled={day.type !== 'WORKOUT' || templatesLoading}
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm disabled:bg-gray-100"
                  >
                    <option value="">{templatesLoading ? 'Loading templates...' : day.type === 'REST' ? 'Recovery day' : 'Choose template'}</option>
                    {selectedPlanTemplateOptions.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={day.title}
                    onChange={event => updateWeekday(day.weekday, { title: event.target.value })}
                    placeholder="Optional title"
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                  />

                  <textarea
                    value={day.note}
                    onChange={event => updateWeekday(day.weekday, { note: event.target.value })}
                    placeholder={day.type === 'REST' ? 'Optional recovery note' : 'Optional coaching note'}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
