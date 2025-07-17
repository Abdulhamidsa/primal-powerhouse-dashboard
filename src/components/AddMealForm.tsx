"use client";

import { useState } from "react";
import { Meal, MealType } from "@/types/meal";

interface AddMealFormProps {
  onAddMeal: (meal: Omit<Meal, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

export default function AddMealForm({ onAddMeal, onClose }: AddMealFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "breakfast" as MealType,
    description: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
    cholesterol: 0,
    ingredients: [""],
    instructions: [""],
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    tags: [""],
    images: [""],
    difficulty: "easy" as "easy" | "medium" | "hard",
    equipment: [""],
    tips: [""],
    nutritionNotes: "",
    allergens: [""],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert simple arrays to complex objects for Meal interface
    const mealIngredients = formData.ingredients
      .filter((ingredient) => ingredient.trim() !== "")
      .map((ingredient, index) => ({
        id: `ing-${index + 1}`,
        name: ingredient.split(" ").slice(1).join(" ") || ingredient, // Try to extract name
        amount: 1, // Default amount
        unit: "piece", // Default unit
        notes: "",
      }));

    const mealInstructions = formData.instructions
      .filter((instruction) => instruction.trim() !== "")
      .map((instruction, index) => ({
        id: `inst-${index + 1}`,
        step: index + 1,
        instruction: instruction,
        timeEstimate: 5, // Default time estimate
      }));

    const meal = {
      ...formData,
      ingredients: mealIngredients,
      instructions: mealInstructions,
      tags: formData.tags.filter((tag) => tag.trim() !== ""),
      images: formData.images.filter((image) => image.trim() !== ""),
      equipment: formData.equipment.filter((eq) => eq.trim() !== ""),
      tips: formData.tips.filter((tip) => tip.trim() !== ""),
      allergens: formData.allergens.filter((allergen) => allergen.trim() !== ""),
    };

    onAddMeal(meal);
    onClose();
  };

  const addField = (field: "ingredients" | "instructions" | "tags" | "equipment" | "tips" | "allergens") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeField = (field: "ingredients" | "instructions" | "tags" | "equipment" | "tips" | "allergens", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateField = (field: "ingredients" | "instructions" | "tags" | "equipment" | "tips" | "allergens", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Meal</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Avocado Toast with Eggs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type *</label>
                <select value={formData.type} onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as MealType }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option value="breakfast">🌅 Breakfast</option>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                  <option value="snack">🍎 Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Describe this delicious meal..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as "easy" | "medium" | "hard" }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="easy">😊 Easy</option>
                  <option value="medium">🤔 Medium</option>
                  <option value="hard">😰 Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={formData.images[0] || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, images: [e.target.value] }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://example.com/meal-image.jpg"
                />
              </div>
            </div>

            {/* Nutrition Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Nutrition Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.calories}
                    onChange={(e) => setFormData((prev) => ({ ...prev, calories: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) => setFormData((prev) => ({ ...prev, protein: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.carbs}
                    onChange={(e) => setFormData((prev) => ({ ...prev, carbs: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.fat}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fat: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiber (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.fiber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fiber: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sodium (mg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sodium}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sodium: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="320"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sugar (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.sugar}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sugar: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cholesterol (mg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cholesterol}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cholesterol: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Servings</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.servings}
                    onChange={(e) => setFormData((prev) => ({ ...prev, servings: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prepTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prepTime: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cook Time (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cookTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cookTime: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Ingredients</label>
              <button type="button" onClick={() => addField("ingredients")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateField("ingredients", index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 2 slices whole grain bread"
                  />
                  {formData.ingredients.length > 1 && (
                    <button type="button" onClick={() => removeField("ingredients", index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <button type="button" onClick={() => addField("instructions")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Step
              </button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="w-8 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-medium">{index + 1}</span>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateField("instructions", index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe this step..."
                    rows={2}
                  />
                  {formData.instructions.length > 1 && (
                    <button type="button" onClick={() => removeField("instructions", index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors self-start">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Equipment</label>
              <button type="button" onClick={() => addField("equipment")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Equipment
              </button>
            </div>
            <div className="space-y-2">
              {formData.equipment.map((equipment, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={equipment}
                    onChange={(e) => updateField("equipment", index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., skillet, spatula"
                  />
                  {formData.equipment.length > 1 && (
                    <button type="button" onClick={() => removeField("equipment", index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Cooking Tips</label>
              <button type="button" onClick={() => addField("tips")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Tip
              </button>
            </div>
            <div className="space-y-2">
              {formData.tips.map((tip, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tip}
                    onChange={(e) => updateField("tips", index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Don't overcook the salmon"
                  />
                  {formData.tips.length > 1 && (
                    <button type="button" onClick={() => removeField("tips", index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Allergens</label>
              <button type="button" onClick={() => addField("allergens")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Allergen
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.allergens.map((allergen, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    value={allergen}
                    onChange={(e) => updateField("allergens", index, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., dairy, nuts"
                  />
                  <button type="button" onClick={() => removeField("allergens", index)} className="w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Tags (optional)</label>
              <button type="button" onClick={() => addField("tags")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateField("tags", index, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., vegetarian"
                  />
                  <button type="button" onClick={() => removeField("tags", index)} className="w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
