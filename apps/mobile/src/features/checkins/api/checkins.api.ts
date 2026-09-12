import { httpClient } from '@/lib/http/client';
import type { DailyResponse, WeeklyCheckInCurrentResponse, Insights } from '../types/checkins.types';
export const getDaily = () => httpClient.get<DailyResponse>('/api/user/daily-checkins/current');
export const getWeekly = (week: string) => httpClient.get<WeeklyCheckInCurrentResponse>(`/api/user/weekly-checkins/current?weekStartDate=${week}`);
export const getInsights = () => httpClient.get<Insights>('/api/user/daily-checkins/insights');
export const saveDaily = (dayDate: string, payload: unknown) => httpClient.send('/api/user/daily-checkins/current', 'PUT', { dayDate, payload });
export const saveWeekly = (weekStartDate: string, payload: unknown) => httpClient.send('/api/user/weekly-checkins/current', 'PUT', { weekStartDate, payload });
export const saveNutritionStatus = (input: unknown) => httpClient.send('/api/user/daily-nutrition/current', 'PUT', input);
export const saveTrainingStatus = (input: unknown) => httpClient.send('/api/user/daily-training/current', 'PUT', input);
