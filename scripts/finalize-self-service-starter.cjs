const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SOURCE_EMAIL = 'starter-template-setup@primal.local';
const RESERVED_EMAIL = 'starter-template@primal.local';
const dryRun = process.argv.includes('--dry-run');

function fail(message) {
  throw new Error(message);
}

function printPlans(label, plans) {
  if (plans.length === 0) {
    console.log(`${label}: none found`);
    return;
  }
  for (const plan of plans) console.log(`${label}: ${plan.id} (${plan.name})`);
}

async function main() {
  const matches = await prisma.client.findMany({
    where: { email: SOURCE_EMAIL },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      status: true,
      signupSource: true,
      accessMode: true,
      mealPlans: { select: { id: true, name: true, isActive: true } },
      trainingPlans: { select: { id: true, name: true, status: true } },
    },
  });

  if (matches.length !== 1) {
    fail(`Expected exactly one client with ${SOURCE_EMAIL}; found ${matches.length}. No changes made.`);
  }
  const client = matches[0];

  const reserved = await prisma.client.findUnique({
    where: { email: RESERVED_EMAIL },
    select: { id: true },
  });
  if (reserved && reserved.id !== client.id) {
    fail(`Reserved email ${RESERVED_EMAIL} is already used by another client (${reserved.id}). No changes made.`);
  }

  if (client.signupSource !== 'ADMIN_CREATED') {
    fail(`Client ${client.id} is not admin-created (signupSource=${client.signupSource}). No changes made.`);
  }
  if (!/starter|template|system/i.test(client.name || '')) {
    fail(`Client name does not identify a starter/template record (${client.name}). No changes made.`);
  }

  const [authIdentities, conversationsWithMessages, dailyCheckIns, weeklyCheckIns, sessions, mobileSessions,
    workoutSessions, trainingSessions, mealCompletions, dailyNutritionLogs, dailyTrainingLogs,
    healthMetrics, workouts, feedback, pushSubscriptions] = await Promise.all([
    prisma.clientAuthIdentity.count({ where: { clientId: client.id } }),
    prisma.conversation.findMany({
      where: { clientId: client.id },
      select: { _count: { select: { messages: true } } },
    }),
    prisma.dailyCheckIn.count({ where: { clientId: client.id } }),
    prisma.weeklyCheckIn.count({ where: { clientId: client.id } }),
    prisma.session.count({ where: { clientId: client.id } }),
    prisma.mobileSession.count({ where: { clientId: client.id } }),
    prisma.workoutSession.count({ where: { clientId: client.id } }),
    prisma.trainingSession.count({ where: { clientId: client.id } }),
    prisma.mealCompletion.count({ where: { clientId: client.id } }),
    prisma.dailyNutritionLog.count({ where: { clientId: client.id } }),
    prisma.dailyTrainingLog.count({ where: { clientId: client.id } }),
    prisma.healthMetric.count({ where: { clientId: client.id } }),
    prisma.workout.count({ where: { clientId: client.id } }),
    prisma.feedback.count({ where: { clientId: client.id } }),
    prisma.pushSubscription.count({ where: { clientId: client.id } }),
  ]);
  const activity = {
    authIdentities,
    conversations: conversationsWithMessages.filter((conversation) => conversation._count.messages > 0).length,
    dailyCheckIns, weeklyCheckIns, sessions, mobileSessions,
    workoutSessions, trainingSessions, mealCompletions, dailyNutritionLogs, dailyTrainingLogs,
    healthMetrics, workouts, feedback, pushSubscriptions,
  };
  const activeRecords = Object.entries(activity).filter(([, count]) => count > 0);
  if (activeRecords.length) {
    fail(`Client has user activity (${activeRecords.map(([key, count]) => `${key}=${count}`).join(', ')}). No changes made.`);
  }

  const mealPlans = client.mealPlans.filter((plan) => plan.isActive);
  const trainingPlans = client.trainingPlans;

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Verified starter template client ${client.id}.`);
  printPlans('Active meal plan', mealPlans);
  printPlans('Training plan', trainingPlans);

  if (!dryRun) {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        name: 'SYSTEM TEMPLATE — 4 Week Starter',
        email: RESERVED_EMAIL,
        status: 'INACTIVE',
        password: null,
        accessMode: 'SELF_SERVICE',
      },
    });
    console.log('Starter template client finalized. Meal and training plans were not modified.');
  }

  console.log(`SELF_SERVICE_STARTER_CLIENT_ID=${client.id}`);
  if (mealPlans.length === 1) {
    console.log(`SELF_SERVICE_STARTER_MEAL_PLAN_ID=${mealPlans[0].id}`);
  } else {
    console.log('SELF_SERVICE_STARTER_MEAL_PLAN_ID=');
    console.log('Set this variable manually to the intended active meal plan ID; no plan was selected automatically.');
  }
  if (trainingPlans.length === 1) {
    console.log(`SELF_SERVICE_STARTER_TRAINING_PLAN_ID=${trainingPlans[0].id}`);
  } else {
    console.log('SELF_SERVICE_STARTER_TRAINING_PLAN_ID=');
    console.log('Set this variable manually to the intended training plan ID; no plan was selected automatically.');
  }
}

main()
  .catch((error) => {
    console.error(`Starter template finalization failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
