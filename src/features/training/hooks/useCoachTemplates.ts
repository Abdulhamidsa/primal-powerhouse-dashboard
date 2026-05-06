import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import {
  getCoachTemplates,
  getCoachTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../api/coachTraining.api';
import type { CreateWorkoutTemplateInput, UpdateWorkoutTemplateInput } from '../schemas/template.schemas';
import type { WorkoutTemplate } from '@prisma/client';

export function useCoachTemplates() {
  const { mutate } = useSWRConfig();
  const key = 'coach-templates';

  const { data, error, isLoading, mutate: mutateLocal } = useSWR(key, getCoachTemplates, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  const isError = !!error;

  const createTemplateAction = async (input: CreateWorkoutTemplateInput) => {
    const newTemplate = await createTemplate(input);
    await mutateLocal();
    return newTemplate;
  };

  const updateTemplateAction = async (id: string, input: UpdateWorkoutTemplateInput) => {
    const updated = await updateTemplate(id, input);
    await mutateLocal();
    return updated;
  };

  const deleteTemplateAction = async (id: string) => {
    await deleteTemplate(id);
    await mutateLocal();
  };

  return {
    templates: data,
    isLoading,
    isError,
    error,
    mutate: mutateLocal,
    createTemplate: createTemplateAction,
    updateTemplate: updateTemplateAction,
    deleteTemplate: deleteTemplateAction,
  };
}

export function useCoachTemplate(id: string) {
  const key = id ? ['coach-template', id] : null;

  const { data, error, isLoading, mutate } = useSWR(key, () => (id ? getCoachTemplate(id) : null), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return {
    template: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
