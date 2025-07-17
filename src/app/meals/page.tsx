"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AddMealModal from "@/components/AddMealModal";
import { DataService } from "@/services/dataService";

interface Meal {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const mealsData = await DataService.getMeals();
      setMeals(mealsData);
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const filteredMeals = selectedType === "ALL" ? meals : meals.filter((meal) => meal.type === selectedType);

  const mealTypes = ["ALL", "BREAKFAST", "LUNCH", "DINNER", "SNACK"];

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "BREAKFAST":
        return "bg-orange-100 text-orange-800";
      case "LUNCH":
        return "bg-green-100 text-green-800";
      case "DINNER":
        return "bg-blue-100 text-blue-800";
      case "SNACK":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Meal Management</h1>
              <p className="text-gray-600">Create and manage nutritious meal plans for your clients</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="mt-4 sm:mt-0 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl">
              <span className="text-xl">+</span>
              Add New Meal
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {mealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedType === type ? "bg-blue-500 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"}`}
              >
                {type === "ALL" ? "All Meals" : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Meals</h3>
                <p className="text-3xl font-bold text-gray-900">{loading ? "..." : meals.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Calories</h3>
                <p className="text-3xl font-bold text-gray-900">{loading ? "..." : meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0) / meals.length) : 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Protein</h3>
                <p className="text-3xl font-bold text-gray-900">{loading ? "..." : meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.protein, 0) / meals.length) : 0}g</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💪</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Filtered</h3>
                <p className="text-3xl font-bold text-gray-900">{filteredMeals.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48">
                  <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.type)}`}>{meal.type.charAt(0) + meal.type.slice(1).toLowerCase()}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{meal.name}</h3>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{meal.calories}</p>
                      <p className="text-xs text-gray-600">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{meal.protein}g</p>
                      <p className="text-xs text-gray-600">Protein</p>
                    </div>
                  </div>

                  {/* Timing Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <span className="w-4 h-4 mr-1">⏱️</span>
                      {meal.prepTime + meal.cookTime} min
                    </span>
                    <span className="flex items-center">
                      <span className="w-4 h-4 mr-1">👥</span>
                      {meal.servings} serving{meal.servings > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {meal.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {meal.tags.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+{meal.tags.length - 3} more</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No meals found</h3>
            <p className="text-gray-600">{selectedType === "ALL" ? "No meals have been added yet." : `No ${selectedType.toLowerCase()} meals found.`}</p>
          </div>
        )}
      </main>

      {/* Add Meal Modal */}
      <AddMealModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onMealAdded={fetchMeals} />
    </div>
  );
}
