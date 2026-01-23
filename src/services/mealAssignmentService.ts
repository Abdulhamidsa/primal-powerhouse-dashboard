import { Meal, MealType } from '@/types/meal';
import { clientApi } from '@/lib/client-api';

/**
 * Helper service for handling meal personalization and assignment workflows
 */
export class MealAssignmentService {
  /**
   * Personalize and assign a meal to a client
   *
   * @param meal The original meal to personalize
   * @param personalizedMeal The personalized version of the meal
   * @param clientId The ID of the client to assign the meal to
   * @param mealType The type of meal (breakfast, lunch, dinner, snack)
   * @param dayOfWeek The day of the week to assign the meal to (0-6, where 0 is Sunday)
   * @param coachId The ID of the coach making the assignment
   * @returns Object containing the personalized meal and assignment details
   */
  static async personalizeAndAssignMeal(
    meal: Meal,
    personalizedMeal: Meal,
    clientId: string,
    mealType: MealType,
    dayOfWeek: number = new Date().getDay(),
    coachId: string = 'system'
  ) {
    try {
      console.log('personalizeAndAssignMeal - Starting', { 
        mealId: meal.id, 
        clientId, 
        mealType, 
        dayOfWeek 
      });
      
      // 1. Save the personalized meal with reference to the original meal
      const mealData = {
        name: personalizedMeal.name,
        description: personalizedMeal.description,
        ingredients: JSON.stringify(personalizedMeal.ingredients),
        instructions: JSON.stringify(personalizedMeal.instructions),
        calories: personalizedMeal.calories,
        protein: personalizedMeal.protein,
        carbs: personalizedMeal.carbs,
        fat: personalizedMeal.fat,
        fiber: personalizedMeal.fiber,
        prepTime: personalizedMeal.prepTime,
        cookTime: personalizedMeal.cookTime,
        servings: personalizedMeal.servings,
        imageUrl: personalizedMeal.images?.[0],
        tags: personalizedMeal.tags,
        type: personalizedMeal.type as any,
        coachId: coachId,
      };
      
      // Use client-side safe API to create personalized meal
      const savedMealObj = await clientApi.createPersonalizedMeal(
        mealData,
        clientId,
        meal.id  // Pass the original meal ID
      );
      
      // Format the response to match what the component expects
      const savedMeal = {
        meal: savedMealObj,
        client: { id: clientId, name: 'Client' }
      };

      console.log('Meal personalized and saved:', savedMeal.meal.id);
      
      return {
        originalMeal: meal,
        personalizedMeal: savedMeal.meal,
        client: savedMeal.client,
        assignment: {
          dayOfWeek,
          mealType,
          clientId,
        },
      };
    } catch (error) {
      console.error('Error personalizing and assigning meal:', error);
      throw error;
    }
  }

  /**
   * Assign multiple meals to a client in a meal plan
   *
   * @param clientId The ID of the client
   * @param mealAssignments Array of meal assignments with meal IDs, day of week, and meal type
   * @param planName Name of the meal plan
   * @param startDate Start date of the meal plan (string in YYYY-MM-DD format)
   * @param endDate Optional end date (string in YYYY-MM-DD format)
   * @param notes Optional notes about the meal plan
   * @returns The created meal plan
   */
  static async createMealPlan(
    clientId: string,
    mealAssignments: Array<{
      mealId: string;
      dayOfWeek: number;
      mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      portion: number;
      isPersonalized?: boolean;
    }>,
    planName: string,
    startDate: string,
    endDate?: string,
    notes?: string
  ) {
    try {
      console.log('MealAssignmentService.createMealPlan - Starting');
      console.log('Creating meal plan with:', { clientId, planName, startDate, endDate });
      console.log('Meal assignments to process:', mealAssignments.length);
      
      // Convert meal types to uppercase if needed and remove isPersonalized field
      const formattedAssignments = mealAssignments.map(({ mealId, dayOfWeek, mealType, portion }) => {
        console.log('Formatting assignment:', { mealId, dayOfWeek, mealType });
        return {
          mealId,
          dayOfWeek,
          mealType,
          portion,
        };
      });

      console.log('Formatted assignments:', formattedAssignments);
      console.log('Calling DataService.createMealPlan');
      
      // Make direct API call instead of using the DataService
      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          name: planName,
          startDate,
          endDate,
          notes,
          mealAssignments: formattedAssignments,
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Meal plan created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating meal plan:', error);
      console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
      throw error;
    }
  }

  /**
   * Update an existing meal plan for a client
   *
   * @param mealPlanId The ID of the meal plan to update
   * @param clientId The ID of the client
   * @param mealAssignments Array of meal assignments with meal IDs, day of week, and meal type
   * @param planName Name of the meal plan
   * @param startDate Start date of the meal plan (string in YYYY-MM-DD format)
   * @param endDate Optional end date (string in YYYY-MM-DD format)
   * @param notes Optional notes about the meal plan
   * @returns The updated meal plan
   */
  static async updateMealPlan(
    mealPlanId: string,
    clientId: string,
    mealAssignments: Array<{
      mealId: string;
      dayOfWeek: number;
      mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      portion: number;
      isPersonalized?: boolean;
    }>,
    planName: string,
    startDate: string,
    endDate?: string,
    notes?: string
  ) {
    try {
      console.log('MealAssignmentService.updateMealPlan - Starting');
      console.log('Updating meal plan with ID:', mealPlanId);
      console.log('Plan details:', { clientId, planName, startDate, endDate });
      console.log('Meal assignments to process:', mealAssignments.length);
      
      // Convert meal types to uppercase if needed and remove isPersonalized field
      const formattedAssignments = mealAssignments.map(({ mealId, dayOfWeek, mealType, portion }) => {
        console.log('Formatting assignment:', { mealId, dayOfWeek, mealType });
        return {
          mealId,
          dayOfWeek,
          mealType,
          portion,
        };
      });

      console.log('Formatted assignments:', formattedAssignments);
      
      // Make direct API call to update the meal plan
      const response = await fetch(`/api/meal-plans/${mealPlanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          name: planName,
          startDate,
          endDate,
          notes,
          mealAssignments: formattedAssignments,
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Meal plan updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating meal plan:', error);
      console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
      throw error;
    }
  }

  /**
   * Calculate macro totals for a set of meals
   *
   * @param meals Array of meals to calculate totals for
   * @returns Object with total calories, protein, carbs, and fat
   */
  static calculateMacroTotals(meals: Meal[]) {
    return meals.reduce(
      (totals, meal) => {
        totals.calories += meal.calories || 0;
        totals.protein += meal.protein || 0;
        totals.carbs += meal.carbs || 0;
        totals.fat += meal.fat || 0;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }
}
