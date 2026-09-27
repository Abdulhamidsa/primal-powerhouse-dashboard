import type { Prisma } from '@prisma/client';

export const clientListSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  avatar: true,
  status: true,
  accessMode: true,
  notes: true,
  currentWeight: true,
  targetWeight: true,
  updatedAt: true,
  deletionScheduledFor: true,
  deactivatedAt: true,
} satisfies Prisma.ClientSelect;

export type ClientListRecord = Prisma.ClientGetPayload<{ select: typeof clientListSelect }>;

export const clientProfileReadSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  phone: true,
  avatar: true,
  status: true,
  accessMode: true,
  age: true,
  gender: true,
  activityLevel: true,
  height: true,
  currentWeight: true,
  targetWeight: true,
  goals: true,
  dietaryRestrictions: true,
  notes: true,
  sessionsCompleted: true,
  goalCalories: true,
  goalMacros: true,
  motivationalMessage: true,
  progressPhotos: true,
  updatedAt: true,
  deletionScheduledFor: true,
  deactivatedAt: true,
  coachId: true,
  phoneEncrypted: true,
  goalsEncrypted: true,
  dietaryRestrictionsEncrypted: true,
  notesEncrypted: true,
  motivationalMessageEncrypted: true,
} satisfies Prisma.ClientSelect;

export type ClientProfileReadRecord = Prisma.ClientGetPayload<{ select: typeof clientProfileReadSelect }>;

type ClientListResponseValues = Pick<
  ClientListRecord,
  | 'id'
  | 'name'
  | 'email'
  | 'username'
  | 'avatar'
  | 'status'
  | 'accessMode'
  | 'notes'
  | 'currentWeight'
  | 'targetWeight'
  | 'updatedAt'
  | 'deletionScheduledFor'
  | 'deactivatedAt'
> & {
  goals?: string[];
  dietaryRestrictions?: string[];
  progressPhotos?: string[];
};

export function toClientListResponse(client: ClientListResponseValues, isSystemTemplate = false) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    username: client.username,
    avatar: client.avatar,
    status: client.status,
    accessMode: client.accessMode,
    isSystemTemplate,
    notes: client.notes,
    currentWeight: client.currentWeight,
    targetWeight: client.targetWeight,
    updatedAt: client.updatedAt,
    deletionScheduledFor: client.deletionScheduledFor,
    deactivatedAt: client.deactivatedAt,
    ...(client.goals ? { goals: client.goals } : {}),
    ...(client.dietaryRestrictions ? { dietaryRestrictions: client.dietaryRestrictions } : {}),
    ...(client.progressPhotos ? { progressPhotos: client.progressPhotos } : {}),
  };
}

export type ClientDetailResponseValues = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  avatar: string | null;
  status: ClientProfileReadRecord['status'];
  accessMode: ClientProfileReadRecord['accessMode'];
  age: number | null;
  gender: ClientProfileReadRecord['gender'];
  activityLevel: ClientProfileReadRecord['activityLevel'];
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  goals: string[];
  dietaryRestrictions: string[];
  notes: string | null;
  sessionsCompleted: number;
  goalCalories: number | null;
  goalMacros: string | null;
  motivationalMessage: string | null;
  deletionScheduledFor: Date | null;
  deactivatedAt: Date | null;
  updatedAt: Date;
  progressPhotos?: string[];
};

export function toClientDetailResponse(client: ClientDetailResponseValues, isSystemTemplate = false) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    username: client.username,
    phone: client.phone,
    avatar: client.avatar,
    status: client.status,
    accessMode: client.accessMode,
    isSystemTemplate,
    age: client.age,
    gender: client.gender,
    activityLevel: client.activityLevel,
    height: client.height,
    currentWeight: client.currentWeight,
    targetWeight: client.targetWeight,
    goals: client.goals,
    dietaryRestrictions: client.dietaryRestrictions,
    notes: client.notes,
    sessionsCompleted: client.sessionsCompleted,
    goalCalories: client.goalCalories,
    goalMacros: client.goalMacros,
    motivationalMessage: client.motivationalMessage,
    ...(client.progressPhotos ? { progressPhotos: client.progressPhotos } : {}),
    deletionScheduledFor: client.deletionScheduledFor,
    deactivatedAt: client.deactivatedAt,
    updatedAt: client.updatedAt,
  };
}

export function toClientCreatedResponse(client: Pick<ClientProfileReadRecord, 'id' | 'name' | 'email' | 'gender'>) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    gender: client.gender,
  };
}

export function parseJsonStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
