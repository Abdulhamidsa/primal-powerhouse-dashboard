// Data service using Next.js API routes

// Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: "ACTIVE" | "INACTIVE";
  joinDate: string;
  goals: string[];
  currentWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  activityLevel: "LOW" | "MODERATE" | "HIGH";
  dietaryRestrictions: string[];
  notes: string;
  lastSession: string | null;
  nextSession: string | null;
  sessionsCompleted: number;
  progressPhotos: string[];
}

export interface Meal {
  id: string;
  name: string;
  type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings: number;
  tags: string[];
  imageUrl?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  clientId: string;
  mealAssignments: MealAssignment[];
}

export interface MealAssignment {
  id: string;
  dayOfWeek: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  portion: number;
  notes: string | null;
  meal: Meal;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  pace?: string;
  resistance?: number;
  restTime?: number;
  progression?: string;
}

export interface Workout {
  id: string;
  clientId: string;
  date: string;
  type: string;
  duration: number;
  exercises: Exercise[];
  notes: string;
  caloriesBurned: number;
  rating: number;
}

export interface UpcomingSession {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  type: string;
  duration: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  clientName?: string;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalMeals: number;
  totalWorkouts: number;
  thisMonth: {
    newClients: number;
    completedSessions: number;
    averageRating: number;
    totalRevenue: number;
  };
  lastMonth: {
    newClients: number;
    completedSessions: number;
    averageRating: number;
    totalRevenue: number;
  };
  growth: {
    clientGrowth: number;
    sessionGrowth: number;
    ratingGrowth: number;
    revenueGrowth: number;
  };
  upcomingSessions: UpcomingSession[];
  recentActivity: RecentActivity[];
}

export class DataService {
  private static baseUrl = "/api";

  // Meals
  static async getMeals() {
    const response = await fetch(`${this.baseUrl}/meals`);
    if (!response.ok) {
      throw new Error("Failed to fetch meals");
    }
    return response.json();
  }

  static async getMealById(id: string) {
    const response = await fetch(`${this.baseUrl}/meals/${id}`);
    if (!response.ok) {
      throw new Error("Meal not found");
    }
    return response.json();
  }

  static async createMeal(mealData: any) {
    const response = await fetch(`${this.baseUrl}/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mealData),
    });
    if (!response.ok) {
      throw new Error("Failed to create meal");
    }
    return response.json();
  }

  static async updateMeal(id: string, mealData: any) {
    const response = await fetch(`${this.baseUrl}/meals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mealData),
    });
    if (!response.ok) {
      throw new Error("Failed to update meal");
    }
    return response.json();
  }

  static async deleteMeal(id: string) {
    const response = await fetch(`${this.baseUrl}/meals/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete meal");
    }
    return response.json();
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    const response = await fetch(`${this.baseUrl}/clients`);
    if (!response.ok) {
      throw new Error("Failed to fetch clients");
    }
    return response.json();
  }

  static async getClientById(id: string): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/clients/${id}`);
    if (!response.ok) {
      throw new Error("Client not found");
    }
    return response.json();
  }

  static async getActiveClients(): Promise<Client[]> {
    const clients = await this.getClients();
    return clients.filter((client) => client.status === "ACTIVE");
  }

  static async createClient(clientData: any) {
    const response = await fetch(`${this.baseUrl}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clientData),
    });
    if (!response.ok) {
      throw new Error("Failed to create client");
    }
    return response.json();
  }

  // Meal Plans
  static async getMealPlans(clientId: string): Promise<MealPlan[]> {
    const response = await fetch(`${this.baseUrl}/meal-plans?clientId=${clientId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch meal plans");
    }
    return response.json();
  }

  static async createMealPlan(mealPlanData: {
    clientId: string;
    name: string;
    startDate: string;
    endDate?: string;
    notes?: string;
    mealAssignments: {
      mealId: string;
      dayOfWeek: number;
      mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
      portion?: number;
      notes?: string;
    }[];
  }): Promise<MealPlan> {
    const response = await fetch(`${this.baseUrl}/meal-plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mealPlanData),
    });
    if (!response.ok) {
      throw new Error("Failed to create meal plan");
    }
    return response.json();
  }

  static async updateMealPlan(id: string, mealPlanData: any): Promise<MealPlan> {
    const response = await fetch(`${this.baseUrl}/meal-plans/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mealPlanData),
    });
    if (!response.ok) {
      throw new Error("Failed to update meal plan");
    }
    return response.json();
  }

  static async deleteMealPlan(id: string) {
    const response = await fetch(`${this.baseUrl}/meal-plans/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete meal plan");
    }
    return response.json();
  }

  // Workouts
  static async getWorkouts(): Promise<Workout[]> {
    const response = await fetch(`${this.baseUrl}/workouts`);
    if (!response.ok) {
      throw new Error("Failed to fetch workouts");
    }
    return response.json();
  }

  static async getWorkoutsByClientId(clientId: string): Promise<Workout[]> {
    const response = await fetch(`${this.baseUrl}/workouts?clientId=${clientId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch workouts");
    }
    return response.json();
  }

  static async createWorkout(workoutData: any) {
    const response = await fetch(`${this.baseUrl}/workouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workoutData),
    });
    if (!response.ok) {
      throw new Error("Failed to create workout");
    }
    return response.json();
  }

  // Dashboard Stats
  static async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/dashboard/stats`);
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }
    return response.json();
  }

  static async getUpcomingSessions(): Promise<UpcomingSession[]> {
    const stats = await this.getDashboardStats();
    return stats.upcomingSessions;
  }

  static async getRecentActivity(): Promise<RecentActivity[]> {
    const stats = await this.getDashboardStats();
    return stats.recentActivity;
  }

  // Database seeding
  static async seedDatabase() {
    const response = await fetch(`${this.baseUrl}/seed`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to seed database");
    }
    return response.json();
  }

  // Utility methods for stats calculations
  static async getClientStats() {
    const clients = await this.getClients();
    const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
    const inactiveClients = clients.filter((c) => c.status === "INACTIVE").length;

    return {
      total: clients.length,
      active: activeClients,
      inactive: inactiveClients,
      activePercentage: clients.length > 0 ? Math.round((activeClients / clients.length) * 100) : 0,
    };
  }

  static async getMealStats() {
    const meals = await this.getMeals();
    const totalCalories = meals.reduce((sum: number, meal: any) => sum + meal.calories, 0);
    const avgCalories = meals.length > 0 ? Math.round(totalCalories / meals.length) : 0;
    const totalProtein = meals.reduce((sum: number, meal: any) => sum + meal.protein, 0);
    const avgProtein = meals.length > 0 ? Math.round(totalProtein / meals.length) : 0;

    return {
      total: meals.length,
      totalCalories,
      avgCalories,
      totalProtein,
      avgProtein,
      mealTypes: {
        breakfast: meals.filter((m: any) => m.type === "BREAKFAST").length,
        lunch: meals.filter((m: any) => m.type === "LUNCH").length,
        dinner: meals.filter((m: any) => m.type === "DINNER").length,
        snack: meals.filter((m: any) => m.type === "SNACK").length,
      },
    };
  }

  static async getWorkoutStats() {
    const workouts = await this.getWorkouts();
    const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0);
    const avgDuration = workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0;
    const totalCaloriesBurned = workouts.reduce((sum, workout) => sum + (workout.caloriesBurned || 0), 0);
    const avgRating = workouts.length > 0 ? workouts.reduce((sum, workout) => sum + (workout.rating || 0), 0) / workouts.length : 0;

    return {
      total: workouts.length,
      totalDuration,
      avgDuration,
      totalCaloriesBurned,
      avgRating: Math.round(avgRating * 10) / 10,
      workoutTypes: {
        STRENGTH_TRAINING: workouts.filter((w) => w.type === "STRENGTH_TRAINING").length,
        CARDIO: workouts.filter((w) => w.type === "CARDIO").length,
        FUNCTIONAL: workouts.filter((w) => w.type === "FUNCTIONAL").length,
      },
    };
  }
}
