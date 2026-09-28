import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  getRecommendedCalories,
  calculateMacroRecommendations,
  calculateHealthMetrics,
  HealthMetricsSchema,
} from './calculators';

describe('Health Calculators', () => {
  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      // BMI = weight / (height ^ 2)
      // Example: 70 kg, 170 cm = 70 / (1.7 ^ 2) = 24.2
      const bmi = calculateBMI(70, 170);
      expect(bmi).toBeCloseTo(24.2, 1);
    });

    it('should handle edge cases', () => {
      const bmi1 = calculateBMI(50, 150);
      expect(bmi1).toBeCloseTo(22.2, 1);

      const bmi2 = calculateBMI(100, 200);
      expect(bmi2).toBeCloseTo(25.0, 1);
    });
  });

  describe('getBMICategory', () => {
    it('should categorize underweight correctly', () => {
      expect(getBMICategory(18.4)).toBe('underweight');
    });

    it('should categorize normal weight correctly', () => {
      expect(getBMICategory(22)).toBe('normal');
    });

    it('should categorize overweight correctly', () => {
      expect(getBMICategory(27)).toBe('overweight');
    });

    it('should categorize obese correctly', () => {
      expect(getBMICategory(30)).toBe('obese');
      expect(getBMICategory(35)).toBe('obese');
    });
  });

  describe('calculateBMR', () => {
    it('should calculate BMR for males correctly using Mifflin-St Jeor', () => {
      // Men: 10*kg + 6.25*cm - 5*age + 5
      // Example: 70kg, 180cm, 30years male = 10*70 + 6.25*180 - 5*30 + 5 = 700 + 1125 - 150 + 5 = 1680
      const bmr = calculateBMR(70, 180, 30, 'male');
      expect(bmr).toBe(1680);
    });

    it('should calculate BMR for females correctly using Mifflin-St Jeor', () => {
      // Women: 10*kg + 6.25*cm - 5*age - 161
      // Example: 60kg, 165cm, 25years female = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 ≈ 1345
      const bmr = calculateBMR(60, 165, 25, 'female');
      expect(bmr).toBe(1345);
    });

    it('should give higher BMR for heavier individuals', () => {
      const bmr1 = calculateBMR(70, 180, 30, 'male');
      const bmr2 = calculateBMR(85, 180, 30, 'male');
      expect(bmr2).toBeGreaterThan(bmr1);
    });
  });

  describe('calculateTDEE', () => {
    it('should apply activity multipliers correctly', () => {
      const bmr = 1680;

      const tdee_sedentary = calculateTDEE(bmr, 'LOW');
      expect(tdee_sedentary).toBeCloseTo(1680 * 1.2, 0);

      const tdee_moderate = calculateTDEE(bmr, 'MODERATE');
      expect(tdee_moderate).toBeCloseTo(1680 * 1.55, 0);

      const tdee_high = calculateTDEE(bmr, 'HIGH');
      expect(tdee_high).toBeCloseTo(1680 * 1.725, 0);
    });

    it('should support custom activity level strings', () => {
      const bmr = 1680;
      const tdee = calculateTDEE(bmr, 'moderate');
      expect(tdee).toBeCloseTo(1680 * 1.55, 0);
    });
  });

  describe('getRecommendedCalories', () => {
    it('should return TDEE for maintenance goal', () => {
      const { calories, notes } = getRecommendedCalories(2000, 'maintain', 'standard', 23);
      expect(calories).toBe(2000);
      expect(notes.some(n => n.includes('Maintenance'))).toBe(true);
    });

    it('should apply fat loss deficit', () => {
      const { calories: conservative } = getRecommendedCalories(2000, 'lose_fat', 'conservative', 23);
      expect(conservative).toBe(2000 - 300);

      const { calories: standard } = getRecommendedCalories(2000, 'lose_fat', 'standard', 23);
      expect(standard).toBe(2000 - 400);

      const { calories: aggressive } = getRecommendedCalories(2000, 'lose_fat', 'aggressive', 23);
      expect(aggressive).toBe(2000 - 500);
    });

    it('should apply muscle gain surplus', () => {
      const { calories: conservative } = getRecommendedCalories(2000, 'gain_muscle', 'conservative', 23);
      expect(conservative).toBe(2000 + 200);

      const { calories: standard } = getRecommendedCalories(2000, 'gain_muscle', 'standard', 23);
      expect(standard).toBe(2000 + 250);

      const { calories: aggressive } = getRecommendedCalories(2000, 'gain_muscle', 'aggressive', 23);
      expect(aggressive).toBe(2000 + 300);
    });

    it('should override deficit for underweight BMI', () => {
      const { calories, notes } = getRecommendedCalories(2000, 'lose_fat', 'aggressive', 18.0);
      expect(calories).toBe(2000); // no deficit applied
      expect(notes.some(n => n.includes('underweight'))).toBe(true);
    });

    it('should include helpful notes', () => {
      const { notes } = getRecommendedCalories(2000, 'lose_fat', 'standard', 27);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0]).toMatch(/deficit|weight loss/i);
    });
  });

  describe('calculateMacroRecommendations', () => {
    it('should prioritize protein for muscle gain', () => {
      const macros = calculateMacroRecommendations(2500, 80, 'gain_muscle');
      const proteinCalories = macros.protein * 4;
      const totalMacroCalories = proteinCalories + macros.carbs * 4 + macros.fat * 9;
      expect(totalMacroCalories).toBeCloseTo(2500, -1); // within 10 kcal
    });

    it('should provide balanced macros for maintenance', () => {
      const macros = calculateMacroRecommendations(2000, 80, 'maintain');
      expect(macros.protein).toBeGreaterThan(0);
      expect(macros.carbs).toBeGreaterThan(0);
      expect(macros.fat).toBeGreaterThan(0);
    });

    it('should include reasonable protein intake', () => {
      // 1.8g per kg for maintain, 1.6g for loss, 2g for gain
      const macros1 = calculateMacroRecommendations(2000, 80, 'maintain');
      expect(macros1.protein).toBeGreaterThanOrEqual(80 * 1.6); // at least maintenance level
      expect(macros1.protein).toBeLessThanOrEqual(80 * 2.2); // reasonable max

      const macros2 = calculateMacroRecommendations(2000, 80, 'lose_fat');
      expect(macros2.protein).toBeGreaterThanOrEqual(80 * 1.6); // prioritize protein during cut
    });
  });

  describe('Zod Validation', () => {
    it('should validate correct inputs', () => {
      const result = HealthMetricsSchema.safeParse({
        weightKg: 70,
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid weight', () => {
      const result = HealthMetricsSchema.safeParse({
        weightKg: 10,
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
      });
      expect(result.success).toBe(false);

      const result2 = HealthMetricsSchema.safeParse({
        weightKg: 300,
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
      });
      expect(result2.success).toBe(false);
    });

    it('should reject invalid height', () => {
      const result = HealthMetricsSchema.safeParse({
        weightKg: 70,
        heightCm: 100,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid gender', () => {
      const result = HealthMetricsSchema.safeParse({
        weightKg: 70,
        heightCm: 180,
        age: 30,
        gender: 'other',
        activityLevel: 'MODERATE',
      });
      expect(result.success).toBe(false);
    });

    it('should coerce string numbers', () => {
      const result = HealthMetricsSchema.safeParse({
        weightKg: '70',
        heightCm: '180',
        age: '30',
        gender: 'male',
        activityLevel: 'MODERATE',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.weightKg).toBe('number');
        expect(result.data.weightKg).toBe(70);
      }
    });
  });

  describe('calculateHealthMetrics', () => {
    it('should return complete health metrics for valid input', async () => {
      const result = await calculateHealthMetrics({
        weightKg: 70,
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
        goal: 'lose_fat',
        goalAggressiveness: 'standard',
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.bmi).toBeCloseTo(21.6, 1);
        expect(result.bmr).toBeGreaterThan(1600);
        expect(result.tdee).toBeGreaterThan(result.bmr);
        expect(result.recommendedCalories).toBe(result.tdee - 400);
        expect(result.bmiCategory).toBe('normal');
        expect(result.macros.protein).toBeGreaterThan(0);
        expect(result.macros.carbs).toBeGreaterThan(0);
        expect(result.macros.fat).toBeGreaterThan(0);
        expect(result.notes.length).toBeGreaterThan(0);
      }
    });

    it('should return error for invalid input', async () => {
      const result = await calculateHealthMetrics({
        weightKg: 'invalid',
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toMatch(/weightKg|number/i);
      }
    });

    it('should include safety warning for underweight', async () => {
      const result = await calculateHealthMetrics({
        weightKg: 50,
        heightCm: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'MODERATE',
        goal: 'lose_fat',
        goalAggressiveness: 'aggressive',
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.isSafeToDeficit).toBe(false);
        expect(result.notes.some(n => n.includes('underweight'))).toBe(true);
      }
    });
  });
});
