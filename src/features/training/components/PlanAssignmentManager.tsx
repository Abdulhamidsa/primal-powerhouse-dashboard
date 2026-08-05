'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCoachPlans, useCoachPlanDays } from '../hooks/useCoachPlans';
import { useCoachTemplates } from '../hooks/useCoachTemplates';
import { trainingDayTypeEnum } from '../enums/training.enums';
import type { ClientTrainingPlanWithDays } from '../types';

type DayFormState = {
  date: string;
  type: 'WORKOUT' | 'REST';
  workoutTemplateId: string;
  title: string;
  note: string;
};

const emptyDayForm = (date = ''): DayFormState => ({
  date,
  type: 'WORKOUT',
  workoutTemplateId: '',
  title: '',
  note: '',
});

function toDateInputValue(value: string | Date) {
  if (typeof value === 'string') return value.slice(0, 10);
  const date = value;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

function formatDisplayDate(value: string | Date) {
  const date = new Date(`${toDateInputValue(value)}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateInputValue(date);
}

export function PlanAssignmentManager() {
  const { plans, isLoading: plansLoading, isError: plansError } = useCoachPlans();
  const { templates, isLoading: templatesLoading, isError: templatesError } = useCoachTemplates();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState<DayFormState>(emptyDayForm());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [weekDays, setWeekDays] = useState<Array<{ type: 'WORKOUT' | 'REST'; workoutTemplateId: string }>>(
    Array.from({ length: 7 }, () => ({ type: 'REST', workoutTemplateId: '' })),
  );

  const planDaysActions = useCoachPlanDays(selectedPlanId || undefined);
  const plansWithDetails = useMemo(() => (plans ?? []) as ClientTrainingPlanWithDays[], [plans]);
  const selectedPlan = useMemo(
    () => plansWithDetails.find(plan => plan.id === selectedPlanId) ?? null,
    [plansWithDetails, selectedPlanId],
  );
  const selectedPlanDays = selectedPlan?.days ?? [];
  const selectedPlanTemplateOptions = templates ?? [];

  useEffect(() => {
    if (selectedPlanId || plansWithDetails.length === 0) return;
    setSelectedPlanId(plansWithDetails[0].id);
  }, [plansWithDetails, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlan) return;
    setEditingDayId(null);
    setDayForm(emptyDayForm(toDateInputValue(selectedPlan.startDate)));
    setError(null);
    setWeekStart(toDateInputValue(selectedPlan.startDate));
  }, [selectedPlan]);

  useEffect(() => {
    if (!selectedPlan || !weekStart) return;
    setWeekDays(Array.from({ length: 7 }, (_, index) => {
      const existing = selectedPlan.days.find(day => toDateInputValue(day.date) === addDays(weekStart, index));
      return { type: existing?.type ?? 'REST', workoutTemplateId: existing?.workoutTemplateId ?? '' };
    }));
  }, [selectedPlan, weekStart]);

  const resetForm = () => {
    setEditingDayId(null);
    setDayForm(emptyDayForm(selectedPlan ? toDateInputValue(selectedPlan.startDate) : ''));
    setError(null);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setEditingDayId(null);
    const nextPlan = plansWithDetails.find(plan => plan.id === planId) ?? null;
    setDayForm(emptyDayForm(nextPlan ? toDateInputValue(nextPlan.startDate) : ''));
    setError(null);
    setWeekStart(nextPlan ? toDateInputValue(nextPlan.startDate) : '');
  };

  const handleSaveWeek = async () => {
    if (!selectedPlanId || !weekStart) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await planDaysActions.bulkCreatePlanDays({
        days: weekDays.map((day, index) => ({
          date: addDays(weekStart, index),
          type: day.type,
          workoutTemplateId: day.type === 'WORKOUT' ? day.workoutTemplateId || null : null,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the week');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDay = (day: ClientTrainingPlanWithDays['days'][number]) => {
    setEditingDayId(day.id);
    setDayForm({
      date: toDateInputValue(day.date),
      type: day.type,
      workoutTemplateId: day.workoutTemplateId ?? '',
      title: day.title ?? '',
      note: day.note ?? '',
    });
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!selectedPlanId) {
      setError('Select a training plan first.');
      return;
    }

    if (!dayForm.date) {
      setError('Choose a date for the plan day.');
      return;
    }

    if (dayForm.type === trainingDayTypeEnum.enum.WORKOUT && !dayForm.workoutTemplateId) {
      setError('Choose a workout template for workout days.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        date: dayForm.date,
        type: dayForm.type,
        workoutTemplateId: dayForm.type === 'WORKOUT' ? dayForm.workoutTemplateId || null : null,
        title: dayForm.title.trim() || null,
        note: dayForm.note.trim() || null,
      };

      if (editingDayId) {
        await planDaysActions.updatePlanDay(editingDayId, payload);
      } else {
        await planDaysActions.createPlanDay(payload);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan day');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Delete this plan day?')) return;

    try {
      setError(null);
      await planDaysActions.deletePlanDay(dayId);
      if (editingDayId === dayId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan day');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assign Training Days</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pick a client plan, then assign workout templates to the individual days in that plan.
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
                  {plan.name} {plan.client?.name ? `• ${plan.client.name}` : `• ${plan.clientId}`}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
              <p>Client: {selectedPlan.client?.name ?? selectedPlan.clientId}</p>
              <p>
                Range: {formatDisplayDate(selectedPlan.startDate)}
                {selectedPlan.endDate ? ` - ${formatDisplayDate(selectedPlan.endDate)}` : ''}
              </p>
              <p>Status: {selectedPlan.status}</p>
              <p>Days: {selectedPlan.days.length}</p>
            </div>
          ) : null}

          {plansError ? <p className="text-sm text-red-600">Failed to load training plans.</p> : null}
        </aside>

        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Weekly schedule</h2>
                <p className="text-sm text-gray-500">Quickly prepare seven dated days. Existing dates stay unchanged.</p>
              </div>
              <label className="text-sm font-medium text-gray-700">Week starting
                <input type="date" value={weekStart} onChange={event => setWeekStart(event.target.value)} className="ml-2 rounded-lg border border-gray-300 px-3 py-2 font-normal" />
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {weekDays.map((day, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-900">{weekStart ? formatDisplayDate(addDays(weekStart, index)) : `Day ${index + 1}`}</p>
                  <select value={day.type} onChange={event => setWeekDays(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as 'WORKOUT' | 'REST', workoutTemplateId: event.target.value === 'REST' ? '' : item.workoutTemplateId } : item))} className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs">
                    <option value="WORKOUT">Workout</option><option value="REST">Rest</option>
                  </select>
                  {day.type === 'WORKOUT' ? <select value={day.workoutTemplateId} onChange={event => setWeekDays(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, workoutTemplateId: event.target.value } : item))} className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs">
                    <option value="">Choose template</option>{selectedPlanTemplateOptions.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                  </select> : <p className="mt-2 text-xs text-gray-500">Recovery day</p>}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleSaveWeek} disabled={isSubmitting || !selectedPlanId || !weekStart || weekDays.some(day => day.type === 'WORKOUT' && !day.workoutTemplateId)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Saving week...' : 'Save week'}</button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{editingDayId ? 'Edit Plan Day' : 'Add Plan Day'}</h2>
                <p className="text-sm text-gray-500">
                  {editingDayId
                    ? 'Change the day type, template, title, or note.'
                    : 'Create a new day and attach a workout template when the day type is WORKOUT.'}
                </p>
              </div>
              {editingDayId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={dayForm.date}
                  onChange={e => setDayForm({ ...dayForm, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day type *</label>
                <select
                  value={dayForm.type}
                  onChange={e =>
                    setDayForm({
                      ...dayForm,
                      type: e.target.value as DayFormState['type'],
                      workoutTemplateId: e.target.value === 'WORKOUT' ? dayForm.workoutTemplateId : '',
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WORKOUT">Workout</option>
                  <option value="REST">Rest</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template {dayForm.type === 'WORKOUT' ? '*' : ''}
                </label>
                <select
                  value={dayForm.workoutTemplateId}
                  onChange={e => setDayForm({ ...dayForm, workoutTemplateId: e.target.value })}
                  disabled={dayForm.type !== 'WORKOUT' || templatesLoading}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">{templatesLoading ? 'Loading templates...' : 'No template selected'}</option>
                  {selectedPlanTemplateOptions.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {templatesError ? <p className="mt-1 text-xs text-red-600">Failed to load templates.</p> : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={dayForm.title}
                  onChange={e => setDayForm({ ...dayForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional label for the day"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={dayForm.note}
                  onChange={e => setDayForm({ ...dayForm, note: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional coaching note"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPlanId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDayId ? 'Update day' : 'Add day'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Plan Days</h2>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                {selectedPlanDays.length} day{selectedPlanDays.length === 1 ? '' : 's'}
              </span>
            </div>

            {!selectedPlan ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                Choose a training plan to see and assign its days.
              </div>
            ) : selectedPlanDays.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                No days assigned yet. Use the form above to add the first day.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedPlanDays.map(day => (
                  <div key={day.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{formatDisplayDate(day.date)}</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                            {day.type}
                          </span>
                          {day.workoutTemplate ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {day.workoutTemplate.name}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-gray-700">{day.title ?? 'Untitled day'}</p>
                        <p className="text-sm text-gray-500">
                          {day.note ?? (day.type === 'WORKOUT' ? 'Workout day with no note yet.' : 'Rest day.')}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditDay(day)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDay(day.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
