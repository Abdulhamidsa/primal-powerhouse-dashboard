import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import {
  getCoachPlans,
  createPlan,
  updatePlan,
  createPlanDay,
  updatePlanDay,
  deletePlanDay,
} from '../api/coachTraining.api';
import type { ClientTrainingPlan, TrainingPlanDay } from '@prisma/client';

export function useCoachPlans() {
  const { mutate } = useSWRConfig();
  const key = 'coach-plans';

  const {
    data,
    error,
    isLoading,
    mutate: mutateLocal,
  } = useSWR(key, getCoachPlans, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  const isError = !!error;

  const createPlanAction = async (input: { clientId: string; startDate: string; endDate: string }) => {
    const newPlan = await createPlan(input);
    await mutateLocal();
    return newPlan;
  };

  const updatePlanAction = async (
    id: string,
    input: {
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
    isError,
    error,
    mutate: mutateLocal,
    createPlan: createPlanAction,
    updatePlan: updatePlanAction,
  };
}

export function usePlanDays(planId: string) {
  const key = planId ? ['plan-days', planId] : null;

  // This hook doesn't directly fetch days; they come with the plan
  // But we expose mutations for days
  const { mutate } = useSWRConfig();

  const createPlanDayAction = async (data: { date: string; dayType: string; templateId?: string }) => {
    const result = await createPlanDay(planId, data);
    // Revalidate the plans to refresh
    await mutate('coach-plans');
    return result;
  };

  const updatePlanDayAction = async (
    dayId: string,
    data: {
      dayType?: string;
      templateId?: string | null;
    },
  ) => {
    const result = await updatePlanDay(planId, dayId, data);
    await mutate('coach-plans');
    return result;
  };

  const deletePlanDayAction = async (dayId: string) => {
    await deletePlanDay(planId, dayId);
    await mutate('coach-plans');
  };

  return {
    createPlanDay: createPlanDayAction,
    updatePlanDay: updatePlanDayAction,
    deletePlanDay: deletePlanDayAction,
  };
}
