"use client";

import { useState, useEffect } from "react";
import { Client, Meal, MealPlan, DailyMealPlan, AssignedMeal } from "@/types/meal";
import Link from "next/link";
import { useParams } from "next/navigation";

// Enhanced sample meals with detailed information
const enhancedSampleMeals: Meal[] = [
  {
    id: "1",
    name: "Mediterranean Avocado Toast with Poached Eggs",
    type: "breakfast",
    description: "A nutrient-packed breakfast featuring creamy avocado on artisanal whole grain bread, topped with perfectly poached eggs and Mediterranean herbs. This meal provides sustained energy and healthy fats to start your day right.",
    calories: 420,
    protein: 18,
    carbs: 28,
    fat: 24,
    fiber: 12,
    sodium: 380,
    sugar: 3,
    cholesterol: 372,
    ingredients: [
      { id: "1", name: "Whole grain sourdough bread", amount: 2, unit: "slices", notes: "preferably artisanal" },
      { id: "2", name: "Ripe avocado", amount: 1, unit: "medium", notes: "should yield to gentle pressure" },
      { id: "3", name: "Large organic eggs", amount: 2, unit: "eggs" },
      { id: "4", name: "Extra virgin olive oil", amount: 1, unit: "tsp" },
      { id: "5", name: "Sea salt", amount: 1, unit: "pinch" },
      { id: "6", name: "Black pepper", amount: 1, unit: "pinch", notes: "freshly ground" },
      { id: "7", name: "Red pepper flakes", amount: 1, unit: "pinch", notes: "optional for heat" },
      { id: "8", name: "Fresh herbs", amount: 1, unit: "tbsp", notes: "dill, parsley, or chives" },
    ],
    instructions: [
      { id: "1", step: 1, instruction: "Fill a medium saucepan with water and bring to a gentle simmer. Add a splash of white vinegar to help the eggs hold together.", timeEstimate: 3 },
      { id: "2", step: 2, instruction: "Toast the bread slices until golden brown and crispy on the outside but still soft inside.", timeEstimate: 3 },
      { id: "3", step: 3, instruction: "While bread is toasting, cut the avocado in half, remove pit, and mash in a bowl with salt, pepper, and half the olive oil until creamy but still chunky.", timeEstimate: 2 },
      { id: "4", step: 4, instruction: "Crack each egg into a small bowl. Create a gentle whirlpool in the simmering water and slowly pour each egg into the center. Poach for 3-4 minutes for runny yolks.", timeEstimate: 4 },
      { id: "5", step: 5, instruction: "Spread the mashed avocado evenly on the toast. Using a slotted spoon, carefully place the poached eggs on top of the avocado.", timeEstimate: 1 },
      { id: "6", step: 6, instruction: "Drizzle with remaining olive oil, sprinkle with red pepper flakes and fresh herbs. Serve immediately while eggs are warm.", timeEstimate: 1 },
    ],
    prepTime: 8,
    cookTime: 10,
    servings: 1,
    tags: ["vegetarian", "high-protein", "healthy", "mediterranean", "omega-3"],
    images: ["https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800", "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"],
    difficulty: "medium",
    equipment: ["Medium saucepan", "Toaster", "Slotted spoon", "Small bowls"],
    tips: ["Use fresh eggs for the best poaching results", "Make sure water is at a gentle simmer, not a rolling boil", "Choose ripe but firm avocados for the best texture", "Serve immediately for the best experience with runny yolks"],
    nutritionNotes: "Rich in healthy monounsaturated fats, complete proteins, and fiber. Provides long-lasting energy.",
    allergens: ["eggs", "gluten"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Grilled Chicken Caesar Power Bowl",
    type: "lunch",
    description: "A protein-packed twist on the classic Caesar salad, featuring perfectly grilled chicken breast over crisp romaine lettuce with a lighter homemade Caesar dressing and crunchy chickpea croutons.",
    calories: 380,
    protein: 35,
    carbs: 12,
    fat: 22,
    fiber: 6,
    sodium: 420,
    sugar: 4,
    cholesterol: 85,
    ingredients: [
      { id: "1", name: "Chicken breast", amount: 6, unit: "oz", notes: "boneless, skinless" },
      { id: "2", name: "Romaine lettuce", amount: 4, unit: "cups", notes: "chopped" },
      { id: "3", name: "Parmesan cheese", amount: 2, unit: "tbsp", notes: "freshly grated" },
      { id: "4", name: "Roasted chickpeas", amount: 1 / 4, unit: "cup", notes: "for crunch" },
      { id: "5", name: "Greek yogurt", amount: 2, unit: "tbsp", notes: "plain, for dressing base" },
      { id: "6", name: "Lemon juice", amount: 1, unit: "tbsp", notes: "fresh squeezed" },
      { id: "7", name: "Dijon mustard", amount: 1, unit: "tsp" },
      { id: "8", name: "Garlic", amount: 1, unit: "clove", notes: "minced" },
    ],
    instructions: [
      { id: "1", step: 1, instruction: "Season chicken breast with salt, pepper, and herbs. Let rest at room temperature for 15 minutes.", timeEstimate: 15 },
      { id: "2", step: 2, instruction: "Preheat grill or grill pan to medium-high heat. Cook chicken for 6-7 minutes per side until internal temperature reaches 165°F.", timeEstimate: 14, temperature: "165°F internal" },
      { id: "3", step: 3, instruction: "While chicken cooks, prepare the dressing by whisking together Greek yogurt, lemon juice, Dijon mustard, minced garlic, and half the Parmesan.", timeEstimate: 3 },
      { id: "4", step: 4, instruction: "Wash and chop romaine lettuce into bite-sized pieces. Place in a large serving bowl.", timeEstimate: 3 },
      { id: "5", step: 5, instruction: "Let chicken rest for 5 minutes, then slice against the grain into strips.", timeEstimate: 5 },
      { id: "6", step: 6, instruction: "Toss lettuce with dressing, top with sliced chicken, remaining Parmesan, and roasted chickpeas.", timeEstimate: 2 },
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    tags: ["high-protein", "low-carb", "gluten-free", "lean", "post-workout"],
    images: ["https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800", "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800"],
    difficulty: "easy",
    equipment: ["Grill or grill pan", "Meat thermometer", "Large mixing bowl"],
    tips: ["Let chicken rest after cooking to retain juices", "Make extra roasted chickpeas for meal prep", "Massage lettuce with a pinch of salt for better texture"],
    nutritionNotes: "Excellent source of lean protein and probiotics from Greek yogurt. Lower calorie alternative to traditional Caesar.",
    allergens: ["dairy"],
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
];

// Sample client data
const sampleClient: Client = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phone: "+1 (555) 123-4567",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150",
  dateOfBirth: new Date("1990-05-15"),
  gender: "female",
  height: 165,
  weight: 68,
  activityLevel: "moderately_active",
  goals: ["weight_loss", "muscle_tone"],
  dietaryRestrictions: ["vegetarian"],
  allergies: ["nuts"],
  preferences: ["low_carb", "high_protein"],
  mealHistory: [],
  joinDate: new Date("2024-01-01"),
  lastActive: new Date("2024-01-16"),
  status: "active",
  notes: "Very motivated client, prefers morning workouts. Loves Mediterranean flavors and quick meal prep options.",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-16"),
};

export default function ClientProfilePage() {
  const params = useParams();
  const [client, setClient] = useState<Client>(sampleClient);
  const [activeTab, setActiveTab] = useState<"overview" | "meals" | "progress" | "notes">("overview");
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  };

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" };
    if (bmi < 25) return { category: "Normal", color: "text-green-600" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" };
    return { category: "Obese", color: "text-red-600" };
  };

  const getActivityLevelDisplay = (level: string) => {
    switch (level) {
      case "sedentary":
        return "Sedentary";
      case "lightly_active":
        return "Lightly Active";
      case "moderately_active":
        return "Moderately Active";
      case "very_active":
        return "Very Active";
      case "extremely_active":
        return "Extremely Active";
      default:
        return level;
    }
  };

  const bmi = client.height && client.weight ? parseFloat(calculateBMI(client.height, client.weight)) : 0;
  const bmiInfo = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/clients" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="text-2xl font-bold text-gray-900">{client.name}</div>
              <div className="hidden sm:block text-sm text-gray-500">Client Profile</div>
            </div>

            <div className="flex items-center gap-4">
              <Link href={`/clients/${client.id}/assign-meals`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Assign Meals
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-6">
            <img src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=3B82F6&color=fff&size=120`} alt={client.name} className="w-24 h-24 rounded-full object-cover" />

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    client.status === "active" ? "bg-green-100 text-green-700 border-green-200" : client.status === "paused" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium">{client.email}</div>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <div className="font-medium">{client.phone || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-500">Age:</span>
                  <div className="font-medium">{client.dateOfBirth ? calculateAge(client.dateOfBirth) : "N/A"} years</div>
                </div>
                <div>
                  <span className="text-gray-500">Joined:</span>
                  <div className="font-medium">{client.joinDate.toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6">
            {[
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "meals", label: "Current Meals", icon: "🍽️" },
              { key: "progress", label: "Progress", icon: "📈" },
              { key: "notes", label: "Notes", icon: "📝" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Physical Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Height:</span>
                  <span className="font-medium">{client.height ? `${client.height} cm` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium">{client.weight ? `${client.weight} kg` : "N/A"}</span>
                </div>
                {bmi > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">BMI:</span>
                    <span className={`font-medium ${bmiInfo.color}`}>
                      {bmi} ({bmiInfo.category})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Activity Level:</span>
                  <span className="font-medium">{getActivityLevelDisplay(client.activityLevel)}</span>
                </div>
              </div>
            </div>

            {/* Goals & Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Preferences</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-500 text-sm">Goals:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.goals.map((goal, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200">
                        {goal.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">Preferences:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.preferences.map((pref, index) => (
                      <span key={index} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full border border-green-200">
                        {pref.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dietary Information</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-500 text-sm">Restrictions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.dietaryRestrictions.length > 0 ? (
                      client.dietaryRestrictions.map((restriction, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-full border border-orange-200">
                          {restriction}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">Allergies:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.allergies.length > 0 ? (
                      client.allergies.map((allergy, index) => (
                        <span key={index} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">None reported</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "meals" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Meal Plan</h3>
              <p className="text-gray-500 mb-6">This client doesn't have an active meal plan yet. Start by assigning meals for their daily nutrition.</p>
              <Link href={`/clients/${client.id}/assign-meals`} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Assign Meals
              </Link>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-500">Progress tracking features will be available once the client starts following their meal plan.</p>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coach Notes</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Initial Assessment - {client.joinDate.toLocaleDateString()}</div>
                <p className="text-gray-700">{client.notes}</p>
              </div>

              <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">+ Add New Note</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
