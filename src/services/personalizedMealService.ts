// Remove prisma direct import as we'll use API routes instead
import { MealType } from '@prisma/client';
import { DataService, Client } from '@/services/dataService';
// Use this type alias for returned meal objects from the API
import type { Meal } from '@prisma/client';

export interface PersonalizedMealInput {
  name: string;
  // description is not supported in the database schema but we'll keep it for frontend compatibility
  // This field will be ignored when saving to database
  description?: string;
  ingredients: string[] | string;
  instructions: string[] | string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  tags?: string[] | string;
  type: MealType;
  coachId: string;
}

/**
 * Service for handling personalized meals for clients
 */
export class PersonalizedMealService {
  /**
   * Save a personalized meal and assign it to a client
   *
   * @param meal The personalized meal input data
   * @param clientId ID of the client to assign the meal to
   * @returns Promise with the created meal and client
   */
  /**
   * Save a personalized meal and associate it with a client
   * Creates a new meal copy specifically for this client
   *
   * @param mealData The meal data to use for the personalized version
   * @param clientId ID of the client to associate with
   * @param originalMealId Optional ID of the original meal being personalized
   * @returns The created meal and client data
   */
  static async savePersonalizedMeal(
    mealData: PersonalizedMealInput,
    clientId: string,
    originalMealId?: string
  ): Promise<{ meal: Meal; client: Client }> {
    try {
      console.log('PersonalizedMealService.savePersonalizedMeal - Starting', {
        mealName: mealData.name,
        clientId,
        originalMealId: originalMealId || 'Not provided',
      });

      // 1. Save the personalized meal to the database as a new meal
      console.log('Creating personalized meal in database as a new copy');
      const meal = await this.createPersonalizedMeal(mealData, clientId, originalMealId);
      console.log('Personalized meal created with ID:', meal.id);

      // 2. Get the client data
      console.log('Getting client data for:', clientId);
      let client;
      try {
        client = await DataService.getClientById(clientId);
        console.log('Client data retrieved:', client.name);
      } catch (clientError) {
        console.error('Error getting client data:', clientError);
        // If we can't get client data, return just the meal
        // This allows the personalization to proceed even if client fetch fails
        return {
          meal,
          client: { id: clientId, name: 'Unknown Client' } as Client,
        };
      }

      // 3. Try to assign the new personalized meal to the client's meal plan
      // But don't throw if this fails - we'll handle assignment later in the meal plan process
      try {
        if (client) {
          console.log('Assigning personalized meal to client');
          await this.assignMealToClient(meal.id, clientId, meal.type);
          console.log('Personalized meal assigned to client successfully');
        }
      } catch (assignmentError) {
        // Log but don't throw - we just want to create the meal, assignment can happen later
        console.warn('Could not assign meal to client plan, but meal was created:', assignmentError);
        // We'll continue with the process anyway - the meal exists, which is most important
      }

      return {
        meal,
        client,
      };
    } catch (error) {
      console.error('Error saving personalized meal:', error);
      console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
      throw error;
    }
  }

  /**
   * Create a personalized meal in the database
   * This creates a new copy of the meal with the personalized data
   *
   * @param data Meal data to save
   * @param originalMealId Optional ID of the original meal this is based on
   * @returns The created meal
   */
  static async createPersonalizedMeal(
    data: PersonalizedMealInput,
    clientId: string,
    originalMealId?: string
  ): Promise<Meal> {
    try {
      console.log('Creating personalized meal:', data.name);
      console.log('Original meal ID:', originalMealId || 'Not provided');
      console.log('Client ID:', clientId);

      // Format the data for Prisma - make sure all fields are converted to the right types
      // Only include fields that exist in your schema.prisma file
      const mealData = {
        name: `${data.name} (Personalized)`, // Append (Personalized) to make it clear this is a custom version
        type: data.type,
        originalMealId: originalMealId || null, // Reference to the original meal if provided
        // Set isPersonalized to true for this meal
        isPersonalized: true,
        // Associate with the specific client
        clientId: clientId,
        ingredients: Array.isArray(data.ingredients) ? JSON.stringify(data.ingredients) : data.ingredients,
        instructions: Array.isArray(data.instructions) ? JSON.stringify(data.instructions) : data.instructions,
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        fiber: data.fiber !== undefined ? Number(data.fiber) : null,
        prepTime: data.prepTime !== undefined ? Number(data.prepTime) : null,
        cookTime: data.cookTime !== undefined ? Number(data.cookTime) : null,
        servings: Number(data.servings || 1),
        imageUrl: data.imageUrl || null,
        tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags || '[]',
        coachId: data.coachId,
      };

      console.log('Personalized meal data prepared:', mealData);

      // Make direct API call to create a new meal
      try {
        const response = await fetch('/api/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealData),
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const meal = await response.json();
        console.log('Personalized meal created successfully via API:', meal.id);
        return meal;
      } catch (apiError) {
        console.error('Error calling meals API:', apiError);
        // Don't try to use Prisma directly in the browser as it won't work
        // We'll need to handle this failure case gracefully
        throw new Error(
          `Failed to create personalized meal: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error creating personalized meal:', error);
      throw error;
    }
  }

  /**
   * Assign a meal to a client's meal plan
   *
   * @param mealId ID of the meal to assign
   * @param clientId ID of the client to assign the meal to
   * @param mealType Type of meal (BREAKFAST, LUNCH, DINNER, SNACK)
   * @returns The created meal assignment
   */
  static async assignMealToClient(
    mealId: string,
    clientId: string,
    mealType: MealType,
    dayOfWeek: number = new Date().getDay(),
    planId?: string
  ) {
    try {
      console.log('Assigning meal to client via API:', { mealId, clientId, mealType, dayOfWeek, planId });

      // Use the API endpoint instead of direct Prisma access
      const response = await fetch('/api/meal-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealId,
          clientId,
          mealType,
          dayOfWeek,
          planId,
          notes: 'Personalized meal',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const assignment = await response.json();
      console.log('Meal assigned successfully via API:', assignment.id);
      return assignment;
    } catch (error) {
      console.error('Error assigning meal to client:', error);

      // If there's an error, don't block the whole meal personalization process
      // We can still save the meal itself, even if we couldn't assign it to a plan yet
      console.warn('Failed to assign meal to client, but meal was created successfully');

      // Return a minimal object with enough info for the UI to continue
      return {
        id: 'temporary-assignment',
        mealId: mealId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all personalized meals for a coach
   *
   * @param coachId ID of the coach
   * @returns List of personalized meals
   */
  static async getPersonalizedMealsByCoach(coachId: string): Promise<Meal[]> {
    try {
      // Use API instead of direct Prisma access
      const response = await fetch(`/api/meals?coachId=${coachId}&isPersonalized=true`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const meals = await response.json();
      return meals;
    } catch (error) {
      console.error('Error fetching personalized meals:', error);
      throw error;
    }
  }

  /**
   * Get a meal by id
   */
  static async getMealById(mealId: string): Promise<Meal | null> {
    try {
      // Use API instead of direct Prisma access
      const response = await fetch(`/api/meals/${mealId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const meal = await response.json();
      return meal;
    } catch (error) {
      console.error('Error fetching meal:', error);
      throw error;
    }
  }

  /**
   * Update a meal
   */
  static async updateMeal(mealId: string, data: Partial<PersonalizedMealInput>): Promise<Meal> {
    try {
      const updateData: any = { ...data };

      // Convert arrays to strings for database storage
      if (data.ingredients)
        updateData.ingredients = Array.isArray(data.ingredients) ? JSON.stringify(data.ingredients) : data.ingredients;

      if (data.instructions)
        updateData.instructions = Array.isArray(data.instructions)
          ? JSON.stringify(data.instructions)
          : data.instructions;

      if (data.tags) updateData.tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags;

      // Use API instead of direct Prisma access
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const meal = await response.json();
      return meal;
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  }

  /**
   * Delete a meal
   */
  static async deleteMeal(mealId: string): Promise<void> {
    try {
      // Use API instead of direct Prisma access
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  }

  /**
   * Create a copy of an existing meal
   */
  static async duplicateMeal(mealId: string, coachId: string): Promise<Meal> {
    try {
      const originalMeal = await this.getMealById(mealId);

      if (!originalMeal) {
        throw new Error('Original meal not found');
      }

      // Create a new meal with the same data but a new ID
      const mealData = {
        name: `${originalMeal.name} (Copy)`,
        type: originalMeal.type,
        ingredients: originalMeal.ingredients || '[]',
        instructions: originalMeal.instructions || '[]',
        calories: originalMeal.calories,
        protein: originalMeal.protein,
        carbs: originalMeal.carbs,
        fat: originalMeal.fat,
        fiber: originalMeal.fiber,
        prepTime: originalMeal.prepTime || 0,
        cookTime: originalMeal.cookTime || 0,
        servings: originalMeal.servings,
        imageUrl: originalMeal.imageUrl || '',
        tags: originalMeal.tags || '[]',
        coachId: coachId,
      };

      // Use API instead of direct Prisma access
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const newMeal = await response.json();
      return newMeal;
    } catch (error) {
      console.error('Error duplicating meal:', error);
      throw error;
    }
  }
}
