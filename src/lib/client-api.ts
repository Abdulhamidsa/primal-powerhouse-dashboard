/**
 * This file provides client-side safe functions to access data
 * that normally would be retrieved via direct Prisma access.
 *
 * This ensures we don't accidentally use Prisma on the client side.
 */

// Define the MealType enum to match Prisma's enum
export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

// Type to represent Meal objects from the API
export type ApiMeal = {
  id: string;
  name: string;
  type: MealType | string; // Allow both the enum and string
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings: number;
  imageUrl?: string | null;
  instructions: any[];
  ingredients: any[];
  tags: string[];
  isPersonalized?: boolean;
  originalMealId?: string | null;
  coachId: string;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Client-safe API for meals - access without using Prisma directly
 */
export const clientApi = {
  /**
   * Get all meals for a coach or client
   */
  async getMeals(params?: { coachId?: string; clientId?: string; isPersonalized?: boolean }): Promise<ApiMeal[]> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.coachId) queryParams.append('coachId', params.coachId);
      if (params?.clientId) queryParams.append('clientId', params.clientId);
      if (params?.isPersonalized !== undefined) queryParams.append('isPersonalized', String(params.isPersonalized));

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const response = await fetch(`/api/meals${queryString}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  },

  /**
   * Get a meal by ID
   */
  async getMealById(mealId: string): Promise<ApiMeal | null> {
    try {
      const response = await fetch(`/api/meals/${mealId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meal:', error);
      throw error;
    }
  },

  /**
   * Create a new personalized meal
   */
  async createPersonalizedMeal(mealData: any, clientId: string, originalMealId?: string): Promise<ApiMeal> {
    try {
      // Convert meal type to proper enum format
      let mealType = mealData.type;

      // If type is a string like "breakfast", convert to "BREAKFAST"
      if (typeof mealType === 'string' && !Object.values(MealType).includes(mealType as MealType)) {
        mealType = mealType.toUpperCase();

        // Validate that it's now a valid MealType
        if (!Object.values(MealType).includes(mealType as MealType)) {
          console.warn(`Invalid meal type: ${mealData.type}. Valid types are: ${Object.values(MealType).join(', ')}`);
          // Default to BREAKFAST if invalid
          mealType = MealType.BREAKFAST;
        }
      }

      const payload = {
        ...mealData,
        type: mealType, // Use the properly formatted MealType
        clientId,
        originalMealId: originalMealId || null,
        isPersonalized: true,
      };

      console.log('Creating personalized meal with payload:', payload);

      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating personalized meal:', error);
      throw error;
    }
  },

  /**
   * Assign a meal to a client
   */
  async assignMealToClient(
    mealId: string,
    clientId: string,
    mealType: string,
    dayOfWeek: number = new Date().getDay(),
    planId?: string
  ): Promise<any> {
    try {
      // Ensure meal type is uppercase to match Prisma enum
      let formattedMealType = typeof mealType === 'string' ? mealType.toUpperCase() : mealType;

      // Validate the meal type
      if (!Object.values(MealType).includes(formattedMealType as MealType)) {
        console.warn(`Invalid meal type: ${mealType}. Using default BREAKFAST.`);
        // Default to BREAKFAST if invalid
        formattedMealType = MealType.BREAKFAST;
      }

      const response = await fetch('/api/meal-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealId,
          clientId,
          mealType: formattedMealType,
          dayOfWeek,
          planId,
          notes: 'Personalized meal',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning meal to client:', error);
      throw error;
    }
  },

  /**
   * Delete a personalized meal (only personalized meals can be deleted, not originals)
   */
  async deleteMeal(mealId: string): Promise<void> {
    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },
};
