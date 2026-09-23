import { prisma } from '@/lib/prisma';

const MEAL_PLAN_NAME = 'SELF_SERVICE_STARTER_MEAL_PLAN';
const TRAINING_PLAN_NAME = 'SELF_SERVICE_STARTER_TRAINING_PLAN';

export class StarterPlanSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StarterPlanSetupError';
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new StarterPlanSetupError(`Self-service setup is incomplete: ${name} is not configured.`);
  return value;
}

function ensureSelfService(client: { accessMode: string | null }) {
  if (client.accessMode !== 'SELF_SERVICE') return false;
  return true;
}

async function withClientLock<T>(clientId: string, kind: string, work: (tx: any) => Promise<T>): Promise<T> {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`self-service:${kind}:${clientId}`}))`;
    return work(tx);
  }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 20000 });
}

export async function ensureStarterMealPlan(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { accessMode: true } });
  if (!client || !ensureSelfService(client)) return null;

  const sourceClientId = requiredEnv('SELF_SERVICE_STARTER_CLIENT_ID');
  const sourceMealPlanId = requiredEnv('SELF_SERVICE_STARTER_MEAL_PLAN_ID');
  return withClientLock(clientId, 'meal', async tx => {
    const existing = await tx.mealPlan.findFirst({ where: { clientId, name: MEAL_PLAN_NAME, isActive: true } });
    if (existing) return existing;

    const source = await tx.mealPlan.findFirst({
      where: { id: sourceMealPlanId, clientId: sourceClientId, isActive: true },
      include: { client: { select: { id: true, status: true, password: true } }, mealAssignments: { include: { side: true } } },
    });
    if (!source || source.client.status !== 'INACTIVE' || source.client.password !== null) {
      throw new StarterPlanSetupError('Self-service setup is incomplete: the canonical starter client/meal plan is invalid.');
    }

    const plan = await tx.mealPlan.create({ data: { clientId, name: MEAL_PLAN_NAME, startDate: new Date(), endDate: new Date(Date.now() + 27 * 86400000), isActive: true, notes: 'Curated self-service starter plan.' } });
    for (const assignment of source.mealAssignments) {
      const created = await tx.mealAssignment.create({ data: { mealPlanId: plan.id, mealId: assignment.mealId, dayOfWeek: assignment.dayOfWeek, mealType: assignment.mealType, portion: assignment.portion, scheduledTime: assignment.scheduledTime, notes: assignment.notes } });
      if (assignment.side) {
        await tx.sideItem.create({ data: { name: assignment.side.name, type: assignment.side.type, imageUrl: assignment.side.imageUrl, calories: assignment.side.calories, protein: assignment.side.protein, carbs: assignment.side.carbs, fat: assignment.side.fat, fiber: assignment.side.fiber, ingredients: assignment.side.ingredients, spices: assignment.side.spices, instructions: assignment.side.instructions, foodOrigin: assignment.side.foodOrigin, coachId: assignment.side.coachId, clientId, mealAssignmentId: created.id } });
      }
    }
    return plan;
  });
}

export async function ensureStarterTrainingPlan(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { accessMode: true } });
  if (!client || !ensureSelfService(client)) return null;

  const sourceClientId = requiredEnv('SELF_SERVICE_STARTER_CLIENT_ID');
  const sourcePlanId = requiredEnv('SELF_SERVICE_STARTER_TRAINING_PLAN_ID');
  return withClientLock(clientId, 'training', async tx => {
    const existing = await tx.clientTrainingPlan.findFirst({ where: { clientId, name: TRAINING_PLAN_NAME, status: 'ACTIVE' } });
    if (existing) return existing;

    const source = await tx.clientTrainingPlan.findUnique({ where: { id: sourcePlanId }, include: { client: { select: { id: true, status: true, password: true } }, days: true } });
    if (!source || source.clientId !== sourceClientId || source.client.status !== 'INACTIVE' || source.client.password !== null) {
      throw new StarterPlanSetupError('Self-service setup is incomplete: the canonical starter training plan is invalid.');
    }

    const startDate = new Date();
    const plan = await tx.clientTrainingPlan.create({ data: { clientId, coachId: source.coachId, name: TRAINING_PLAN_NAME, description: source.description, status: 'ACTIVE', startDate, endDate: new Date(startDate.getTime() + 27 * 86400000), sourceType: source.sourceType, aiGenerated: false } });
    const sourceStart = source.startDate.getTime();
    for (const day of source.days) {
      const offset = Math.max(0, Math.round((day.date.getTime() - sourceStart) / 86400000));
      await tx.trainingPlanDay.create({ data: { planId: plan.id, date: new Date(startDate.getTime() + offset * 86400000), weekday: day.weekday, type: day.type, workoutTemplateId: day.workoutTemplateId, title: day.title, note: day.note, status: 'PENDING' } });
    }
    return plan;
  });
}

export { MEAL_PLAN_NAME, TRAINING_PLAN_NAME };
