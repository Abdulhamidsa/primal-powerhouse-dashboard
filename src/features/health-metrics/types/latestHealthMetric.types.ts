export type LatestHealthMetric = {
  bmi: number | null;
  bmr: number | null;
  tdee: number | null;
  recommendedCals: number | null;
  bmiCategory: string | null;
  macros: string | null;
  notes: string | null;
  isSafeToDeficit?: boolean | null;
};
