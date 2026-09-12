import { httpClient } from '@/lib/http/client';
import type {
  MealOptionsResponse,
  MealSelectionResponse,
  SaveMealSelectionInput,
  Adherence,
  GenerateShoppingListResponse,
} from '../types/meals.types';
export const getMealOptions = () => httpClient.get<MealOptionsResponse>('/api/user/meals/options');
export const getMealSelection = () => httpClient.get<MealSelectionResponse>('/api/user/meals/selection');
export const saveMealSelection = (input: SaveMealSelectionInput) =>
  httpClient.send<MealSelectionResponse>('/api/user/meals/selection', 'PUT', input);
export const getAdherence = () => httpClient.get<Adherence>('/api/user/adherence/current');
export const toggleCompletion = (input: unknown, completed: boolean) =>
  httpClient.send('/api/user/meals/completions', completed ? 'DELETE' : 'POST', input);
export const getShoppingList = (input: SaveMealSelectionInput) =>
  httpClient.send<GenerateShoppingListResponse>('/api/user/meals/shopping-list', 'POST', input);
export const saveIntake = (input: unknown) => httpClient.send('/api/user/daily-intake/current', 'PUT', input);
export const resetIntake = (dayDate: string) =>
  httpClient.send(`/api/user/daily-intake/current?dayDate=${encodeURIComponent(dayDate)}`, 'DELETE');
