export type DataClassification = 'public' | 'internal' | 'personal' | 'sensitive_personal';

type FieldClassificationMap = Record<string, DataClassification>;
type EntityClassificationMap = Record<string, FieldClassificationMap>;

export const DATA_CLASSIFICATION_MAP: EntityClassificationMap = {
  Client: {
    id: 'internal',
    name: 'personal',
    email: 'personal',
    phone: 'sensitive_personal',
    notes: 'sensitive_personal',
    goals: 'sensitive_personal',
    dietaryRestrictions: 'sensitive_personal',
    motivationalMessage: 'sensitive_personal',
    currentWeight: 'sensitive_personal',
    targetWeight: 'sensitive_personal',
    height: 'sensitive_personal',
    age: 'personal',
    gender: 'sensitive_personal',
    activityLevel: 'sensitive_personal',
  },
  WeeklyCheckIn: {
    weightKg: 'sensitive_personal',
    waistCm: 'sensitive_personal',
    trainingAdherence: 'sensitive_personal',
    nutritionAdherence: 'sensitive_personal',
    energyRating: 'sensitive_personal',
    stressRating: 'sensitive_personal',
    hungerRating: 'sensitive_personal',
    digestionRating: 'sensitive_personal',
    sleepHours: 'sensitive_personal',
    strengthUpdate: 'sensitive_personal',
    blockerText: 'sensitive_personal',
    notes: 'sensitive_personal',
  },
  HealthMetric: {
    weight: 'sensitive_personal',
    bmi: 'sensitive_personal',
    bmr: 'sensitive_personal',
    tdee: 'sensitive_personal',
    recommendedCals: 'sensitive_personal',
    goal: 'sensitive_personal',
    notes: 'sensitive_personal',
  },
  Feedback: {
    message: 'sensitive_personal',
  },
};

export function getFieldClassification(entityName: string, fieldName: string): DataClassification {
  return DATA_CLASSIFICATION_MAP[entityName]?.[fieldName] ?? 'internal';
}
