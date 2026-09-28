import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createNotification } from './notification.service';

type NotificationChannel = 'IN_APP' | 'PUSH';

type TrainingDayLike = {
  weekday: number | null;
  type: string;
  workoutTemplateId: string | null;
  title: string | null;
  note: string | null;
};

type MealPlanLike = {
  id: string;
  clientId: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  notes: string | null;
  mealAssignments: Array<{
    dayOfWeek: number;
    mealType: string;
    mealId: string;
    portion: number;
    scheduledTime?: string | null;
    notes: string | null;
    side?: { id: string } | null;
  }>;
};

async function coachClientChannels(clientId: string): Promise<NotificationChannel[]> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      consentMessageNotifications: true,
      notificationPreference: { select: { coachMessagePushEnabled: true } },
    },
  });

  const pushEnabled = client?.notificationPreference?.coachMessagePushEnabled ?? client?.consentMessageNotifications;
  return pushEnabled ? ['IN_APP', 'PUSH'] : ['IN_APP'];
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}

function normalizeTrainingDays(days: TrainingDayLike[]) {
  return [...days]
    .sort((a, b) => (a.weekday ?? -1) - (b.weekday ?? -1))
    .map(day => ({
      weekday: day.weekday,
      type: day.type,
      workoutTemplateId: day.workoutTemplateId,
      title: day.title?.trim() ?? null,
      note: day.note?.trim() ?? null,
    }));
}

function normalizeMealPlan(plan: MealPlanLike) {
  return {
    name: plan.name.trim(),
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate?.toISOString() ?? null,
    isActive: plan.isActive,
    notes: plan.notes?.trim() ?? null,
    mealAssignments: [...plan.mealAssignments]
      .sort((a, b) => `${a.dayOfWeek}:${a.mealType}:${a.mealId}`.localeCompare(`${b.dayOfWeek}:${b.mealType}:${b.mealId}`))
      .map(assignment => ({
        dayOfWeek: assignment.dayOfWeek,
        mealType: assignment.mealType,
        mealId: assignment.mealId,
        portion: assignment.portion,
        scheduledTime: assignment.scheduledTime ?? null,
        notes: assignment.notes?.trim() ?? null,
        sideId: assignment.side?.id ?? null,
      })),
  };
}

export async function notifyCoachMessage(input: {
  clientId: string;
  messageId: string;
  conversationId: string;
  senderName: string;
  body?: string | null;
  hasAttachment?: boolean;
}) {
  const preview = input.body?.trim() ?? '';
  const body = preview ? (preview.length > 160 ? `${preview.slice(0, 160)}…` : preview) : 'You have an update from your coach.';

  return createNotification({
    recipientClientId: input.clientId,
    title: input.senderName,
    body,
    category: 'message',
    actionUrl: `/user/chat?conversationId=${encodeURIComponent(input.conversationId)}`,
    metadata: { conversationId: input.conversationId, messageId: input.messageId, hasAttachment: Boolean(input.hasAttachment) },
    channels: ['IN_APP'],
    source: 'coach-message',
    sourceId: input.messageId,
    dedupeKey: `coach-message:${input.messageId}`,
  });
}

export async function notifyTrainingPlanAssigned(clientId: string, planId: string) {
  return createNotification({
    recipientClientId: clientId,
    title: 'New training plan',
    body: 'Your coach assigned you a new training plan.',
    category: 'training-plan',
    actionUrl: '/user/training',
    metadata: { planId },
    channels: await coachClientChannels(clientId),
    source: 'training-plan-assigned',
    sourceId: planId,
    dedupeKey: `training-plan-assigned:${planId}`,
  });
}

export async function notifyTrainingPlanUpdated(clientId: string, planId: string, days: TrainingDayLike[]) {
  const fingerprint = hash(normalizeTrainingDays(days));
  return createNotification({
    recipientClientId: clientId,
    title: 'Training plan updated',
    body: 'Your coach made changes to your training plan.',
    category: 'training-plan',
    actionUrl: '/user/training',
    metadata: { planId, fingerprint },
    channels: await coachClientChannels(clientId),
    source: 'training-plan-updated',
    sourceId: planId,
    dedupeKey: `training-plan-updated:${planId}:${fingerprint}`,
  });
}

export async function notifyMealPlanPublished(clientId: string, planId: string) {
  return createNotification({
    recipientClientId: clientId,
    title: 'New meal plan',
    body: 'Your coach published a new meal plan for you.',
    category: 'meal-plan',
    actionUrl: '/user/my-plan',
    metadata: { planId },
    channels: await coachClientChannels(clientId),
    source: 'meal-plan-published',
    sourceId: planId,
    dedupeKey: `meal-plan-published:${planId}`,
  });
}

export async function notifyMealPlanUpdated(clientId: string, plan: MealPlanLike, previousPlan: MealPlanLike) {
  const nextFingerprint = hash(normalizeMealPlan(plan));
  if (hash(normalizeMealPlan(previousPlan)) === nextFingerprint) return null;

  return createNotification({
    recipientClientId: clientId,
    title: 'Meal plan updated',
    body: 'Your coach made changes to your meal plan.',
    category: 'meal-plan',
    actionUrl: '/user/my-plan',
    metadata: { planId: plan.id, fingerprint: nextFingerprint },
    channels: await coachClientChannels(clientId),
    source: 'meal-plan-updated',
    sourceId: plan.id,
    dedupeKey: `meal-plan-updated:${plan.id}:${nextFingerprint}`,
  });
}

export async function notifyWeeklyCheckInReviewed(clientId: string, checkInId: string) {
  return createNotification({
    recipientClientId: clientId,
    title: 'Weekly check-in reviewed',
    body: 'Your coach reviewed your weekly check-in.',
    category: 'check-in',
    actionUrl: '/user/check-ins',
    metadata: { checkInId },
    channels: await coachClientChannels(clientId),
    source: 'weekly-checkin-reviewed',
    sourceId: checkInId,
    dedupeKey: `weekly-checkin-reviewed:${checkInId}`,
  });
}

export async function notifyMotivationalMessageUpdated(clientId: string, message: string) {
  const normalized = message.trim();
  return createNotification({
    recipientClientId: clientId,
    title: 'A message from your coach',
    body: normalized,
    category: 'motivational-message',
    actionUrl: '/user/dashboard',
    metadata: { clientId },
    channels: ['IN_APP'],
    source: 'motivational-message',
    sourceId: clientId,
    dedupeKey: `motivational-message:${clientId}:${hash(normalized)}`,
  });
}
