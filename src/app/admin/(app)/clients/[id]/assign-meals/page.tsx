'use client';

import { useState } from 'react';
import { Client, Meal, MealType, DailyMealPlan, AssignedMeal } from '@/types/meal';
import Link from 'next/link';
import Image from 'next/image';

// Enhanced sample meals with detailed information
const enhancedSampleMeals: Meal[] = [
  {
    id: '1',
    name: 'Mediterranean Avocado Toast with Poached Eggs',
    type: 'breakfast',
    description:
      'A nutrient-packed breakfast featuring creamy avocado on artisanal whole grain bread, topped with perfectly poached eggs and Mediterranean herbs.',
    calories: 420,
    protein: 18,
    carbs: 28,
    fat: 24,
    fiber: 12,
    sodium: 380,
    sugar: 3,
    cholesterol: 372,
    ingredients: [
      {
        id: '1',
        name: 'Whole grain sourdough bread',
        amount: 2,
        unit: 'slices',
        notes: 'preferably artisanal',
      },
      {
        id: '2',
        name: 'Ripe avocado',
        amount: 1,
        unit: 'medium',
        notes: 'should yield to gentle pressure',
      },
      { id: '3', name: 'Large organic eggs', amount: 2, unit: 'eggs' },
      { id: '4', name: 'Extra virgin olive oil', amount: 1, unit: 'tsp' },
      { id: '5', name: 'Sea salt', amount: 1, unit: 'pinch' },
      { id: '6', name: 'Black pepper', amount: 1, unit: 'pinch', notes: 'freshly ground' },
      { id: '7', name: 'Red pepper flakes', amount: 1, unit: 'pinch', notes: 'optional for heat' },
      { id: '8', name: 'Fresh herbs', amount: 1, unit: 'tbsp', notes: 'dill, parsley, or chives' },
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        instruction:
          'Fill a medium saucepan with water and bring to a gentle simmer. Add a splash of white vinegar to help the eggs hold together.',
        timeEstimate: 3,
      },
      {
        id: '2',
        step: 2,
        instruction: 'Toast the bread slices until golden brown and crispy on the outside but still soft inside.',
        timeEstimate: 3,
      },
      {
        id: '3',
        step: 3,
        instruction:
          'While bread is toasting, cut the avocado in half, remove pit, and mash in a bowl with salt, pepper, and half the olive oil until creamy but still chunky.',
        timeEstimate: 2,
      },
      {
        id: '4',
        step: 4,
        instruction:
          'Crack each egg into a small bowl. Create a gentle whirlpool in the simmering water and slowly pour each egg into the center. Poach for 3-4 minutes for runny yolks.',
        timeEstimate: 4,
      },
      {
        id: '5',
        step: 5,
        instruction:
          'Spread the mashed avocado evenly on the toast. Using a slotted spoon, carefully place the poached eggs on top of the avocado.',
        timeEstimate: 1,
      },
      {
        id: '6',
        step: 6,
        instruction:
          'Drizzle with remaining olive oil, sprinkle with red pepper flakes and fresh herbs. Serve immediately while eggs are warm.',
        timeEstimate: 1,
      },
    ],
    prepTime: 8,
    cookTime: 10,
    servings: 1,
    tags: ['vegetarian', 'high-protein', 'healthy', 'mediterranean', 'omega-3'],
    images: [
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    ],
    difficulty: 'medium',
    equipment: ['Medium saucepan', 'Toaster', 'Slotted spoon', 'Small bowls'],
    tips: [
      'Use fresh eggs for the best poaching results',
      'Make sure water is at a gentle simmer, not a rolling boil',
      'Choose ripe but firm avocados for the best texture',
      'Serve immediately for the best experience with runny yolks',
    ],
    nutritionNotes: 'Rich in healthy monounsaturated fats, complete proteins, and fiber. Provides long-lasting energy.',
    allergens: ['eggs', 'gluten'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Grilled Chicken Caesar Power Bowl',
    type: 'lunch',
    description:
      'A protein-packed twist on the classic Caesar salad, featuring perfectly grilled chicken breast over crisp romaine lettuce with a lighter homemade Caesar dressing.',
    calories: 380,
    protein: 35,
    carbs: 12,
    fat: 22,
    fiber: 6,
    sodium: 420,
    sugar: 4,
    cholesterol: 85,
    ingredients: [
      { id: '1', name: 'Chicken breast', amount: 6, unit: 'oz', notes: 'boneless, skinless' },
      { id: '2', name: 'Romaine lettuce', amount: 4, unit: 'cups', notes: 'chopped' },
      { id: '3', name: 'Parmesan cheese', amount: 2, unit: 'tbsp', notes: 'freshly grated' },
      { id: '4', name: 'Roasted chickpeas', amount: 1 / 4, unit: 'cup', notes: 'for crunch' },
      { id: '5', name: 'Greek yogurt', amount: 2, unit: 'tbsp', notes: 'plain, for dressing base' },
      { id: '6', name: 'Lemon juice', amount: 1, unit: 'tbsp', notes: 'fresh squeezed' },
      { id: '7', name: 'Dijon mustard', amount: 1, unit: 'tsp' },
      { id: '8', name: 'Garlic', amount: 1, unit: 'clove', notes: 'minced' },
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        instruction: 'Season chicken breast with salt, pepper, and herbs. Let rest at room temperature for 15 minutes.',
        timeEstimate: 15,
      },
      {
        id: '2',
        step: 2,
        instruction:
          'Preheat grill or grill pan to medium-high heat. Cook chicken for 6-7 minutes per side until internal temperature reaches 165°F.',
        timeEstimate: 14,
        temperature: '165°F internal',
      },
      {
        id: '3',
        step: 3,
        instruction:
          'While chicken cooks, prepare the dressing by whisking together Greek yogurt, lemon juice, Dijon mustard, minced garlic, and half the Parmesan.',
        timeEstimate: 3,
      },
      {
        id: '4',
        step: 4,
        instruction: 'Wash and chop romaine lettuce into bite-sized pieces. Place in a large serving bowl.',
        timeEstimate: 3,
      },
      {
        id: '5',
        step: 5,
        instruction: 'Let chicken rest for 5 minutes, then slice against the grain into strips.',
        timeEstimate: 5,
      },
      {
        id: '6',
        step: 6,
        instruction: 'Toss lettuce with dressing, top with sliced chicken, remaining Parmesan, and roasted chickpeas.',
        timeEstimate: 2,
      },
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    tags: ['high-protein', 'low-carb', 'gluten-free', 'lean', 'post-workout'],
    images: [
      'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
    ],
    difficulty: 'easy',
    equipment: ['Grill or grill pan', 'Meat thermometer', 'Large mixing bowl'],
    tips: [
      'Let chicken rest after cooking to retain juices',
      'Make extra roasted chickpeas for meal prep',
      'Massage lettuce with a pinch of salt for better texture',
    ],
    nutritionNotes:
      'Excellent source of lean protein and probiotics from Greek yogurt. Lower calorie alternative to traditional Caesar.',
    allergens: ['dairy'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    name: 'Herb-Crusted Salmon with Quinoa Pilaf',
    type: 'dinner',
    description:
      'Premium Atlantic salmon with a fragrant herb crust, served alongside fluffy quinoa pilaf with roasted vegetables and a lemon-tahini drizzle.',
    calories: 520,
    protein: 42,
    carbs: 45,
    fat: 18,
    fiber: 8,
    sodium: 340,
    sugar: 6,
    cholesterol: 78,
    ingredients: [
      {
        id: '1',
        name: 'Atlantic salmon fillet',
        amount: 6,
        unit: 'oz',
        notes: 'skin-on, pin bones removed',
      },
      { id: '2', name: 'Quinoa', amount: 1 / 2, unit: 'cup', notes: 'tri-color preferred' },
      {
        id: '3',
        name: 'Mixed vegetables',
        amount: 1,
        unit: 'cup',
        notes: 'bell peppers, zucchini, carrots',
      },
      { id: '4', name: 'Fresh herbs', amount: 2, unit: 'tbsp', notes: 'dill, parsley, chives mix' },
      { id: '5', name: 'Panko breadcrumbs', amount: 1, unit: 'tbsp' },
      { id: '6', name: 'Extra virgin olive oil', amount: 1, unit: 'tbsp' },
      { id: '7', name: 'Lemon', amount: 1, unit: 'medium', notes: 'juiced and zested' },
      { id: '8', name: 'Tahini', amount: 1, unit: 'tsp' },
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        instruction:
          'Preheat oven to 400°F. Rinse quinoa and cook according to package instructions with vegetable broth for extra flavor.',
        timeEstimate: 15,
        temperature: '400°F',
      },
      {
        id: '2',
        step: 2,
        instruction:
          'Dice vegetables into uniform pieces and toss with half the olive oil, salt, and pepper. Roast for 15 minutes.',
        timeEstimate: 20,
      },
      {
        id: '3',
        step: 3,
        instruction:
          'Mix fresh herbs with panko breadcrumbs, lemon zest, and a pinch of salt to create the herb crust.',
        timeEstimate: 3,
      },
      {
        id: '4',
        step: 4,
        instruction:
          'Pat salmon dry, season with salt and pepper. Press herb mixture onto the flesh side of the salmon.',
        timeEstimate: 3,
      },
      {
        id: '5',
        step: 5,
        instruction:
          'Heat an oven-safe skillet over medium-high heat. Sear salmon skin-side up for 3 minutes, then flip and transfer to oven for 8-10 minutes.',
        timeEstimate: 12,
      },
      {
        id: '6',
        step: 6,
        instruction:
          'Whisk tahini with lemon juice and a splash of water. Fluff quinoa and mix with roasted vegetables. Serve salmon over quinoa with tahini drizzle.',
        timeEstimate: 3,
      },
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    tags: ['high-protein', 'omega-3', 'gluten-free', 'heart-healthy', 'anti-inflammatory'],
    images: [
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
    ],
    difficulty: 'medium',
    equipment: ['Oven-safe skillet', 'Medium saucepan', 'Baking sheet', 'Whisk'],
    tips: [
      'Let salmon come to room temperature before cooking',
      'Use a meat thermometer - internal temp should reach 145°F',
      'Toast quinoa in dry pan before adding liquid for nuttier flavor',
      "Don't overcook - salmon should flake easily but still be moist",
    ],
    nutritionNotes:
      'Excellent source of omega-3 fatty acids, complete protein, and complex carbohydrates. Anti-inflammatory and heart-healthy.',
    allergens: ['fish', 'sesame'],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: '4',
    name: 'Greek Yogurt Berry Parfait with Homemade Granola',
    type: 'snack',
    description:
      'Creamy Greek yogurt layered with fresh seasonal berries and crunchy homemade granola, drizzled with raw honey and topped with chopped almonds.',
    calories: 220,
    protein: 15,
    carbs: 30,
    fat: 4,
    fiber: 5,
    sodium: 45,
    sugar: 22,
    cholesterol: 10,
    ingredients: [
      { id: '1', name: 'Greek yogurt', amount: 1, unit: 'cup', notes: 'plain, 2% fat' },
      {
        id: '2',
        name: 'Mixed berries',
        amount: 1 / 2,
        unit: 'cup',
        notes: 'strawberries, blueberries, raspberries',
      },
      { id: '3', name: 'Homemade granola', amount: 2, unit: 'tbsp', notes: 'see recipe notes' },
      { id: '4', name: 'Raw honey', amount: 1, unit: 'tsp' },
      { id: '5', name: 'Sliced almonds', amount: 1, unit: 'tbsp', notes: 'toasted' },
      { id: '6', name: 'Vanilla extract', amount: 1 / 4, unit: 'tsp', notes: 'pure vanilla' },
      { id: '7', name: 'Lemon zest', amount: 1, unit: 'pinch', notes: 'optional, for brightness' },
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        instruction: 'Wash and prepare fresh berries. Hull strawberries and cut into bite-sized pieces if large.',
        timeEstimate: 3,
      },
      {
        id: '2',
        step: 2,
        instruction: 'Mix Greek yogurt with vanilla extract and a tiny pinch of lemon zest if using.',
        timeEstimate: 1,
      },
      {
        id: '3',
        step: 3,
        instruction: 'In a glass or bowl, layer half the yogurt mixture at the bottom.',
        timeEstimate: 1,
      },
      {
        id: '4',
        step: 4,
        instruction: 'Add half the berries and half the granola over the yogurt layer.',
        timeEstimate: 1,
      },
      {
        id: '5',
        step: 5,
        instruction: 'Repeat layers with remaining yogurt, berries, and granola.',
        timeEstimate: 1,
      },
      {
        id: '6',
        step: 6,
        instruction: 'Drizzle with honey and top with toasted sliced almonds. Serve immediately.',
        timeEstimate: 1,
      },
    ],
    prepTime: 8,
    cookTime: 0,
    servings: 1,
    tags: ['vegetarian', 'high-protein', 'antioxidants', 'quick', 'probiotic', 'gluten-free'],
    images: [
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    ],
    difficulty: 'easy',
    equipment: ['Glass or bowl', 'Measuring cups'],
    tips: [
      'Use full-fat Greek yogurt for better satiety',
      'Prepare granola in batches for meal prep',
      'Layer in clear glass to showcase the beautiful colors',
      'Add berries just before serving to prevent soggy granola',
    ],
    nutritionNotes:
      'High in probiotics for gut health, antioxidants from berries, and provides sustained energy from protein and healthy fats.',
    allergens: ['dairy', 'tree nuts'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
];

// Sample client
const sampleClient: Client = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@email.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150',
  dateOfBirth: new Date('1990-05-15'),
  gender: 'female',
  height: 165,
  weight: 68,
  activityLevel: 'moderately_active',
  goals: ['weight_loss', 'muscle_tone'],
  dietaryRestrictions: ['vegetarian'],
  allergies: ['nuts'],
  preferences: ['low_carb', 'high_protein'],
  mealHistory: [],
  joinDate: new Date('2024-01-01'),
  lastActive: new Date('2024-01-16'),
  status: 'active',
  notes: 'Very motivated client, prefers morning workouts',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-16'),
};

export default function AssignMealsPage() {
  const [client] = useState<Client>(sampleClient);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [assignedMeals, setAssignedMeals] = useState<{ [key: string]: DailyMealPlan }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MealType | 'all'>('all');

  const filteredMeals = enhancedSampleMeals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || meal.type === filterType;

    return matchesSearch && matchesType;
  });

  const getMealTypeIcon = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
    }
  };

  const getMealTypeColor = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'lunch':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'dinner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'snack':
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const assignMeal = (meal: Meal, date: string, mealType: MealType) => {
    const assignedMeal: AssignedMeal = {
      meal,
      assignedAt: new Date(),
      completed: false,
      coachNotes: `Assigned for ${mealType} on ${new Date(date).toLocaleDateString()}`,
    };

    setAssignedMeals(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [mealType]: assignedMeal,
        totalCalories: (prev[date]?.totalCalories || 0) + meal.calories,
        totalProtein: (prev[date]?.totalProtein || 0) + meal.protein,
      },
    }));
  };

  const removeMeal = (date: string, mealType: MealType) => {
    setAssignedMeals(prev => {
      const dayPlan = prev[date];
      if (!dayPlan) return prev;

      const mealToRemove = dayPlan[mealType];
      if (!mealToRemove) return prev;

      const updatedDayPlan = {
        ...dayPlan,
        [mealType]: undefined,
        totalCalories: dayPlan.totalCalories - mealToRemove.meal.calories,
        totalProtein: dayPlan.totalProtein - mealToRemove.meal.protein,
      };

      return {
        ...prev,
        [date]: updatedDayPlan,
      };
    });
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/clients/${client.id}`} className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="text-2xl font-bold text-gray-900">Assign Meals</div>
              <div className="hidden sm:block text-sm text-gray-500">for {client.name}</div>
            </div>

            <div className="flex items-center gap-4">
              <Link href={`/clients/${client.id}`} className="text-gray-600 hover:text-gray-900 font-medium">
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meal Selection Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Meals</h2>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search meals..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as MealType | 'all')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Meals</option>
                    <option value="breakfast">🌅 Breakfast</option>
                    <option value="lunch">☀️ Lunch</option>
                    <option value="dinner">🌙 Dinner</option>
                    <option value="snack">🍎 Snack</option>
                  </select>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="p-6">
                <div className="grid gap-4">
                  {filteredMeals.map(meal => (
                    <div
                      key={meal.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        {/* Meal Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          {meal.images[0] ? (
                            <Image
                              src={meal.images[0]}
                              alt={meal.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">
                              {getMealTypeIcon(meal.type)}
                            </div>
                          )}
                        </div>

                        {/* Meal Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{meal.name}</h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{meal.description}</p>

                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-gray-900">{meal.calories}</span> cal
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-gray-900">{meal.protein}g</span> protein
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {meal.prepTime + meal.cookTime} min
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getMealTypeColor(meal.type)}`}
                                >
                                  {getMealTypeIcon(meal.type)} {meal.type}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(meal.difficulty)}`}
                                >
                                  {meal.difficulty}
                                </span>
                                {meal.tags.slice(0, 2).map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Assign Button */}
                            <button
                              onClick={() => assignMeal(meal, selectedDate, selectedMealType)}
                              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Assign to {selectedMealType}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="space-y-6">
            {/* Date & Meal Type Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedMealType(type)}
                        className={`p-2 rounded-lg border text-sm font-medium transition-colors ${selectedMealType === type ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {getMealTypeIcon(type)} {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Plan</h3>

              <div className="space-y-3">
                {getNext7Days().map(date => {
                  const dayPlan = assignedMeals[date];
                  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                  const dayDate = new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div key={date} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {dayName}, {dayDate}
                        </div>
                        {dayPlan && (
                          <div className="text-sm text-gray-500">
                            {dayPlan.totalCalories} cal • {dayPlan.totalProtein}g protein
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mealType => {
                          const assignedMeal = dayPlan?.[mealType];
                          return (
                            <div
                              key={mealType}
                              className={`p-2 rounded border ${assignedMeal ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{getMealTypeIcon(mealType)}</span>
                                {assignedMeal && (
                                  <button
                                    onClick={() => removeMeal(date, mealType)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              {assignedMeal && (
                                <div className="mt-1 font-medium truncate">{assignedMeal.meal.name}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Info</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Goals:</span>
                  <span className="font-medium">{client.goals.join(', ').replace(/_/g, ' ')}</span>
                </div>

                {client.dietaryRestrictions.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Restrictions:</span>
                    <span className="font-medium">{client.dietaryRestrictions.join(', ')}</span>
                  </div>
                )}

                {client.allergies.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Allergies:</span>
                    <span className="font-medium text-red-600">{client.allergies.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
