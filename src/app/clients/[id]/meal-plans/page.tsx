"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { DataService, Client, MealPlan } from "@/services/dataService";

const daysOfWeek = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const mealTypes = [
  { value: "BREAKFAST", label: "Breakfast", icon: "🌅", color: "bg-orange-100 text-orange-800" },
  { value: "LUNCH", label: "Lunch", icon: "☀️", color: "bg-yellow-100 text-yellow-800" },
  { value: "DINNER", label: "Dinner", icon: "🌙", color: "bg-purple-100 text-purple-800" },
  { value: "SNACK", label: "Snack", icon: "🍎", color: "bg-green-100 text-green-800" },
];

export default function ClientMealPlansPage() {
  const params = useParams();
  const clientId = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
      fetchMealPlans();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const clients = await DataService.getClients();
      const clientData = clients.find((c) => c.id === clientId);
      setClient(clientData || null);
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const plans = await DataService.getMealPlans(clientId);
      setMealPlans(plans);
      if (plans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plans[0].id);
      }
    } catch (error) {
      console.error("Error fetching meal plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = mealPlans.find((plan) => plan.id === selectedPlanId);

  const getMealsByDay = () => {
    if (!selectedPlan) return {};

    const mealsByDay: { [key: number]: { [key: string]: any } } = {};

    selectedPlan.mealAssignments.forEach((assignment) => {
      if (!mealsByDay[assignment.dayOfWeek]) {
        mealsByDay[assignment.dayOfWeek] = {};
      }
      mealsByDay[assignment.dayOfWeek][assignment.mealType] = assignment;
    });

    return mealsByDay;
  };

  const getTotalNutrition = () => {
    if (!selectedPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return selectedPlan.mealAssignments.reduce(
      (total, assignment) => {
        const meal = assignment.meal;
        return {
          calories: total.calories + meal.calories * assignment.portion,
          protein: total.protein + meal.protein * assignment.portion,
          carbs: total.carbs + meal.carbs * assignment.portion,
          fat: total.fat + meal.fat * assignment.portion,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const mealsByDay = getMealsByDay();
  const totalNutrition = getTotalNutrition();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Client not found</h1>
            <p className="text-gray-600">The requested client could not be found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img src={client.avatar} alt={client.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{client.name}'s Meal Plans</h1>
              <p className="text-gray-600">Nutritional guidance and meal scheduling</p>
            </div>
          </div>

          {/* Plan Selector */}
          {mealPlans.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {mealPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedPlanId === plan.id ? "bg-blue-500 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"}`}
                >
                  {plan.name}
                  {plan.isActive && <span className="ml-2 text-xs">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {mealPlans.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No meal plans yet</h3>
            <p className="text-gray-600 mb-6">This client doesn't have any meal plans assigned.</p>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">Assign First Meal Plan</button>
          </div>
        ) : (
          selectedPlan && (
            <>
              {/* Plan Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Daily Calories</h3>
                      <p className="text-3xl font-bold text-gray-900">{Math.round(totalNutrition.calories / 7)}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔥</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Daily Protein</h3>
                      <p className="text-3xl font-bold text-gray-900">{Math.round(totalNutrition.protein / 7)}g</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🥩</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Daily Carbs</h3>
                      <p className="text-3xl font-bold text-gray-900">{Math.round(totalNutrition.carbs / 7)}g</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🍞</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Daily Fat</h3>
                      <p className="text-3xl font-bold text-gray-900">{Math.round(totalNutrition.fat / 7)}g</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🥑</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Weekly Meal Schedule</h3>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedPlan.startDate).toLocaleDateString()} -{selectedPlan.endDate ? new Date(selectedPlan.endDate).toLocaleDateString() : "Ongoing"}
                    </div>
                  </div>
                  {selectedPlan.notes && <p className="text-gray-600 mt-2">{selectedPlan.notes}</p>}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-4 text-left font-medium text-gray-700 border-b border-gray-200">Day</th>
                        {mealTypes.map((mealType) => (
                          <th key={mealType.value} className="p-4 text-center font-medium text-gray-700 border-b border-gray-200 min-w-[250px]">
                            <div className="flex items-center justify-center gap-2">
                              <span>{mealType.icon}</span>
                              <span>{mealType.label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map((day) => (
                        <tr key={day.value} className="border-b border-gray-100">
                          <td className="p-4 font-medium text-gray-900 bg-gray-50">
                            <div>
                              <div className="font-semibold">{day.label}</div>
                              <div className="text-xs text-gray-500">{day.short}</div>
                            </div>
                          </td>
                          {mealTypes.map((mealType) => {
                            const assignment = mealsByDay[day.value]?.[mealType.value];
                            return (
                              <td key={`${day.value}_${mealType.value}`} className="p-4">
                                {assignment ? (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="font-medium text-gray-900 mb-2">{assignment.meal.name}</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                                      <div>🔥 {Math.round(assignment.meal.calories * assignment.portion)} cal</div>
                                      <div>🥩 {Math.round(assignment.meal.protein * assignment.portion)}g protein</div>
                                      <div>🍞 {Math.round(assignment.meal.carbs * assignment.portion)}g carbs</div>
                                      <div>🥑 {Math.round(assignment.meal.fat * assignment.portion)}g fat</div>
                                    </div>
                                    {assignment.portion !== 1 && <div className="text-xs text-blue-600 font-medium">Portion: {assignment.portion}x</div>}
                                    {assignment.meal.tags &&
                                      (() => {
                                        try {
                                          const tags = typeof assignment.meal.tags === "string" ? JSON.parse(assignment.meal.tags) : assignment.meal.tags;
                                          return (
                                            Array.isArray(tags) &&
                                            tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {tags.slice(0, 2).map((tag: string, index: number) => (
                                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                                                    {tag}
                                                  </span>
                                                ))}
                                              </div>
                                            )
                                          );
                                        } catch (e) {
                                          return null;
                                        }
                                      })()}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-400">
                                    <div className="text-2xl mb-2">-</div>
                                    <div className="text-xs">No meal assigned</div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
