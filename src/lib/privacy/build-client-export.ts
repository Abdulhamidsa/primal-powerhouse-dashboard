import { prisma } from '@/lib/prisma';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import { getClientDisplayName } from '@/lib/client-display-name';

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);
const json = (value: string | null | undefined): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

function mediaReference(value: unknown) {
  if (!value || typeof value !== 'object') return value ?? null;
  const item = value as Record<string, unknown>;
  return {
    publicId: typeof item.publicId === 'string' ? item.publicId : null,
    resourceType: typeof item.resourceType === 'string' ? item.resourceType : null,
    type: typeof item.type === 'string' ? item.type : null,
    name: typeof item.name === 'string' ? item.name : null,
    url: typeof item.url === 'string' ? item.url : typeof item.secureUrl === 'string' ? item.secureUrl : null,
  };
}

function mealReference(meal: any) {
  return {
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber,
    ingredients: meal.ingredients,
    spices: meal.spices,
    instructions: meal.instructions,
    prepTime: meal.prepTime,
    cookTime: meal.cookTime,
    servings: meal.servings,
    tags: meal.tags,
    imageUrl: meal.imageUrl,
    isPersonalized: meal.isPersonalized,
    createdAt: iso(meal.createdAt),
    updatedAt: iso(meal.updatedAt),
  };
}

export async function buildClientExport(clientId: string) {
  const db = prisma as any;
  const [
    client,
    weeklyCheckIns,
    healthMetrics,
    feedback,
    dailyCheckIns,
    dailyNutritionLogs,
    dailyTrainingLogs,
    dailyIntakeOverrides,
    mealPlans,
    personalizedMeals,
    mealCompletions,
    selectionSet,
    workouts,
    sessions,
    videoAssignments,
    workoutPlanAssignments,
    trainingPlans,
    trainingSessions,
    conversations,
    notifications,
    deliveryLogs,
    mobileSessions,
    deletionRequests,
    exportJobs,
    privacyAudits,
  ] = await Promise.all([
    db.client.findUnique({
      where: { id: clientId },
      select: {
        id: true, name: true, email: true, username: true, accessMode: true, serviceTier: true, signupSource: true,
        emailVerifiedAt: true, onboardingCompletedAt: true, phone: true, phoneEncrypted: true, avatar: true,
        progressPhotos: true, themePreference: true, currentWeight: true, targetWeight: true, height: true, age: true,
        gender: true, activityLevel: true, dietaryRestrictions: true, dietaryRestrictionsEncrypted: true,
        goals: true, goalsEncrypted: true, notes: true, notesEncrypted: true, motivationalMessage: true,
        motivationalMessageEncrypted: true, goalCalories: true, goalMacros: true, joinDate: true, createdAt: true,
        updatedAt: true, privacyUpdatedAt: true, deactivatedAt: true, anonymizedAt: true, deletionScheduledFor: true,
        consentAnalytics: true, consentMarketingNotifications: true, consentOptionalTracking: true,
        consentMessageNotifications: true, dailyCheckinsEnabled: true, weeklyCheckinsEnabled: true,
        dailyWeightEnabled: true, weightChartEnabled: true, progressPhotosEnabled: true,
        nutritionTrackingEnabled: true, workoutTrackingEnabled: true,
        featureVisibility: { select: {
          dailyCheckinsEnabled: true, weeklyCheckinsEnabled: true, dailyWeightEnabled: true,
          weightChartEnabled: true, progressPhotosEnabled: true, nutritionTrackingEnabled: true,
          workoutTrackingEnabled: true,
        } },
      },
    }),
    db.weeklyCheckIn.findMany({ where: { clientId }, orderBy: { weekStartDate: 'desc' }, select: {
      id: true, weekStartDate: true, submittedAt: true, weightKg: true, waistCm: true, trainingAdherence: true,
      nutritionAdherence: true, energyRating: true, stressRating: true, hungerRating: true, digestionRating: true,
      sleepHours: true, progressPhotoFrontUrl: true, progressPhotoSideUrl: true, progressPhotoBackUrl: true,
      strengthUpdate: true, strengthUpdateEncrypted: true, blockerText: true, blockerTextEncrypted: true,
      notes: true, notesEncrypted: true, createdAt: true, updatedAt: true,
    } }),
    db.healthMetric.findMany({ where: { clientId }, orderBy: { recordedAt: 'desc' }, select: {
      id: true, weight: true, bmi: true, bmr: true, tdee: true, recommendedCals: true, bmiCategory: true,
      goal: true, macros: true, notes: true, notesEncrypted: true, recordedAt: true, createdAt: true,
    } }),
    db.feedback.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, select: {
      id: true, message: true, messageEncrypted: true, createdAt: true,
    } }),
    db.dailyCheckIn.findMany({ where: { clientId }, orderBy: { dayDate: 'desc' }, select: {
      id: true, dayDate: true, weightKg: true, energy: true, hunger: true, sleep: true, note: true,
      submittedAt: true, createdAt: true, updatedAt: true,
    } }),
    db.dailyNutritionLog.findMany({ where: { clientId }, orderBy: { dayDate: 'desc' }, select: {
      id: true, dayDate: true, status: true, note: true, submittedAt: true, createdAt: true, updatedAt: true,
    } }),
    db.dailyTrainingLog.findMany({ where: { clientId }, orderBy: { dayDate: 'desc' }, select: {
      id: true, dayDate: true, status: true, note: true, submittedAt: true, createdAt: true, updatedAt: true,
    } }),
    db.dailyIntakeOverride.findMany({ where: { clientId }, orderBy: { dayDate: 'desc' }, select: {
      id: true, dayDate: true, calories: true, protein: true, carbs: true, fat: true, note: true,
      createdAt: true, updatedAt: true,
    } }),
    db.mealPlan.findMany({ where: { clientId }, orderBy: { startDate: 'desc' }, select: {
      id: true, name: true, startDate: true, endDate: true, isActive: true, notes: true, createdAt: true,
      updatedAt: true, mealAssignments: { select: {
        id: true, dayOfWeek: true, mealType: true, portion: true, scheduledTime: true, notes: true,
        createdAt: true, updatedAt: true, meal: { select: {
          id: true, name: true, type: true, calories: true, protein: true, carbs: true, fat: true, fiber: true,
          ingredients: true, spices: true, instructions: true, prepTime: true, cookTime: true, servings: true,
          tags: true, imageUrl: true, isPersonalized: true, createdAt: true, updatedAt: true,
        } }, side: { select: {
          id: true, name: true, type: true, imageUrl: true, calories: true, protein: true, carbs: true, fat: true,
          fiber: true, ingredients: true, spices: true, instructions: true, foodOrigin: true, createdAt: true,
          updatedAt: true,
        } },
      } },
    } }),
    db.meal.findMany({ where: { clientId, isPersonalized: true }, orderBy: { createdAt: 'desc' }, select: {
      id: true, name: true, type: true, calories: true, protein: true, carbs: true, fat: true, fiber: true,
      ingredients: true, spices: true, instructions: true, prepTime: true, cookTime: true, servings: true,
      tags: true, imageUrl: true, isPersonalized: true, createdAt: true, updatedAt: true,
    } }),
    db.mealCompletion.findMany({ where: { clientId }, orderBy: { dayDate: 'desc' }, select: {
      id: true, mealId: true, dayDate: true, mealType: true, slotIndex: true, sourceMealAssignmentId: true,
      portionSnapshot: true, caloriesSnapshot: true, proteinSnapshot: true, carbsSnapshot: true, fatSnapshot: true,
      completedAt: true, createdAt: true, updatedAt: true,
    } }),
    db.userMealSelectionSet.findUnique({ where: { clientId }, select: {
      id: true, name: true, createdAt: true, updatedAt: true, items: { select: {
        id: true, mealType: true, slotIndex: true, mealId: true, sourceMealAssignmentId: true, createdAt: true,
      } },
    } }),
    db.workout.findMany({ where: { clientId }, orderBy: { date: 'desc' }, select: {
      id: true, date: true, type: true, duration: true, exercises: true, notes: true, caloriesBurned: true,
      rating: true, createdAt: true, updatedAt: true,
    } }),
    db.session.findMany({ where: { clientId }, orderBy: { date: 'desc' }, select: {
      id: true, date: true, type: true, duration: true, status: true, notes: true, createdAt: true, updatedAt: true,
    } }),
    db.videoAssignment.findMany({ where: { clientId }, orderBy: { assignedDate: 'desc' }, select: {
      id: true, assignedDate: true, dueDate: true, scheduledTime: true, isCompleted: true, completedAt: true,
      notes: true, progress: true, createdAt: true, updatedAt: true, video: { select: {
        id: true, title: true, description: true, category: true, difficulty: true, duration: true,
        videoUrl: true, thumbnailUrl: true, equipment: true, muscleGroups: true, tags: true, instructions: true,
        tips: true,
      } },
    } }),
    db.workoutPlanAssignment.findMany({ where: { clientId }, orderBy: { assignedAt: 'desc' }, select: {
      id: true, assignedAt: true, isActive: true, workoutPlan: { select: {
        id: true, name: true, description: true, createdAt: true, updatedAt: true, exercises: { select: {
          id: true, order: true, targetSets: true, minReps: true, maxReps: true, suggestedWeightKg: true,
          restSeconds: true, notes: true, video: { select: { id: true, title: true, videoUrl: true, thumbnailUrl: true } },
        } },
      } }, sessions: { select: {
        id: true, status: true, startedAt: true, completedAt: true, exerciseLogs: { select: {
          id: true, planExerciseId: true, completedAt: true, feedback: true, feedbackNote: true,
          sets: { select: { id: true, setNumber: true, reps: true, weightKg: true, completed: true, loggedAt: true } },
        } },
      } },
    } }),
    db.clientTrainingPlan.findMany({ where: { clientId }, orderBy: { startDate: 'desc' }, select: {
      id: true, name: true, description: true, status: true, startDate: true, endDate: true, sourceType: true,
      aiGenerated: true, createdAt: true, updatedAt: true, days: { select: {
        id: true, date: true, weekday: true, type: true, workoutTemplateId: true, title: true, note: true,
        status: true, createdAt: true, updatedAt: true,
      } },
    } }),
    db.trainingSession.findMany({ where: { clientId }, orderBy: { startedAt: 'desc' }, select: {
      id: true, status: true, startedAt: true, completedAt: true, workoutTemplateId: true, perceivedDifficulty: true,
      overallFeedback: true, caloriesBurned: true, sourceType: true, createdAt: true, updatedAt: true,
      planDayId: true, exercises: { select: {
        id: true, order: true, exerciseNameSnapshot: true, muscleGroupSnapshot: true, equipmentSnapshot: true,
        notesSnapshot: true, plannedSets: true, plannedReps: true, plannedRestSeconds: true, targetRpeSnapshot: true,
        targetTempoSnapshot: true, createdAt: true, updatedAt: true, sets: { select: {
          id: true, setNumber: true, plannedReps: true, plannedWeightKg: true, plannedRestSeconds: true,
          actualReps: true, actualWeightKg: true, completed: true, skipped: true, feedback: true,
          createdAt: true, updatedAt: true,
        } },
      } },
    } }),
    db.conversation.findMany({ where: { clientId }, orderBy: { updatedAt: 'desc' }, select: {
      id: true, coachId: true, lastMessageAt: true, clientLastReadAt: true, coachLastReadAt: true, createdAt: true,
      updatedAt: true, messages: { orderBy: { createdAt: 'asc' }, select: {
        id: true, senderId: true, senderRole: true, body: true, bodyEncrypted: true, attachmentsJson: true,
        createdAt: true,
      } },
    } }),
    db.notification.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, select: {
      id: true, title: true, body: true, category: true, actionUrl: true, channels: true, readAt: true,
      source: true, sourceId: true, expiresAt: true, createdAt: true, updatedAt: true,
    } }),
    db.notificationDeliveryLog.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, select: {
      id: true, source: true, status: true, subscriptionCount: true, successCount: true, failureCount: true,
      staleCount: true, reason: true, createdAt: true,
    } }),
    db.mobileSession.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, select: {
      id: true, authenticatedAt: true, expiresAt: true, revokedAt: true, createdAt: true,
      devices: { select: { id: true, updatedAt: true } },
    } }),
    db.deletionRequest.findMany({ where: { clientId }, orderBy: { requestedAt: 'desc' }, select: {
      id: true, status: true, requestedAt: true, gracePeriodDays: true, scheduledHardDeleteAt: true,
      anonymizedAt: true, finalizedAt: true, cancelledAt: true, reason: true,
    } }),
    db.privacyExportJob.findMany({ where: { clientId }, orderBy: { requestedAt: 'desc' }, select: {
      id: true, status: true, format: true, requestedAt: true, completedAt: true, expiresAt: true,
      downloadCount: true, downloadedAt: true,
    } }),
    db.auditLog.findMany({ where: { targetUserId: clientId, action: { startsWith: 'privacy.' } }, orderBy: { createdAt: 'asc' }, select: {
      action: true, createdAt: true,
    } }),
  ]);

  if (!client) return null;

  const decrypt = (encrypted: string | null, fallback: string | null, scope: string) => decryptOrFallback(encrypted, scope) ?? fallback;
  const conversationsExport = conversations.map((conversation: any) => ({
    id: conversation.id,
    coachId: conversation.coachId,
    lastMessageAt: iso(conversation.lastMessageAt),
    clientLastReadAt: iso(conversation.clientLastReadAt),
    coachLastReadAt: iso(conversation.coachLastReadAt),
    createdAt: iso(conversation.createdAt),
    updatedAt: iso(conversation.updatedAt),
    messages: conversation.messages.map((message: any) => ({
      id: message.id,
      senderId: message.senderId,
      senderRole: message.senderRole,
      body: decrypt(message.bodyEncrypted, message.body, `message:${message.id}:body`),
      attachments: (() => {
        const parsedAttachments = json(message.attachmentsJson);
        return Array.isArray(parsedAttachments) ? parsedAttachments.map((attachment) => mediaReference(attachment)) : [];
      })(),
      createdAt: iso(message.createdAt),
    })),
  }));

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: client.id, name: client.name, displayName: getClientDisplayName(client), email: client.email,
      username: client.username, accessMode: client.accessMode, serviceTier: client.serviceTier,
      signupSource: client.signupSource, emailVerifiedAt: iso(client.emailVerifiedAt),
      onboardingCompletedAt: iso(client.onboardingCompletedAt), joinDate: iso(client.joinDate),
      createdAt: iso(client.createdAt), updatedAt: iso(client.updatedAt), deactivatedAt: iso(client.deactivatedAt),
      anonymizedAt: iso(client.anonymizedAt), deletionScheduledFor: iso(client.deletionScheduledFor),
    },
    profile: {
      phone: decrypt(client.phoneEncrypted, client.phone, `client:${client.id}:phone`), age: client.age,
      height: client.height, currentWeight: client.currentWeight, targetWeight: client.targetWeight,
      gender: client.gender, activityLevel: client.activityLevel,
      goals: decrypt(client.goalsEncrypted, client.goals, `client:${client.id}:goals`),
      dietaryRestrictions: decrypt(client.dietaryRestrictionsEncrypted, client.dietaryRestrictions, `client:${client.id}:dietaryRestrictions`),
      notes: decrypt(client.notesEncrypted, client.notes, `client:${client.id}:notes`),
      motivationalMessage: decrypt(client.motivationalMessageEncrypted, client.motivationalMessage, `client:${client.id}:motivationalMessage`),
      goalCalories: client.goalCalories, goalMacros: json(client.goalMacros), themePreference: client.themePreference,
      preferences: { dailyCheckinsEnabled: client.dailyCheckinsEnabled, weeklyCheckinsEnabled: client.weeklyCheckinsEnabled,
        dailyWeightEnabled: client.dailyWeightEnabled, weightChartEnabled: client.weightChartEnabled,
        progressPhotosEnabled: client.progressPhotosEnabled, nutritionTrackingEnabled: client.nutritionTrackingEnabled,
        workoutTrackingEnabled: client.workoutTrackingEnabled, featureVisibility: client.featureVisibility },
    },
    healthMetrics: healthMetrics.map((entry: any) => ({ id: entry.id, weight: entry.weight, bmi: entry.bmi, bmr: entry.bmr, tdee: entry.tdee,
      recommendedCals: entry.recommendedCals, bmiCategory: entry.bmiCategory, goal: entry.goal, macros: json(entry.macros),
      notes: decrypt(entry.notesEncrypted, entry.notes, `healthMetric:${entry.id}:notes`), recordedAt: iso(entry.recordedAt), createdAt: iso(entry.createdAt) })),
    dailyCheckIns: dailyCheckIns.map((entry: any) => ({ id: entry.id, dayDate: iso(entry.dayDate), weightKg: entry.weightKg, energy: entry.energy,
      hunger: entry.hunger, sleep: entry.sleep, note: entry.note, submittedAt: iso(entry.submittedAt), createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
    weeklyCheckIns: weeklyCheckIns.map((entry: any) => ({ id: entry.id, weekStartDate: iso(entry.weekStartDate), submittedAt: iso(entry.submittedAt),
      weightKg: entry.weightKg, waistCm: entry.waistCm, trainingAdherence: entry.trainingAdherence, nutritionAdherence: entry.nutritionAdherence,
      energyRating: entry.energyRating, stressRating: entry.stressRating, hungerRating: entry.hungerRating, digestionRating: entry.digestionRating,
      sleepHours: entry.sleepHours, progressPhotoFrontUrl: entry.progressPhotoFrontUrl, progressPhotoSideUrl: entry.progressPhotoSideUrl,
      progressPhotoBackUrl: entry.progressPhotoBackUrl, strengthUpdate: decrypt(entry.strengthUpdateEncrypted, entry.strengthUpdate, `weeklyCheckIn:${entry.id}:strengthUpdate`),
      blockerText: decrypt(entry.blockerTextEncrypted, entry.blockerText, `weeklyCheckIn:${entry.id}:blockerText`),
      notes: decrypt(entry.notesEncrypted, entry.notes, `weeklyCheckIn:${entry.id}:notes`), createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
    nutrition: {
      mealPlans: mealPlans.map((plan: any) => ({ id: plan.id, name: plan.name, startDate: iso(plan.startDate), endDate: iso(plan.endDate), isActive: plan.isActive,
        notes: plan.notes, createdAt: iso(plan.createdAt), updatedAt: iso(plan.updatedAt), assignments: plan.mealAssignments.map((assignment: any) => ({
          id: assignment.id, dayOfWeek: assignment.dayOfWeek, mealType: assignment.mealType, portion: assignment.portion,
          scheduledTime: assignment.scheduledTime, notes: assignment.notes, createdAt: iso(assignment.createdAt), updatedAt: iso(assignment.updatedAt),
          meal: mealReference(assignment.meal), side: assignment.side ? { id: assignment.side.id, name: assignment.side.name, type: assignment.side.type,
            imageUrl: assignment.side.imageUrl, calories: assignment.side.calories, protein: assignment.side.protein, carbs: assignment.side.carbs,
            fat: assignment.side.fat, fiber: assignment.side.fiber, ingredients: assignment.side.ingredients, spices: assignment.side.spices,
            instructions: assignment.side.instructions, foodOrigin: assignment.side.foodOrigin, createdAt: iso(assignment.side.createdAt), updatedAt: iso(assignment.side.updatedAt) } : null,
        })) })),
      personalizedMeals: personalizedMeals.map(mealReference),
      mealCompletions: mealCompletions.map((entry: any) => ({ id: entry.id, mealId: entry.mealId, dayDate: iso(entry.dayDate), mealType: entry.mealType,
        slotIndex: entry.slotIndex, sourceMealAssignmentId: entry.sourceMealAssignmentId, portionSnapshot: entry.portionSnapshot,
        caloriesSnapshot: entry.caloriesSnapshot, proteinSnapshot: entry.proteinSnapshot, carbsSnapshot: entry.carbsSnapshot, fatSnapshot: entry.fatSnapshot,
        completedAt: iso(entry.completedAt), createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
      dailyNutritionLogs: dailyNutritionLogs.map((entry: any) => ({ id: entry.id, dayDate: iso(entry.dayDate), status: entry.status, note: entry.note,
        submittedAt: iso(entry.submittedAt), createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
      dailyIntakeOverrides: dailyIntakeOverrides.map((entry: any) => ({ id: entry.id, dayDate: iso(entry.dayDate), calories: entry.calories, protein: entry.protein,
        carbs: entry.carbs, fat: entry.fat, note: entry.note, createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
      selectionSet: selectionSet ? { id: selectionSet.id, name: selectionSet.name, createdAt: iso(selectionSet.createdAt), updatedAt: iso(selectionSet.updatedAt),
        items: selectionSet.items.map((entry: any) => ({ id: entry.id, mealType: entry.mealType, slotIndex: entry.slotIndex, mealId: entry.mealId,
          sourceMealAssignmentId: entry.sourceMealAssignmentId, createdAt: iso(entry.createdAt) })) } : null,
    },
    training: { dailyTrainingLogs: dailyTrainingLogs.map((entry: any) => ({ id: entry.id, dayDate: iso(entry.dayDate), status: entry.status, note: entry.note,
      submittedAt: iso(entry.submittedAt), createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })), workouts: workouts.map((entry: any) => ({ id: entry.id, date: iso(entry.date), type: entry.type, duration: entry.duration, exercises: entry.exercises,
      notes: entry.notes, caloriesBurned: entry.caloriesBurned, rating: entry.rating, createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
      sessions: sessions.map((entry: any) => ({ id: entry.id, date: iso(entry.date), type: entry.type, duration: entry.duration, status: entry.status, notes: entry.notes,
        createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })), videoAssignments: videoAssignments.map((entry: any) => ({ id: entry.id, assignedDate: iso(entry.assignedDate),
          dueDate: iso(entry.dueDate), scheduledTime: entry.scheduledTime, isCompleted: entry.isCompleted, completedAt: iso(entry.completedAt), notes: entry.notes,
          progress: entry.progress, createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt), video: entry.video })),
      workoutPlanAssignments: workoutPlanAssignments.map((assignment: any) => ({ id: assignment.id, assignedAt: iso(assignment.assignedAt), isActive: assignment.isActive,
        workoutPlan: assignment.workoutPlan ? { id: assignment.workoutPlan.id, name: assignment.workoutPlan.name, description: assignment.workoutPlan.description,
          createdAt: iso(assignment.workoutPlan.createdAt), updatedAt: iso(assignment.workoutPlan.updatedAt), exercises: assignment.workoutPlan.exercises.map((exercise: any) => ({
            id: exercise.id, order: exercise.order, targetSets: exercise.targetSets, minReps: exercise.minReps, maxReps: exercise.maxReps,
            suggestedWeightKg: exercise.suggestedWeightKg, restSeconds: exercise.restSeconds, notes: exercise.notes,
            video: exercise.video ? { id: exercise.video.id, title: exercise.video.title, videoUrl: exercise.video.videoUrl, thumbnailUrl: exercise.video.thumbnailUrl } : null,
          })) } : null,
        sessions: assignment.sessions.map((session: any) => ({ id: session.id, status: session.status, startedAt: iso(session.startedAt), completedAt: iso(session.completedAt),
          exerciseLogs: session.exerciseLogs.map((log: any) => ({ id: log.id, planExerciseId: log.planExerciseId, completedAt: iso(log.completedAt), feedback: log.feedback,
            feedbackNote: log.feedbackNote, sets: log.sets.map((set: any) => ({ id: set.id, setNumber: set.setNumber, reps: set.reps, weightKg: set.weightKg,
              completed: set.completed, loggedAt: iso(set.loggedAt) })) })) })) })),
      trainingPlans: trainingPlans.map((plan: any) => ({ id: plan.id, name: plan.name, description: plan.description, status: plan.status, startDate: iso(plan.startDate),
        endDate: iso(plan.endDate), sourceType: plan.sourceType, aiGenerated: plan.aiGenerated, createdAt: iso(plan.createdAt), updatedAt: iso(plan.updatedAt),
        days: plan.days.map((day: any) => ({ id: day.id, date: iso(day.date), weekday: day.weekday, type: day.type, workoutTemplateId: day.workoutTemplateId,
          title: day.title, note: day.note, status: day.status, createdAt: iso(day.createdAt), updatedAt: iso(day.updatedAt) })) })),
      trainingSessions: trainingSessions.map((session: any) => ({ id: session.id, status: session.status, startedAt: iso(session.startedAt), completedAt: iso(session.completedAt),
        workoutTemplateId: session.workoutTemplateId, perceivedDifficulty: session.perceivedDifficulty, overallFeedback: session.overallFeedback,
        caloriesBurned: session.caloriesBurned, sourceType: session.sourceType, createdAt: iso(session.createdAt), updatedAt: iso(session.updatedAt), planDayId: session.planDayId,
        exercises: session.exercises.map((exercise: any) => ({ id: exercise.id, order: exercise.order, exerciseNameSnapshot: exercise.exerciseNameSnapshot,
          muscleGroupSnapshot: exercise.muscleGroupSnapshot, equipmentSnapshot: exercise.equipmentSnapshot, notesSnapshot: exercise.notesSnapshot,
          plannedSets: exercise.plannedSets, plannedReps: exercise.plannedReps, plannedRestSeconds: exercise.plannedRestSeconds,
          targetRpeSnapshot: exercise.targetRpeSnapshot, targetTempoSnapshot: exercise.targetTempoSnapshot, createdAt: iso(exercise.createdAt), updatedAt: iso(exercise.updatedAt),
          sets: exercise.sets.map((set: any) => ({ id: set.id, setNumber: set.setNumber, plannedReps: set.plannedReps, plannedWeightKg: set.plannedWeightKg,
            plannedRestSeconds: set.plannedRestSeconds, actualReps: set.actualReps, actualWeightKg: set.actualWeightKg, completed: set.completed,
            skipped: set.skipped, feedback: set.feedback, createdAt: iso(set.createdAt), updatedAt: iso(set.updatedAt) })) })) })),
    },
    conversations: conversationsExport,
    feedback: feedback.map((entry: any) => ({ id: entry.id, message: decrypt(entry.messageEncrypted, entry.message, `feedback:${entry.id}:message`), createdAt: iso(entry.createdAt) })),
    media: { avatar: client.avatar, progressPhotos: json(client.progressPhotos), weeklyCheckInPhotos: weeklyCheckIns.map((entry: any) => ({ id: entry.id,
      front: entry.progressPhotoFrontUrl, side: entry.progressPhotoSideUrl, back: entry.progressPhotoBackUrl })),
      personalizedMealImages: personalizedMeals.map((entry: any) => ({ id: entry.id, imageUrl: entry.imageUrl })) },
    notifications: notifications.map((entry: any) => ({ id: entry.id, title: entry.title, body: entry.body, category: entry.category, actionUrl: entry.actionUrl,
      channels: entry.channels, readAt: iso(entry.readAt), source: entry.source, sourceId: entry.sourceId, expiresAt: iso(entry.expiresAt), createdAt: iso(entry.createdAt), updatedAt: iso(entry.updatedAt) })),
    notificationDeliveryLogs: deliveryLogs.map((entry: any) => ({ id: entry.id, source: entry.source, status: entry.status,
      subscriptionCount: entry.subscriptionCount, successCount: entry.successCount, failureCount: entry.failureCount, staleCount: entry.staleCount,
      reason: entry.reason, createdAt: iso(entry.createdAt) })),
    consentAndPrivacy: { consents: { analytics: client.consentAnalytics, marketingNotifications: client.consentMarketingNotifications,
      optionalTracking: client.consentOptionalTracking, messageNotifications: client.consentMessageNotifications }, privacyUpdatedAt: iso(client.privacyUpdatedAt),
      deletionRequests: deletionRequests.map((entry: any) => ({ id: entry.id, status: entry.status, requestedAt: iso(entry.requestedAt), gracePeriodDays: entry.gracePeriodDays,
        scheduledHardDeleteAt: iso(entry.scheduledHardDeleteAt), anonymizedAt: iso(entry.anonymizedAt), finalizedAt: iso(entry.finalizedAt),
        cancelledAt: iso(entry.cancelledAt), reason: entry.reason })),
      exportJobs: exportJobs.map((entry: any) => ({ id: entry.id, status: entry.status, format: entry.format, requestedAt: iso(entry.requestedAt),
        completedAt: iso(entry.completedAt), expiresAt: iso(entry.expiresAt), downloadCount: entry.downloadCount, downloadedAt: iso(entry.downloadedAt) })),
      auditEvents: privacyAudits.map((entry: any) => ({ action: entry.action, createdAt: iso(entry.createdAt) })) },
    sessionsAndDevices: mobileSessions.map((entry: any) => ({ id: entry.id, authenticatedAt: iso(entry.authenticatedAt), expiresAt: iso(entry.expiresAt),
      revokedAt: iso(entry.revokedAt), createdAt: iso(entry.createdAt), devices: entry.devices.map((device: any) => ({ id: device.id, updatedAt: iso(device.updatedAt) })) })),
  };
}
