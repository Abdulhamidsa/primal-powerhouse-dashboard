import { httpClient } from '@/lib/http/client';
import type {
  CreateSideInput,
  GenerateSideInput,
  GeneratedSideTemplate,
  SideItem,
} from '@/features/sides/types/side.types';

export async function listSides(): Promise<SideItem[]> {
  return httpClient.get<SideItem[]>('/api/sides');
}

export async function createSide(payload: CreateSideInput): Promise<SideItem> {
  return httpClient.post<SideItem>('/api/sides', payload);
}

export async function generateSide(payload: GenerateSideInput): Promise<SideItem> {
  return httpClient.post<SideItem>('/api/sides/generate', payload);
}

export async function generateSideTemplate(payload: GenerateSideInput): Promise<GeneratedSideTemplate> {
  return httpClient.post<GeneratedSideTemplate>('/api/sides/generate-template', payload);
}
