import { useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { useToday } from '@/features/today/hooks/useToday';
import { useAction, useDraft, useResource } from '@/features/resources/hooks/useResource';
import { useMedia } from '@/features/media/hooks/useMedia';
import { useConnection } from '@/features/resources/hooks/useConnection';
import { uploadPhoto } from '@/features/media/api/media.api';
import * as api from '../api/checkins.api';
import { dailyCheckInPayloadSchema } from '../schemas/checkins.schema';
import type { DailyDraft, WeeklyDraft } from '../types/checkins.types';
import { upsertDailyNutritionSchema } from '@primal/contracts/daily-nutrition/schemas/dailyNutrition.schema';
import { upsertDailyTrainingSchema } from '@primal/contracts/daily-training/schemas/dailyTraining.schema';
import { buildWeightChart } from '../api/weightChart';
import { buildWeeklyCheckInPayload } from '../api/weeklyPayload';
export function useCheckins() {
  const { offline } = useConnection();
  const { width } = useWindowDimensions();
  const today = useToday(); const flags = today.data?.featureVisibility;
  const week = today.data?.weeklyCheckIn.weekStartDate ?? '';
  const daily = useResource(flags?.dailyCheckinsEnabled ? '/api/user/daily-checkins/current' : null, api.getDaily);
  const weekly = useResource(week && flags?.weeklyCheckinsEnabled ? `/api/user/weekly-checkins/current?weekStartDate=${week}` : null, () => api.getWeekly(week));
  const insights = useResource(flags?.weightChartEnabled && flags.dailyWeightEnabled ? '/api/user/daily-checkins/insights' : null, api.getInsights);
  const weightChart = buildWeightChart(insights.data?.history ?? [], Math.min(520, Math.max(240, width - 80)));
  const d = useDraft<DailyDraft>(`daily:${today.data?.dailyCheckIn.dayDate ?? ''}`, { weightKg: '', energy: '', hunger: '', sleep: '', note: '' });
  const w = useDraft<WeeklyDraft>(`weekly:${week}`, { weightKg: '', strengthUpdate: '', blockerText: '', notes: '', progressPhotoFrontUrl: '', progressPhotoSideUrl: '', progressPhotoBackUrl: '' });
  const action = useAction(['/api/user/daily-checkins', '/api/user/weekly-checkins', '/api/user/daily-nutrition', '/api/user/daily-training']); const media = useMedia();
  const loadedDay = useRef(''); const loadedWeek = useRef('');
  useEffect(() => { if (d.ready && daily.data?.entry && loadedDay.current !== daily.data.dayDate) { loadedDay.current = daily.data.dayDate; const e = daily.data.entry; d.setValue(old => Object.values(old).some(Boolean) ? old : { weightKg: e.weightKg?.toString() ?? '', energy: e.energy ?? '', hunger: e.hunger ?? '', sleep: e.sleep ?? '', note: e.note ?? '' }); } }, [daily.data, d.ready]);
  useEffect(() => { if (w.ready && weekly.data?.checkIn && loadedWeek.current !== week) { loadedWeek.current = week; const e = weekly.data.checkIn; w.setValue(old => Object.values(old).some(Boolean) ? old : { weightKg: e.weightKg?.toString() ?? '', strengthUpdate: e.strengthUpdate ?? '', blockerText: e.blockerText ?? '', notes: e.notes ?? '', progressPhotoFrontUrl: e.progressPhotoFrontUrl ?? '', progressPhotoSideUrl: e.progressPhotoSideUrl ?? '', progressPhotoBackUrl: e.progressPhotoBackUrl ?? '' }); } }, [weekly.data, w.ready, week]);
  const refresh = () => Promise.allSettled([today.refresh(), daily.refresh(), weekly.refresh(), insights.refresh()]);
  return { flags, today, daily, weekly, insights, weightChart, d, w, action, media, offline, refresh,
    nutritionStatus: (status: string) => action.run(() => api.saveNutritionStatus(upsertDailyNutritionSchema.parse({ dayDate: daily.data?.dayDate, status }))),
    trainingStatus: (status: string) => action.run(() => api.saveTrainingStatus(upsertDailyTrainingSchema.parse({ dayDate: daily.data?.dayDate, status }))),
    saveDaily: () => action.run(() => api.saveDaily(daily.data!.dayDate, dailyCheckInPayloadSchema.parse({ weightKg: flags?.dailyWeightEnabled && d.value.weightKg ? Number(d.value.weightKg) : undefined, energy: d.value.energy || undefined, hunger: d.value.hunger || undefined, sleep: d.value.sleep || undefined, note: d.value.note }))),
    saveWeekly: () => action.run(async () => {
      if (!flags?.weeklyCheckinsEnabled) throw new Error('Weekly check-ins are not enabled for this account.');
      return api.saveWeekly(week, buildWeeklyCheckInPayload(w.value, flags));
    }),
    photo: (field: 'progressPhotoFrontUrl' | 'progressPhotoSideUrl' | 'progressPhotoBackUrl') => action.run(async () => {
      if (!flags?.weeklyCheckinsEnabled || !flags.progressPhotosEnabled)
        throw new Error('Progress photos are not enabled for this account.');
      const file = await media.pick();
      if (file) {
        const url = await uploadPhoto(file, 'weekly-checkins');
        w.setValue(old => ({ ...old, [field]: url }));
      }
    }),
  };
}
