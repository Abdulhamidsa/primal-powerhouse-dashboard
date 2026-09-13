import useSWR, { useSWRConfig } from 'swr';
import {
  getCoachPlans,
  getCoachPlan,
  createPlan,
  updatePlan,
  createPlanDay,
  bulkCreatePlanDays,
  updatePlanDay,
  deletePlanDay,
  saveWeeklyTrainingPattern,
  type WeeklyTrainingPatternDayInput,
} from '../api/coachTraining.api';

export function useCoachPlans() {
  const {
    data,
    error,
    isLoading,
    mutate: mutateLocal,
  } = useSWR('coach-plans', getCoachPlans, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  const createPlanAction = async (input: { name: string; clientId: string; startDate: string; endDate: string }) => {
    const newPlan = await createPlan(input);
    await mutateLocal();
    return newPlan;
  };

  const updatePlanAction = async (
    id: string,
    input: {
      name?: string;
      status?: string;
      endDate?: string;
    },
  ) => {
    const updated = await updatePlan(id, input);
    await mutateLocal();
    return updated;
  };

  return {
    plans: data,
    isLoading,
    isError: !!error,
    error,
    mutate: mutateLocal,
    createPlan: createPlanAction,
    updatePlan: updatePlanAction,
  };
}

export function useCoachPlan(planId?: string) {
  const key = planId ? ['coach-plan', planId] : null;

  const {
    data,
    error,
    isLoading,
    mutate: mutateLocal,
  } = useSWR(key, () => (planId ? getCoachPlan(planId) : null), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return {
    plan: data ?? null,
    isLoading,
    isError: !!error,
    error,
    refresh: () => mutateLocal(undefined, { revalidate: true }),
  };
}

export function useCoachPlanDays(planId?: string) {
  const { mutate } = useSWRConfig();

  const createPlanDayAction = async (data: {
    date: string;
    type: string;
    workoutTemplateId?: string | null;
    title?: string | null;
    note?: string | null;
  }) => {
    if (!planId) throw new Error('Plan ID is required');

    const result = await createPlanDay(planId, data);
    await mutate(
      (key: string | unknown[]) =>
        key === 'coach-plans' || (Array.isArray(key) && key[0] === 'coach-plan' && key[1] === planId),
    );
    return result;
  };

  const updatePlanDayAction = async (
    dayId: string,
    data: {
      type?: string;
      workoutTemplateId?: string | null;
      title?: string | null;
      note?: string | null;
    },
  ) => {
    if (!planId) throw new Error('Plan ID is required');

    const result = await updatePlanDay(planId, dayId, data);
    await mutate(
      (key: string | unknown[]) =>
        key === 'coach-plans' || (Array.isArray(key) && key[0] === 'coach-plan' && key[1] === planId),
    );
    return result;
  };

  const bulkCreatePlanDaysAction = async (data: {
    days: Array<{ date?: string; weekday?: number; type: string; workoutTemplateId?: string | null; title?: string | null; note?: string | null }>;
  }) => {
    if (!planId) throw new Error('Plan ID is required');

    const result = await bulkCreatePlanDays(planId, data);
    await mutate(
      (key: string | unknown[]) =>
        key === 'coach-plans' || (Array.isArray(key) && key[0] === 'coach-plan' && key[1] === planId),
    );
    return result;
  };

  const saveWeeklyPatternAction = async (days: WeeklyTrainingPatternDayInput[]) => {
    if (!planId) throw new Error('Plan ID is required');

    const result = await saveWeeklyTrainingPattern(planId, days);
    await mutate(
      (key: string | unknown[]) =>
        key === 'coach-plans' || (Array.isArray(key) && key[0] === 'coach-plan' && key[1] === planId),
    );
    return result;
  };

  const deletePlanDayAction = async (dayId: string) => {
    if (!planId) throw new Error('Plan ID is required');

    await deletePlanDay(planId, dayId);
    await mutate(
      (key: string | unknown[]) =>
        key === 'coach-plans' || (Array.isArray(key) && key[0] === 'coach-plan' && key[1] === planId),
    );
  };

  return {
    createPlanDay: createPlanDayAction,
    bulkCreatePlanDays: bulkCreatePlanDaysAction,
    saveWeeklyPattern: saveWeeklyPatternAction,
    updatePlanDay: updatePlanDayAction,
    deletePlanDay: deletePlanDayAction,
  };
}
