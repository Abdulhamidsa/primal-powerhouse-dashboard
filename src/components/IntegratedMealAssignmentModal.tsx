'use client';


import { ThumbsUpIcon } from '@phosphor-icons/react';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Meal, Client } from '@/types/meal';
import { DataService } from '@/services/dataService';
import { clientApi } from '@/lib/client-api';
import { MealAssignmentService } from '@/services/mealAssignmentService';
import { useSideLibrary } from '@/features/sides/hooks/useSideLibrary';
import type { SideItem } from '@/features/sides/types/side.types';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';
import { XIcon as X, MagnifyingGlassIcon as Search, CalendarIcon as Calendar, PencilSimpleIcon as Edit, UserIcon as User, CheckIcon as Check, ClockIcon as Clock, UsersIcon as Users, ForkKnifeIcon as Utensils, FloppyDiskIcon as Save, SunHorizonIcon as Sunrise, SunIcon as Sun, MoonIcon as Moon, OrangeIcon as Apple, WarningCircleIcon as AlertCircle, LeafIcon as Leaf } from '@phosphor-icons/react';
import AdvancedMealPersonalization from './AdvancedMealPersonalization';

// Days of week configuration
const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function OptimizedSideThumbnail({ src, alt }: { src: string; alt: string }) {
  const image = getMealImageDelivery(src, 'thumbnail');

  return (
    <span className="relative block w-10 h-10 overflow-hidden rounded shrink-0">
      <Image
        src={image.src}
        alt={alt}
        fill
        className="object-cover"
        sizes="40px"
        unoptimized={image.unoptimized}
      />
    </span>
  );
}

// Meal types with icons
const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'snack', label: 'Snack', icon: Apple },
] as const;

const validMealTypeValues = mealTypes.map(type => type.value);

function isValidSlotMealType(value: string): value is (typeof mealTypes)[number]['value'] {
  return validMealTypeValues.includes(value as (typeof mealTypes)[number]['value']);
}

function normalizeIngredientForPersistence(ingredient: unknown): unknown {
  if (typeof ingredient === 'string') {
    const trimmed = ingredient.trim();
    if (!trimmed || trimmed === '[object Object]') {
      return '';
    }
    return trimmed;
  }

  if (!ingredient || typeof ingredient !== 'object') {
    return '';
  }

  const value = ingredient as Record<string, unknown>;
  const nestedIngredient =
    value.ingredient && typeof value.ingredient === 'object' && !Array.isArray(value.ingredient)
      ? (value.ingredient as Record<string, unknown>)
      : null;

  const name =
    (typeof value.name === 'string' ? value.name : '') ||
    (typeof nestedIngredient?.name === 'string' ? nestedIngredient.name : '');
  const amount = typeof value.amount === 'number' ? value.amount : null;
  const unit = typeof value.unit === 'string' ? value.unit : null;

  // Preserve structured ingredient snapshots used for live macro recalculation.
  if ('foodId' in value || 'nutritionPer100g' in value || 'grams' in value) {
    return value;
  }

  if (!name) {
    return '';
  }

  if (amount !== null && unit) {
    return `${amount} ${unit} ${name}`;
  }

  return name;
}

function normalizeInstructionForPersistence(instruction: unknown): string {
  if (typeof instruction === 'string') {
    const trimmed = instruction.trim();
    return trimmed && trimmed !== '[object Object]' ? trimmed : '';
  }

  if (!instruction || typeof instruction !== 'object') {
    return '';
  }

  const value = instruction as Record<string, unknown>;
  const direct =
    (typeof value.instruction === 'string' ? value.instruction : '') ||
    (typeof value.stepText === 'string' ? value.stepText : '') ||
    (typeof value.text === 'string' ? value.text : '') ||
    (typeof value.description === 'string' ? value.description : '');

  const trimmed = direct.trim();
  return trimmed && trimmed !== '[object Object]' ? trimmed : '';
}

interface IntegratedMealAssignmentModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  clientId?: string;
  onAssignedAction?: () => void; // Callback when meals are successfully assigned
}

export default function IntegratedMealAssignmentModal({
  isOpen,
  onCloseAction,
  clientId,
  onAssignedAction,
}: IntegratedMealAssignmentModalProps) {
  // State for data
  const [meals, setMeals] = useState<Meal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<{
    [key: string]: {
      mealId: string;
      isPersonalized: boolean;
      personalizedMeal?: Meal;
      originalMealId?: string;
      meal?: Meal;
      needsSaving?: boolean;
      alreadySaved?: boolean;
    };
  }>({});
  const [selectedSides, setSelectedSides] = useState<Record<string, string>>({}); // dayOfWeek_mealType -> sideId
  const [sidePickerSlot, setSidePickerSlot] = useState<string | null>(null); // slot key currently showing picker

  // Load sides library
  const { sides, loadSides } = useSideLibrary();

  // State for UI control
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  const [activeTab, setActiveTab] = useState<'select-meals' | 'schedule'>('select-meals');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [mealTypeFilter, setMealTypeFilter] = useState<string | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // State for personalization
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [mealToPersonalize, setMealToPersonalize] = useState<Meal | null>(null);

  // State for meal plan details
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // State for notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for existing meal plans
  const [existingMealPlans, setExistingMealPlans] = useState<any[]>([]);
  const [hasExistingActivePlan, setHasExistingActivePlan] = useState(false);
  const [isEditingExistingPlan, setIsEditingExistingPlan] = useState(false);
  const [activeMealPlan, setActiveMealPlan] = useState<any | null>(null);

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
      checkExistingMealPlans(clientId || selectedClientId || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientId]);

  // When selecting a client inside the modal (without fixed clientId prop), reload existing plan assignments
  useEffect(() => {
    if (isOpen && !clientId && selectedClientId) {
      checkExistingMealPlans(selectedClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientId, selectedClientId]);

  // Check for existing meal plans and load meal assignments
  const checkExistingMealPlans = async (targetClientId?: string) => {
    if (targetClientId) {
      try {
        console.log(`Checking for existing meal plans for client: ${targetClientId}`);

        // Fetch existing meal plans for the client
        const response = await fetch(`/api/meal-plans?clientId=${targetClientId}`);

        // Check if we got a 404 - this could be because the API endpoint doesn't exist yet
        if (response.status === 404) {
          console.warn(`API endpoint not found: /api/meal-plans?clientId=${targetClientId}`);
          console.warn('This is likely because the API route has not been created yet.');
          console.warn('Falling back to creating a new meal plan');
          initializeMealPlan();
          return;
        }

        if (response.ok) {
          const plans = await response.json();
          console.log(`Found ${plans.length} meal plans for client ${targetClientId}`);

          setExistingMealPlans(plans);

          // Check if there's an active plan
          const activePlan = plans.find((plan: any) => plan.isActive);
          if (activePlan) {
            console.log('Found active meal plan:', activePlan);
            setActiveMealPlan(activePlan);
            setHasExistingActivePlan(true);
            setIsEditingExistingPlan(true); // Set to editing mode

            // Pre-fill the form with the active plan data
            setPlanName(activePlan.name || '');
            if (activePlan.startDate) {
              setStartDate(new Date(activePlan.startDate).toISOString().split('T')[0]);
            }
            if (activePlan.endDate) {
              setEndDate(new Date(activePlan.endDate).toISOString().split('T')[0]);
            }
            if (activePlan.notes) {
              setNotes(activePlan.notes);
            }

            // Set active tab to schedule by default when there's an existing plan
            setActiveTab('schedule');

            // Check if the plan has meal assignments included
            if (activePlan.mealAssignments && activePlan.mealAssignments.length > 0) {
              console.log('Using meal assignments from the plan response');
              const assignments = activePlan.mealAssignments;
              processExistingMealAssignments(assignments);
            } else {
              console.log('Active plan has no meal assignments yet. Initializing empty selections.');
              setSelectedMeals({}); // Start with empty selections
            }
          } else {
            console.log('No active meal plan found. Initializing new plan.');
            initializeMealPlan();
          }
        } else {
          console.error(`Failed to fetch meal plans: ${response.status}`);
          console.error('Error response:', await response.text());
          initializeMealPlan();
        }
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        initializeMealPlan();
      }
    } else {
      console.log('No client ID provided. Initializing new plan.');
      initializeMealPlan();
    }
  };

  // Helper function to process existing meal assignments
  const processExistingMealAssignments = (assignments: any[]) => {
    console.log('Processing existing meal assignments:', assignments);

    // Convert existing assignments to the selectedMeals format
    const mealMap: {
      [key: string]: {
        mealId: string;
        isPersonalized: boolean;
        personalizedMeal?: Meal;
        originalMealId?: string;
        meal?: Meal;
      };
    } = {};

    // Also collect meal data to add to our meals array
    const mealsToAdd: Meal[] = [];

    // Process each assignment and add it to the map
    for (const assignment of assignments) {
      console.log('Processing assignment:', assignment);

      // Handle different formats of mealType with proper null checking
      // Use strict checks to allow dayOfWeek = 0 (Sunday)
      if (!assignment || !assignment.mealType || assignment.dayOfWeek === null || assignment.dayOfWeek === undefined) {
        console.warn('Invalid assignment data, skipping:', assignment);
        continue;
      }

      let mealTypeKey = assignment.mealType;
      if (typeof mealTypeKey === 'string') {
        mealTypeKey = mealTypeKey.toLowerCase();
      } else {
        console.warn('Meal type is not a string, skipping:', assignment);
        continue;
      }

      const key = `${assignment.dayOfWeek}_${mealTypeKey}`;

      // Check if we have meal data directly in the assignment
      if (assignment.meal) {
        console.log('Assignment has meal data:', assignment.meal.name);
        // Check if this is a personalized meal and log the originalMealId
        if (assignment.meal.isPersonalized && assignment.meal.originalMealId) {
          console.log(`  → Personalized meal. Original meal ID: ${assignment.meal.originalMealId}`);
        }
        // Add this meal to our collection to update the meals array
        mealsToAdd.push(assignment.meal);
      }

      // Extract originalMealId from the meal data (not from assignment directly)
      const originalMealId = assignment.meal?.originalMealId || assignment.originalMealId;

      mealMap[key] = {
        mealId: assignment.mealId,
        isPersonalized: assignment.meal?.isPersonalized || assignment.isPersonalized || false,
        // If the meal is already included in the assignment, use it
        meal: assignment.meal,
        personalizedMeal: assignment.meal?.isPersonalized ? assignment.meal : undefined,
        // Get originalMealId from the meal object (this is where it's stored)
        originalMealId: originalMealId,
      };

      console.log(`  Mapped to slot ${key}:`, {
        mealId: assignment.mealId,
        isPersonalized: mealMap[key].isPersonalized,
        originalMealId: originalMealId,
      });
    }

    // Update our meals array with any meals from assignments
    if (mealsToAdd.length > 0) {
      console.log(`Adding ${mealsToAdd.length} meals from assignments to meals array`);
      setMeals(prevMeals => {
        // Filter out duplicates
        const newMeals = mealsToAdd.filter(newMeal => !prevMeals.some(existingMeal => existingMeal.id === newMeal.id));
        return [...prevMeals, ...newMeals];
      });
    }

    console.log('Setting selectedMeals with mapped data:', mealMap);
    setSelectedMeals(mealMap);

    // Check if we need to load personalized meals separately
    const personalizedAssignments = assignments.filter((a: any) => a.isPersonalized && !a.meal);

    if (personalizedAssignments.length > 0) {
      console.log(`Loading ${personalizedAssignments.length} personalized meals that don't have meal data`);
      loadPersonalizedMeals(personalizedAssignments, mealMap);
    }
  };

  // Helper function to load personalized meal details
  const loadPersonalizedMeals = async (personalizedAssignments: any[], mealMap: { [key: string]: any }) => {
    try {
      for (const assignment of personalizedAssignments) {
        const mealResponse = await fetch(`/api/meals/${assignment.mealId}`);
        if (mealResponse.ok) {
          const mealData = await mealResponse.json();

          // Add the personalized meal data to our map
          const key = `${assignment.dayOfWeek}_${assignment.mealType.toLowerCase()}`;
          if (mealMap[key]) {
            mealMap[key].personalizedMeal = mealData;
            if (assignment.originalMealId) {
              mealMap[key].originalMealId = assignment.originalMealId;
            }
          }
        }
      }
      // Update the selected meals with the personalized data
      setSelectedMeals({ ...mealMap });
    } catch (error) {
      console.error('Error loading personalized meals:', error);
    }
  };

  // Initialize meal plan with default values
  const initializeMealPlan = () => {
    // Set default plan name and dates
    const today = new Date();

    // Start with empty plan name, will be updated when client is selected
    setPlanName('');

    // Set dates
    setStartDate(today.toISOString().split('T')[0]);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  };

  // Fetch meals and clients data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch meals
      let mealsData: Meal[];
      try {
        // Pass clientId to get personalized meals for this client
        mealsData = await DataService.getMeals(selectedClientId || clientId);

        // Transform meals to ensure images array is populated from imageUrl if needed
        mealsData = mealsData.map(meal => {
          // If meal has imageUrl but no images array, convert it
          if ((meal as any).imageUrl && (!meal.images || meal.images.length === 0)) {
            return {
              ...meal,
              images: [(meal as any).imageUrl],
            };
          }
          // If meal has images array, ensure it's not empty by checking imageUrl as fallback
          if ((!meal.images || meal.images.length === 0) && (meal as any).imageUrl) {
            return {
              ...meal,
              images: [(meal as any).imageUrl],
            };
          }
          return meal;
        });
      } catch (error) {
        console.error('Error fetching meals from API:', error);

        // Fallback to mock data if API fails
        mealsData = [
          {
            id: '1',
            name: 'Grilled Chicken Bowl',
            type: 'lunch',
            description: 'A healthy lunch bowl with grilled chicken.',
            calories: 450,
            protein: 35,
            carbs: 40,
            fat: 12,
            fiber: 6,
            sodium: 400,
            sugar: 3,
            cholesterol: 70,
            ingredients: [
              { id: '1', name: 'Chicken Breast', amount: 150, unit: 'g' },
              { id: '2', name: 'Brown Rice', amount: 100, unit: 'g' },
              { id: '3', name: 'Broccoli', amount: 80, unit: 'g' },
              { id: '4', name: 'Olive Oil', amount: 10, unit: 'ml' },
            ],
            instructions: [
              { id: '1', step: 1, instruction: 'Season the chicken breast with salt and pepper.' },
              { id: '2', step: 2, instruction: 'Grill the chicken for about 6-8 minutes on each side.' },
              { id: '3', step: 3, instruction: 'Cook the brown rice according to package instructions.' },
              { id: '4', step: 4, instruction: 'Steam the broccoli until tender.' },
              { id: '5', step: 5, instruction: 'Assemble the bowl and drizzle with olive oil.' },
            ],
            prepTime: 10,
            cookTime: 25,
            servings: 1,
            tags: ['high-protein', 'meal-prep', 'healthy'],
            images: ['https://picsum.photos/id/102/800/600'],
            difficulty: 'easy',
            equipment: ['Grill', 'Pot'],
            tips: ['You can meal prep this by making multiple servings at once.'],
            allergens: ['none'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Berry Protein Smoothie',
            type: 'breakfast',
            description: 'A quick and nutritious protein smoothie with mixed berries.',
            calories: 320,
            protein: 25,
            carbs: 30,
            fat: 8,
            fiber: 5,
            sodium: 120,
            sugar: 15,
            cholesterol: 5,
            ingredients: [
              { id: '1', name: 'Protein Powder', amount: 30, unit: 'g' },
              { id: '2', name: 'Mixed Berries', amount: 100, unit: 'g' },
              { id: '3', name: 'Greek Yogurt', amount: 100, unit: 'g' },
              { id: '4', name: 'Almond Milk', amount: 200, unit: 'ml' },
            ],
            instructions: [
              { id: '1', step: 1, instruction: 'Add all ingredients to a blender.' },
              { id: '2', step: 2, instruction: 'Blend until smooth.' },
            ],
            prepTime: 5,
            cookTime: 0,
            servings: 1,
            tags: ['high-protein', 'quick', 'breakfast'],
            images: ['https://picsum.photos/id/109/800/600'],
            difficulty: 'easy',
            equipment: ['Blender'],
            tips: ['You can add ice for a thicker consistency.'],
            allergens: ['dairy'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }

      setMeals(mealsData);

      // If clientId is provided, don't fetch clients
      if (clientId) {
        try {
          console.log('Fetching specific client with ID:', clientId);
          // Get the specific client
          const clientData = await DataService.getClientById(clientId);

          // Map activity level from API format to expected format
          const mapActivityLevel = (apiLevel: string): string => {
            const mapping: { [key: string]: string } = {
              LOW: 'sedentary',
              MODERATE: 'moderately_active',
              HIGH: 'very_active',
              sedentary: 'sedentary',
              lightly_active: 'lightly_active',
              moderately_active: 'moderately_active',
              very_active: 'very_active',
              extremely_active: 'extremely_active',
            };
            return mapping[apiLevel] || 'moderately_active';
          };

          // Map the client data to match the expected type
          const client = {
            ...clientData,
            activityLevel: mapActivityLevel(clientData.activityLevel || 'moderately_active') as
              | 'sedentary'
              | 'lightly_active'
              | 'moderately_active'
              | 'very_active'
              | 'extremely_active',
          } as unknown as Client;
          setClients([client]);
          setSelectedClientId(clientId);
          setPlanName(`${client.name}'s Meal Plan`);
        } catch (error) {
          console.error('Error fetching client:', error);
          alert(`The client with ID ${clientId} could not be found. Please try again or select another client.`);
          // Reset selected client ID to avoid further errors
          setSelectedClientId(null);

          // Fetch all clients as a fallback
          try {
            const clientsData = await DataService.getClients();
            setClients(clientsData as unknown as Client[]);
          } catch (clientsError) {
            console.error('Error fetching all clients:', clientsError);
            // Use fallback mock data below
          }
        }
      } else {
        // Fetch all clients
        try {
          const clientsData = await DataService.getClients();
          setClients(clientsData as unknown as Client[]);
        } catch (error) {
          console.error('Error fetching clients:', error);
          // Fallback mock data
          setClients([
            {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
              activityLevel: 'moderately_active',
              goals: ['weight loss'],
              dietaryRestrictions: [],
              allergies: [],
              preferences: [],
              mealHistory: [],
              joinDate: new Date(),
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: '2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              activityLevel: 'very_active',
              goals: ['muscle gain'],
              dietaryRestrictions: [],
              allergies: [],
              preferences: [],
              mealHistory: [],
              joinDate: new Date(),
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      // Load sides library
      await loadSides();
      setLoading(false);
    }
  };

  // Filter meals: only show original (non-personalized) meals, filter by type and search
  const filteredMeals = meals.filter(meal => {
    // First, exclude personalized meals - only show templates/originals
    // Check if isPersonalized exists and is true
    if ('isPersonalized' in meal && meal.isPersonalized === true) return false;

    // Filter by meal type if one is selected
    if (mealTypeFilter && mealTypeFilter !== 'all') {
      const mealType = typeof meal.type === 'string' ? meal.type.toLowerCase() : '';
      if (mealType !== mealTypeFilter.toLowerCase()) return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = (meal?.name?.toLowerCase() || '').includes(searchLower);
      const matchesDescription = (meal?.description?.toLowerCase() || '').includes(searchLower);
      const matchesTags = (meal?.tags || []).some(tag => (tag?.toLowerCase() || '').includes(searchLower));
      return matchesName || matchesDescription || matchesTags;
    }

    return true;
  });

  // Get all meal IDs that are currently assigned (to prevent duplicates)
  const assignedMealIds = new Set(
    Object.values(selectedMeals)
      .map(selection => selection.mealId)
      .filter(Boolean),
  );

  // Also track original meal IDs for personalized meals
  const assignedOriginalMealIds = new Set(
    Object.values(selectedMeals)
      .map(selection => selection.originalMealId)
      .filter(Boolean),
  );

  // Debug logging for assigned meals
  console.log('Currently assigned meal IDs:', Array.from(assignedMealIds));
  console.log('Currently assigned original meal IDs:', Array.from(assignedOriginalMealIds));

  // Check if a meal is assigned to any slot (either directly or as the original of a personalized meal)
  const isMealAssigned = (mealId: string): boolean => {
    const isAssigned = assignedMealIds.has(mealId) || assignedOriginalMealIds.has(mealId);
    if (isAssigned) {
      console.log(
        `Meal ${mealId} is assigned (direct: ${assignedMealIds.has(mealId)}, as original: ${assignedOriginalMealIds.has(mealId)})`,
      );
    }
    return isAssigned;
  };

  // Get the slot where a meal is assigned (if any)
  const getMealAssignmentSlot = (mealId: string): { day: number; mealType: string } | null => {
    for (const [key, selection] of Object.entries(selectedMeals)) {
      // Check if this meal is directly assigned OR if this is the original of a personalized meal
      if (selection.mealId === mealId || selection.originalMealId === mealId) {
        const [dayOfWeek, mealType] = key.split('_');
        return { day: parseInt(dayOfWeek), mealType };
      }
    }
    return null;
  };

  // Handle personalization of a meal
  const handlePersonalizeMeal = (meal: Meal) => {
    console.log('Personalizing meal with ID:', meal.id);
    setMealToPersonalize(meal);
    setShowPersonalizationModal(true);
  };

  // Handle saving personalized meal
  const handleSavePersonalizedMeal = async (
    personalizedMeal: Meal,
    clientId?: string,
    originalMealId?: string,
  ): Promise<void> => {
    try {
      setLoading(true);
      console.log('Saving personalized meal in IntegratedMealAssignmentModal:', personalizedMeal.name);
      console.log('Original meal ID:', originalMealId);
      console.log('For client ID:', clientId || selectedClientId);

      // If we have a day and meal type selected, assign the personalized meal to that slot
      if (selectedDay !== null && selectedMealType !== null && selectedClientId) {
        if (!isValidSlotMealType(selectedMealType)) {
          console.error('Invalid selected meal type for slot assignment:', selectedMealType);
          alert('Please select a valid meal slot from the schedule before personalizing.');
          return;
        }

        const key = `${selectedDay}_${selectedMealType}`;

        console.log('Adding personalized meal to slot:', key);

        // Make sure we have the original meal ID from the meal being personalized
        let originalId = originalMealId;
        if (!originalId && mealToPersonalize) {
          originalId = mealToPersonalize.id;
          console.log('Using mealToPersonalize.id as originalMealId:', originalId);
        }

        // First, save the personalized meal to the database to get a real ID
        try {
          console.log('Saving personalized meal to database before adding to plan');
          console.log('Client ID for personalization:', selectedClientId);

          if (!selectedClientId) {
            throw new Error('No client selected for meal personalization');
          }

          // Use client-side safe API to create personalized meal
          const mealData = {
            name: personalizedMeal.name,
            description: personalizedMeal.description,
            ingredients: Array.isArray(personalizedMeal.ingredients)
              ? personalizedMeal.ingredients.map(normalizeIngredientForPersistence).filter(Boolean)
              : [],
            instructions: Array.isArray(personalizedMeal.instructions)
              ? personalizedMeal.instructions.map(normalizeInstructionForPersistence).filter(Boolean)
              : [],
            calories: personalizedMeal.calories,
            protein: personalizedMeal.protein,
            carbs: personalizedMeal.carbs,
            fat: personalizedMeal.fat,
            fiber: personalizedMeal.fiber,
            prepTime: personalizedMeal.prepTime,
            cookTime: personalizedMeal.cookTime,
            servings: personalizedMeal.servings,
            // Support both images array and imageUrl field
            imageUrl: personalizedMeal.images?.[0] || (personalizedMeal as any).imageUrl || null,
            tags: personalizedMeal.tags,
            // Convert meal type to uppercase format to match Prisma enum
            type:
              typeof personalizedMeal.type === 'string' ? personalizedMeal.type.toUpperCase() : personalizedMeal.type,
          };

          const savedMeal = await clientApi.createPersonalizedMeal(
            mealData,
            selectedClientId || clientId!, // Make sure we pass the selected client ID
            originalId,
          );

          // Format the response to match what the component expects
          const savedMealResult = {
            meal: savedMeal as unknown as Meal,
            client: { id: selectedClientId || clientId!, name: 'Client' },
          };
          console.log('Personalized meal saved to database:', savedMealResult.meal.id);

          // Use the saved meal ID and data
          personalizedMeal = savedMealResult.meal;

          // Store the personalized meal in the selected slot with reference to original meal
          setSelectedMeals(prev => ({
            ...prev,
            [key]: {
              mealId: personalizedMeal.id, // Use the real saved ID
              isPersonalized: true,
              personalizedMeal: personalizedMeal,
              originalMealId: originalId,
              // Even if meal assignment failed, we have the meal data
              alreadySaved: true,
            },
          }));

          setShowPersonalizationModal(false);
          // Set success message
          setSuccessMessage('Meal personalized and added to plan! It has been saved to the database.');

          // Create a more visible notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-[9999] animate-fade-in';
          notification.style.background = 'var(--color-success-bg)';
          notification.style.color = 'var(--color-success)';
          notification.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-full bg-white bg-opacity-20">
                <ThumbsUpIcon size="20" aria-hidden="true" focusable="false" />
              </div>
              <div>
                <p class="font-medium">Meal personalized successfully!</p>
                <p class="text-sm opacity-80">Saved to database with ID: ${personalizedMeal.id}</p>
              </div>
            </div>
          `;

          document.body.appendChild(notification);

          // Remove the notification after 4 seconds
          setTimeout(() => {
            notification.classList.add('animate-fade-out');
            setTimeout(() => notification.remove(), 300);
          }, 4000);

          // Clear success message after a few seconds
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (saveError) {
          console.error('Error saving personalized meal to database:', saveError);
          alert(
            `Failed to save personalized meal to database: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
          );

          // If saving to database fails, we still want to show the personalized meal in the UI
          // but we need to mark it with a temporary ID that indicates it needs to be saved
          setSelectedMeals(prev => ({
            ...prev,
            [key]: {
              mealId: personalizedMeal.id,
              isPersonalized: true,
              personalizedMeal: personalizedMeal,
              originalMealId: originalId,
              needsSaving: true, // Mark this meal as needing to be saved
            },
          }));

          setShowPersonalizationModal(false);
          setSuccessMessage(
            'Meal personalized but could not be saved to database. Will try again when creating meal plan.',
          );
        }
      }
    } catch (error) {
      console.error('Error handling personalized meal:', error);
      alert(`Error handling personalized meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Assign a meal to a slot without personalization
  const handleAssignMeal = (meal: Meal) => {
    if (selectedDay !== null && selectedMealType !== null) {
      if (!isValidSlotMealType(selectedMealType)) {
        alert('Please select a valid meal slot from the schedule before assigning.');
        return;
      }

      // Check if this meal is already assigned somewhere
      if (isMealAssigned(meal.id)) {
        const assignmentSlot = getMealAssignmentSlot(meal.id);
        if (assignmentSlot) {
          const dayName = daysOfWeek.find(d => d.value === assignmentSlot.day)?.label || 'Unknown day';
          const mealTypeName = mealTypes.find(m => m.value === assignmentSlot.mealType)?.label || 'Unknown type';
          alert(
            `This meal is already assigned to ${dayName}'s ${mealTypeName}. Remove it from there first if you want to assign it elsewhere.`,
          );
          return;
        }
      }

      const key = `${selectedDay}_${selectedMealType}`;

      console.log(
        `Assigning meal "${meal.name}" (ID: ${meal.id}) to ${mealTypes.find(m => m.value === selectedMealType)?.label} on ${daysOfWeek.find(d => d.value === selectedDay)?.label}`,
      );

      setSelectedMeals(prev => ({
        ...prev,
        [key]: { mealId: meal.id, isPersonalized: false },
      }));

      setActiveTab('schedule');
      setSuccessMessage(
        `"${meal.name}" added to ${daysOfWeek.find(d => d.value === selectedDay)?.label}'s ${mealTypes.find(m => m.value === selectedMealType)?.label}!`,
      );

      // Show more detailed message
      alert(
        `"${meal.name}" has been added to your meal plan for ${daysOfWeek.find(d => d.value === selectedDay)?.label}'s ${mealTypes.find(m => m.value === selectedMealType)?.label}. Click "Create Meal Plan" to save all assignments.`,
      );

      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      // If no day or meal type is selected, show an instruction to the user
      alert('Please select a day and meal type from the schedule first, then click "Assign" on a meal.');
      setActiveTab('schedule');
    }
  };

  // Get the meal assigned to a specific slot
  const getMealForSlot = (dayOfWeek: number, mealType: string) => {
    if (dayOfWeek === undefined || !mealType) return null;

    const key = `${dayOfWeek}_${mealType}`;
    const selection = selectedMeals[key];

    if (!selection || !selection.mealId) return null;

    // If this is a personalized meal and we have the meal data, return it
    if (selection.isPersonalized && selection.personalizedMeal) {
      return selection.personalizedMeal;
    }

    // If the meal object is directly attached to the selection (from API)
    if (selection.meal) {
      return selection.meal;
    }

    // Try to find the meal in our local meals array
    const foundMeal = meals.find(meal => meal.id === selection.mealId);
    if (foundMeal) {
      return foundMeal;
    }

    // If we don't have the meal data yet, fetch it asynchronously and update
    if (selection.mealId) {
      // Create a placeholder meal with the ID and basic info while we fetch
      const placeholderMeal: Partial<Meal> = {
        id: selection.mealId,
        name: 'Loading meal...',
        calories: 0,
        protein: 0,
        prepTime: 0,
        cookTime: 0,
        type: 'breakfast',
        ingredients: [],
        instructions: [],
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Fetch the meal data asynchronously
      fetch(`/api/meals/${selection.mealId}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error(`Failed to fetch meal: ${response.status}`);
        })
        .then(mealData => {
          // Update the meals array with this new meal
          setMeals(prevMeals => {
            // Check if meal already exists
            if (prevMeals.some(m => m.id === mealData.id)) {
              return prevMeals;
            }
            return [...prevMeals, mealData];
          });

          // If this is a personalized meal, update the selection
          if (selection.isPersonalized) {
            setSelectedMeals(prev => ({
              ...prev,
              [key]: {
                ...prev[key],
                personalizedMeal: mealData,
              },
            }));
          }
        })
        .catch(error => console.error('Error fetching meal:', error));

      // Return placeholder while fetching
      return placeholderMeal as Meal;
    }

    return null;
  };

  // Remove a meal from a slot
  const removeMealFromSlot = (dayOfWeek: number, mealType: string) => {
    if (dayOfWeek === undefined || !mealType) {
      console.error('Cannot remove meal: invalid slot', { dayOfWeek, mealType });
      return;
    }

    const key = `${dayOfWeek}_${mealType}`;
    console.log('Removing meal from slot:', key);

    setSelectedMeals(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Get side for a specific slot
  const getSideForSlot = (dayOfWeek: number, mealType: string): SideItem | null => {
    const key = `${dayOfWeek}_${mealType}`;
    const sideId = selectedSides[key];
    if (!sideId) return null;
    return sides.find(side => side.id === sideId) || null;
  };

  // Handle side selection
  const handleSideSelect = (dayOfWeek: number, mealType: string, sideId: string) => {
    const key = `${dayOfWeek}_${mealType}`;
    if (sideId === '') {
      setSelectedSides(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      setSelectedSides(prev => ({
        ...prev,
        [key]: sideId,
      }));
    }
  };

  // Remove a side from a slot
  const removeSideFromSlot = (dayOfWeek: number, mealType: string) => {
    const key = `${dayOfWeek}_${mealType}`;
    setSelectedSides(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSelectMealSlot = (dayOfWeek: number, mealType: string) => {
    if (dayOfWeek === undefined || !mealType) {
      console.error('Invalid day or meal type', { dayOfWeek, mealType });
      return;
    }
    setSelectedDay(dayOfWeek);
    setSelectedMealType(mealType);
    setMealTypeFilter(mealType);
    setActiveTab('select-meals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit the meal plan
  const handleSubmitMealPlan = async () => {
    if (!selectedClientId || !planName || !startDate || Object.keys(selectedMeals).length === 0) {
      alert('Please fill in all required fields and add at least one meal.');
      return;
    }

    // If client has an existing active plan, we always want to edit it rather than create a new one
    if (hasExistingActivePlan && !isEditingExistingPlan) {
      console.log('Setting isEditingExistingPlan to true because user has an existing active plan');
      setIsEditingExistingPlan(true);
      setActiveMealPlan(existingMealPlans.find(plan => plan.isActive) || null);

      // Show a notification that we're updating the existing plan
      const notificationOverlay = document.createElement('div');
      notificationOverlay.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fade-in';
      notificationOverlay.style.zIndex = '9999';

      const notificationDialog = document.createElement('div');
      notificationDialog.className = 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md animate-slide-up';
      notificationDialog.style.background = 'var(--color-surface)';
      notificationDialog.style.color = 'var(--color-text)';
      notificationDialog.style.borderColor = 'var(--color-border)';

      notificationDialog.innerHTML = `
        <div class="mb-4">
          <h3 class="text-lg font-bold mb-2">Updating Existing Meal Plan</h3>
          <p class="text-sm mb-4">This client already has an active meal plan. We will update the existing plan with your changes.</p>
          <div class="p-3 rounded-lg mb-4" style="background: var(--color-bg-alt)">
            <p class="text-sm font-medium">Current Active Plan: ${existingMealPlans.find(plan => plan.isActive)?.name || 'Unnamed Plan'}</p>
            <p class="text-xs mt-1" style="color: var(--color-text-muted)">Created on: ${new Date(existingMealPlans.find(plan => plan.isActive)?.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="flex justify-center">
          <button id="continue-update" class="px-6 py-2 rounded" style="background: var(--color-accent); color: var(--color-text-on-accent)">Continue</button>
        </div>
      `;

      notificationOverlay.appendChild(notificationDialog);
      document.body.appendChild(notificationOverlay);

      // Return a promise that resolves when the user confirms
      return new Promise(resolve => {
        document.getElementById('continue-update')?.addEventListener('click', () => {
          notificationOverlay.classList.add('animate-fade-out');
          setTimeout(() => notificationOverlay.remove(), 300);
          resolve(true);
        });
      });
    }

    try {
      setLoading(true);
      console.log('Starting meal plan submission for client:', selectedClientId);
      console.log('Selected meals:', selectedMeals);
      console.log('Is editing existing plan:', isEditingExistingPlan);
      console.log('Active meal plan:', activeMealPlan);
      console.log('Has existing active plan:', hasExistingActivePlan);

      // If there's an existing active plan but isEditingExistingPlan is false, set it to true
      if (hasExistingActivePlan && !isEditingExistingPlan) {
        console.log('Setting isEditingExistingPlan to true because hasExistingActivePlan is true');
        setIsEditingExistingPlan(true);
        if (!activeMealPlan) {
          setActiveMealPlan(existingMealPlans.find(plan => plan.isActive) || null);
        }
      }

      // Create personalized copies for ALL meals being assigned (explicit personalizations + auto-personalization of regular meals)
      // This ensures complete isolation: editing one client's meal doesn't affect others or templates
      const personalizedMealPromises = Object.entries(selectedMeals).map(async ([key, selection]) => {
        // For explicitly personalized meals
        if (selection.isPersonalized && selection.personalizedMeal) {
          if (
            (!selection.needsSaving && !selection.personalizedMeal.id.includes('personalized-')) ||
            selection.alreadySaved === true
          ) {
            console.log('Personalized meal already saved to database:', selection.personalizedMeal.id);
            return { key, mealId: selection.personalizedMeal.id };
          }

          try {
            console.log('Saving explicitly personalized meal:', selection.personalizedMeal.name);
            const originalId = selection.originalMealId || selection.personalizedMeal.id;

            const mealData = {
              name: selection.personalizedMeal.name,
              description: selection.personalizedMeal.description,
              ingredients: Array.isArray(selection.personalizedMeal.ingredients)
                ? selection.personalizedMeal.ingredients.map(normalizeIngredientForPersistence).filter(Boolean)
                : [],
              instructions: Array.isArray(selection.personalizedMeal.instructions)
                ? selection.personalizedMeal.instructions.map(normalizeInstructionForPersistence).filter(Boolean)
                : [],
              calories: selection.personalizedMeal.calories,
              protein: selection.personalizedMeal.protein,
              carbs: selection.personalizedMeal.carbs,
              fat: selection.personalizedMeal.fat,
              fiber: selection.personalizedMeal.fiber,
              prepTime: selection.personalizedMeal.prepTime,
              cookTime: selection.personalizedMeal.cookTime,
              servings: selection.personalizedMeal.servings,
              // Support both images array and imageUrl field
              imageUrl: selection.personalizedMeal.images?.[0] || selection.personalizedMeal.imageUrl || null,
              tags: selection.personalizedMeal.tags,
              type:
                typeof selection.personalizedMeal.type === 'string'
                  ? selection.personalizedMeal.type.toUpperCase()
                  : selection.personalizedMeal.type,
            };

            const savedMeal = await clientApi.createPersonalizedMeal(mealData, selectedClientId, originalId);
            console.log('Successfully saved explicitly personalized meal:', savedMeal.id);
            return { key, mealId: savedMeal.id };
          } catch (error) {
            console.error('Error saving explicitly personalized meal:', error);
            return null;
          }
        }
        // For non-personalized meals: AUTO-CREATE a personalized copy to ensure isolation
        else if (!selection.isPersonalized && selection.mealId) {
          try {
            // Fetch the original meal to copy its data
            console.log('Auto-creating personalized copy for meal:', selection.mealId);
            const originalMeal = meals.find(m => m.id === selection.mealId);

            if (!originalMeal) {
              console.warn(`Original meal not found: ${selection.mealId}`);
              return null;
            }

            // Create a personalized copy of the template meal
            const mealData = {
              name: originalMeal.name,
              description: originalMeal.description || '',
              ingredients: Array.isArray(originalMeal.ingredients)
                ? originalMeal.ingredients.map(normalizeIngredientForPersistence).filter(Boolean)
                : [],
              instructions: Array.isArray(originalMeal.instructions)
                ? originalMeal.instructions.map(normalizeInstructionForPersistence).filter(Boolean)
                : [],
              calories: originalMeal.calories,
              protein: originalMeal.protein,
              carbs: originalMeal.carbs,
              fat: originalMeal.fat,
              fiber: originalMeal.fiber || 0,
              prepTime: originalMeal.prepTime,
              cookTime: originalMeal.cookTime,
              servings: originalMeal.servings || 1,
              // Support both images array and imageUrl field
              imageUrl: originalMeal.images?.[0] || (originalMeal as any).imageUrl || null,
              tags: originalMeal.tags || [],
              type: typeof originalMeal.type === 'string' ? originalMeal.type.toUpperCase() : originalMeal.type,
            };

            const personalizedCopy = await clientApi.createPersonalizedMeal(
              mealData,
              selectedClientId,
              selection.mealId,
            );
            console.log('Auto-created personalized copy:', personalizedCopy.id, 'for original meal:', selection.mealId);
            return { key, mealId: personalizedCopy.id, isAutoPersonalized: true };
          } catch (error) {
            console.error('Error auto-creating personalized meal copy:', error);
            return null;
          }
        }

        return null;
      });

      console.log('Waiting for personalized meals to be saved...');
      const savedPersonalizedMeals = await Promise.all(personalizedMealPromises);
      console.log('Saved personalized meals:', savedPersonalizedMeals);

      // Check if any meals failed to save
      const failedMeals = savedPersonalizedMeals.filter(item => item === null);
      if (failedMeals.length > 0) {
        console.error(`${failedMeals.length} personalized meals failed to save`);
        if (failedMeals.length === savedPersonalizedMeals.length) {
          // All meals failed to save, show error and don't continue
          alert('All personalized meals failed to save. Please try again or contact support.');
          setLoading(false);
          return;
        } else {
          // Some meals failed, but we can continue with the ones that worked
          alert(
            `${failedMeals.length} out of ${savedPersonalizedMeals.length} personalized meals failed to save. The meal plan will be created with only the successfully saved meals.`,
          );
        }
      }

      // Update meal assignments with the newly saved personalized meal IDs
      const finalMealAssignments = Object.entries(selectedMeals)
        .map(([key, _selection]) => {
          const [dayOfWeek, mealType] = key.split('_');

          if (!isValidSlotMealType(mealType)) {
            console.warn(`Skipping invalid meal assignment key: ${key}`);
            return null;
          }

          // Find the saved personalized meal (whether explicitly or auto-personalized)
          const savedMeal = savedPersonalizedMeals.find(item => item?.key === key);

          if (!savedMeal || !savedMeal.mealId) {
            console.warn(`No saved personalized meal found for assignment ${key}`);
            return null;
          }

          const mealId = savedMeal.mealId;

          // Skip if temporary ID
          if (mealId.startsWith('personalized-')) {
            console.warn(`Skipping assignment with temporary ID: ${mealId}`);
            return null;
          }

          // All assignments now use personalized meal IDs (either explicitly or auto-personalized)
          return {
            mealId,
            dayOfWeek: parseInt(dayOfWeek),
            mealType: mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
            portion: 1.0,
            isPersonalized: true, // All assignments now result in personalized meals
            notes: savedMeal.isAutoPersonalized ? 'Auto-personalized copy' : 'Personalized meal',
          };
        })
        // Filter out any null entries (failed meal creations)
        .filter(assignment => assignment !== null && assignment.mealId) as Array<{
        mealId: string;
        dayOfWeek: number;
        mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
        portion: number;
        isPersonalized?: boolean;
        notes?: string;
      }>;

      console.log('Final meal assignments to create:', finalMealAssignments);

      // Create side assignments
      const sideAssignments = Object.entries(selectedSides)
        .map(([key, sideId]) => {
          const [dayOfWeek, mealType] = key.split('_');

          if (!isValidSlotMealType(mealType)) {
            console.warn(`Skipping invalid side assignment key: ${key}`);
            return null;
          }

          return {
            sideId,
            dayOfWeek: parseInt(dayOfWeek),
            mealType: mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
          };
        })
        .filter(assignment => assignment !== null) as Array<{
        sideId: string;
        dayOfWeek: number;
        mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      }>;

      console.log('Final side assignments to create:', sideAssignments);

      try {
        let mealPlan;

        // If user has an active meal plan, always update it even if isEditingExistingPlan wasn't explicitly set
        if (
          (isEditingExistingPlan || hasExistingActivePlan) &&
          (activeMealPlan || existingMealPlans.find(plan => plan.isActive))
        ) {
          // Get the active meal plan ID
          const planToUpdate = activeMealPlan || existingMealPlans.find(plan => plan.isActive);

          if (!planToUpdate) {
            throw new Error('Expected to find an active meal plan but none was found');
          }

          // Update existing meal plan
          console.log('Updating existing meal plan with ID:', planToUpdate.id);
          console.log('Client ID:', selectedClientId);
          console.log('Plan Name:', planName);
          console.log('Start Date:', startDate);
          console.log('End Date:', endDate);

          try {
            mealPlan = await MealAssignmentService.updateMealPlan(
              planToUpdate.id,
              selectedClientId,
              finalMealAssignments,
              planName,
              startDate,
              endDate || undefined,
              notes || undefined,
            );

            setSuccessMessage('Meal plan updated successfully!');
          } catch (updateError) {
            console.error('Error updating meal plan:', updateError);

            // If we get a 404 Not Found or other API error, fall back to creating a new plan
            console.log('Falling back to creating a new meal plan');
            mealPlan = await MealAssignmentService.createMealPlan(
              selectedClientId,
              finalMealAssignments,
              planName,
              startDate,
              endDate || undefined,
              notes || undefined,
            );

            setSuccessMessage('Created new meal plan since update failed!');
          }
        } else {
          // Create new meal plan
          console.log('Creating new meal plan:');
          console.log('Client ID:', selectedClientId);
          console.log('Plan Name:', planName);
          console.log('Start Date:', startDate);
          console.log('End Date:', endDate);

          mealPlan = await MealAssignmentService.createMealPlan(
            selectedClientId,
            finalMealAssignments,
            planName,
            startDate,
            endDate || undefined,
            notes || undefined,
          );

          setSuccessMessage('Meal plan created successfully!');
        }

        console.log('Meal plan operation completed successfully:', mealPlan);

        // Call the onAssignedAction callback if provided
        if (onAssignedAction) {
          console.log('Calling onAssignedAction callback');
          onAssignedAction();
        }

        // Close the modal after a delay
        setTimeout(() => {
          onCloseAction();
        }, 1500);
      } catch (error) {
        console.error('Failed to save meal plan:', error);
        alert(
          `Failed to ${isEditingExistingPlan ? 'update' : 'create'} meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Error in meal plan submission process:', error);
      alert(
        `Error ${isEditingExistingPlan ? 'updating' : 'creating'} meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedMealEntries = Object.entries(selectedMeals);
  const totalSelectedMeals = selectedMealEntries.length;
  const totalSelectedSides = Object.keys(selectedSides).length;
  const personalizedMealsCount = Object.values(selectedMeals).filter(selection => selection.isPersonalized).length;
  const totalAssignedCalories = selectedMealEntries.reduce((total, [_key, selection]) => {
    const meal =
      selection.isPersonalized && selection.personalizedMeal
        ? selection.personalizedMeal
        : meals.find(m => m.id === selection.mealId);

    return total + (meal?.calories || 0);
  }, 0);
  const averageDailyCalories = totalSelectedMeals > 0 ? Math.round(totalAssignedCalories / 7) : 0;
  const durationLabel =
    startDate && endDate
      ? `${Math.max(
          1,
          Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
        )} days`
      : 'Ongoing';

  const isClientReady = Boolean(selectedClientId);
  const isPlanNameReady = Boolean(planName.trim());
  const isStartDateReady = Boolean(startDate);
  const hasMealsReady = totalSelectedMeals > 0;
  const canSubmitMealPlan = !loading && isClientReady && isPlanNameReady && isStartDateReady && hasMealsReady;

  // ─── Inline side image picker ────────────────────────────────────
  function SideImagePicker({
    slotKey,
    dayOfWeek,
    mealTypeValue,
  }: {
    slotKey: string;
    dayOfWeek: number;
    mealTypeValue: string;
  }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isOpen = sidePickerSlot === slotKey;
    const currentSide = getSideForSlot(dayOfWeek, mealTypeValue);

    // Close picker when clicking outside
    useEffect(() => {
      if (!isOpen) return;
      function handleClickOutside(e: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setSidePickerSlot(null);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    function onSelect(sideId: string) {
      handleSideSelect(dayOfWeek, mealTypeValue, sideId);
      setSidePickerSlot(null);
    }

    return (
      <div ref={wrapperRef} className="relative">
        {/* Trigger */}
        {currentSide ? (
          <div
            className="mt-2 flex items-center gap-2 rounded-lg border p-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            onClick={() => setSidePickerSlot(isOpen ? null : slotKey)}
          >
            {currentSide.imageUrl ? (
              <OptimizedSideThumbnail src={currentSide.imageUrl} alt={currentSide.name} />
            ) : (
              <div
                className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-surface)' }}
              >
                <Leaf size={16} style={{ color: 'var(--color-accent)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {currentSide.name}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {currentSide.type === 'SOUP' ? 'Soup' : 'Salad'} · {currentSide.calories} cal
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                removeSideFromSlot(dayOfWeek, mealTypeValue);
              }}
              className="p-0.5 rounded hover:bg-red-500 hover:bg-opacity-10 shrink-0"
              style={{ color: 'var(--color-danger)' }}
              aria-label="Remove side"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSidePickerSlot(isOpen ? null : slotKey)}
            className="mt-2 w-full flex items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-xs transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <Leaf size={12} />
            Add side
          </button>
        )}

        {/* Dropdown picker */}
        {isOpen && (
          <div
            className="absolute z-50 mt-1 left-0 right-0 rounded-xl border shadow-xl overflow-hidden"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', minWidth: '220px' }}
          >
            <div
              className="p-2 border-b text-xs font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Choose a side
            </div>
            {/* No side option */}
            <button
              onClick={() => onSelect('')}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-opacity border-b"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-surface)' }}
              >
                <X size={14} />
              </div>
              <span>No side</span>
            </button>
            <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
              {sides.length === 0 ? (
                <div className="px-3 py-4 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No sides available
                </div>
              ) : (
                sides.map(side => (
                  <button
                    key={side.id}
                    onClick={() => onSelect(side.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:opacity-80 transition-opacity border-b last:border-b-0"
                    style={{
                      borderColor: 'var(--color-border)',
                      background:
                        selectedSides[slotKey] === side.id ? 'var(--color-accent-translucent)' : 'transparent',
                      color: 'var(--color-text)',
                      textAlign: 'left',
                    }}
                  >
                    {side.imageUrl ? (
                      <OptimizedSideThumbnail src={side.imageUrl} alt={side.name} />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                        style={{ background: 'var(--color-surface)' }}
                      >
                        <Leaf size={14} style={{ color: 'var(--color-accent)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold truncate">{side.name}</div>
                      <div style={{ color: 'var(--color-text-muted)' }}>
                        {side.type === 'SOUP' ? 'Soup' : 'Salad'} · {side.calories} cal
                      </div>
                    </div>
                    {selectedSides[slotKey] === side.id && (
                      <Check size={12} className="shrink-0" style={{ color: 'var(--color-accent)' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto">
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl m-2 sm:m-4 w-full max-w-fit max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex justify-between items-center p-4 border-b"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-bold">
            {activeTab === 'select-meals'
              ? selectedDay !== null && selectedMealType !== null
                ? `Select ${mealTypes.find(mt => mt.value === selectedMealType)?.label || ''} for ${daysOfWeek.find(d => d.value === selectedDay)?.label || ''}`
                : 'Select Meals'
              : 'Create Meal Plan'}
          </h2>

          <div className="flex items-center gap-2">
            {activeTab === 'select-meals' && selectedDay !== null && (
              <button
                onClick={() => setActiveTab('schedule')}
                className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Calendar size={16} />
                Back to Schedule
              </button>
            )}

            <button
              onClick={onCloseAction}
              className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {successMessage && (
            <div
              className="mb-4 p-3 rounded flex items-center gap-2"
              style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
            >
              <Check size={18} />
              {successMessage}
            </div>
          )}

          {/* Editing existing plan notification */}
          {isEditingExistingPlan && activeMealPlan && (
            <div
              className="mb-4 p-3 rounded-lg border-l-4 flex items-center gap-2 animate-fade-in"
              style={{
                background: 'var(--color-accent-translucent)',
                borderLeftColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
              }}
            >
              <Edit size={18} />
              <div>
                <p className="font-medium">Editing Existing Meal Plan: {activeMealPlan.name}</p>
                <p className="text-xs">
                  Created on {new Date(activeMealPlan.createdAt).toLocaleDateString()}
                  {activeMealPlan.startDate && ` • Starts ${new Date(activeMealPlan.startDate).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          )}

          {/* Client Selection - only show if clientId wasn't provided */}
          {!clientId && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {clients.map(client => (
                  <div
                    key={client.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                      selectedClientId === client.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{
                      background:
                        selectedClientId === client.id ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
                      borderColor: selectedClientId === client.id ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setPlanName(`${client.name}'s Meal Plan`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-bg)' }}
                      >
                        <User size={20} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' ? (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
              <div className="space-y-6 min-w-0">
                <div
                  className="rounded-xl border p-4 sm:p-5"
                  style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={18} />
                    Meal Plan Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan Name</label>
                      <input
                        type="text"
                        value={planName}
                        onChange={e => setPlanName(e.target.value)}
                        className="w-full p-2.5 border rounded-lg"
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                        placeholder="Enter meal plan name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-2.5 border rounded-lg"
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-2.5 border rounded-lg"
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full p-2.5 border rounded-lg"
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                        rows={2}
                        placeholder="Add any notes about this meal plan"
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl border p-4 sm:p-5"
                  style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-semibold">Weekly Meal Schedule</h3>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Select a slot to assign or personalize a meal.
                    </p>
                  </div>

                  <div className="block xl:hidden space-y-4">
                    {daysOfWeek.map(day => (
                      <div
                        key={day.value}
                        className="border rounded-lg p-4"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                      >
                        <h4 className="font-semibold mb-3 text-base sm:text-lg">{day.label}</h4>
                        <div className="space-y-2">
                          {mealTypes.map(mealType => {
                            const MealTypeIcon = mealType.icon;
                            const meal = getMealForSlot(day.value, mealType.value);
                            return (
                              <div
                                key={`${day.value}_${mealType.value}`}
                                className="border rounded-lg p-3"
                                style={{ borderColor: 'var(--color-border)' }}
                              >
                                <div className="flex items-center justify-between mb-2 gap-2">
                                  <span className="font-medium text-sm flex items-center gap-2 min-w-0">
                                    <MealTypeIcon size={14} className="shrink-0" />
                                    <span className="truncate">{mealType.label}</span>
                                  </span>
                                  {meal && selectedMeals[`${day.value}_${mealType.value}`]?.isPersonalized && (
                                    <span
                                      className="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                                      style={{
                                        background: 'var(--color-accent-translucent)',
                                        color: 'var(--color-accent)',
                                      }}
                                    >
                                      Personalized
                                    </span>
                                  )}
                                </div>
                                {meal ? (
                                  <div className="space-y-2">
                                    <div className="font-medium break-words">{meal.name}</div>
                                    <div
                                      className="flex flex-wrap items-center gap-2 text-xs"
                                      style={{ color: 'var(--color-text-muted)' }}
                                    >
                                      <span>{meal.calories} cal</span>
                                      <span>P: {meal.protein}g</span>
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {meal.prepTime + meal.cookTime} min
                                      </span>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={() => handleSelectMealSlot(day.value, mealType.value)}
                                        className="flex-1 px-3 py-2 rounded text-sm font-medium border"
                                        style={{
                                          borderColor: 'var(--color-border)',
                                          color: 'var(--color-text)',
                                          background: 'var(--color-surface)',
                                        }}
                                      >
                                        Change
                                      </button>
                                      <button
                                        onClick={() => removeMealFromSlot(day.value, mealType.value)}
                                        className="flex-1 px-3 py-2 rounded text-sm font-medium"
                                        style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                      <div
                                        className="text-xs font-semibold mb-1 flex items-center gap-1"
                                        style={{ color: 'var(--color-text-muted)' }}
                                      >
                                        <Leaf size={12} />
                                        Side
                                      </div>
                                      <SideImagePicker
                                        slotKey={`${day.value}_${mealType.value}`}
                                        dayOfWeek={day.value}
                                        mealTypeValue={mealType.value}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleSelectMealSlot(day.value, mealType.value)}
                                    className="w-full p-3 border border-dashed rounded flex items-center justify-center gap-2"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                                  >
                                    <Utensils size={16} />
                                    <span className="text-sm">Add {mealType.label}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden xl:block overflow-x-auto">
                    <table className="w-full border-collapse min-w-[920px]">
                      <thead>
                        <tr>
                          <th
                            className="p-3 text-left font-medium border"
                            style={{
                              background: 'var(--color-surface)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text)',
                            }}
                          >
                            Day
                          </th>
                          {mealTypes.map(mealType => {
                            const MealTypeIcon = mealType.icon;
                            return (
                              <th
                                key={mealType.value}
                                className="p-3 text-center font-medium border min-w-[200px]"
                                style={{
                                  background: 'var(--color-surface)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text)',
                                }}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <MealTypeIcon size={14} />
                                  <span>{mealType.label}</span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {daysOfWeek.map(day => (
                          <tr key={day.value}>
                            <td
                              className="p-3 font-medium border align-top"
                              style={{
                                background: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                              }}
                            >
                              {day.label}
                            </td>
                            {mealTypes.map(mealType => {
                              const meal = getMealForSlot(day.value, mealType.value);
                              return (
                                <td
                                  key={`${day.value}_${mealType.value}`}
                                  className="p-2 border align-top"
                                  style={{ borderColor: 'var(--color-border)' }}
                                >
                                  {meal ? (
                                    <div
                                      className="p-3 rounded-lg relative"
                                      style={{ background: 'var(--color-surface)' }}
                                    >
                                      <div className="font-medium mb-1 break-words pr-7">{meal.name}</div>
                                      <div className="flex flex-wrap items-center text-xs gap-2 mb-2">
                                        <span style={{ color: 'var(--color-text-muted)' }}>{meal.calories} cal</span>
                                        <span style={{ color: 'var(--color-text-muted)' }}>P: {meal.protein}g</span>
                                        <span
                                          className="flex items-center gap-1"
                                          style={{ color: 'var(--color-text-muted)' }}
                                        >
                                          <Clock size={12} />
                                          {meal.prepTime + meal.cookTime} min
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <button
                                          onClick={() => handleSelectMealSlot(day.value, mealType.value)}
                                          className="text-xs px-2 py-1 rounded border"
                                          style={{
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text)',
                                            background: 'transparent',
                                          }}
                                        >
                                          Change
                                        </button>
                                        {selectedMeals[`${day.value}_${mealType.value}`]?.isPersonalized && (
                                          <div
                                            className="text-xs px-2 py-0.5 rounded"
                                            style={{
                                              background: 'var(--color-accent-translucent)',
                                              color: 'var(--color-accent)',
                                            }}
                                          >
                                            Personalized
                                          </div>
                                        )}
                                      </div>
                                      {/* Optional Side Section */}
                                      <div
                                        className="mt-3 pt-3 border-t"
                                        style={{ borderColor: 'var(--color-border)' }}
                                      >
                                        <div
                                          className="text-xs font-semibold mb-1 flex items-center gap-1"
                                          style={{ color: 'var(--color-text-muted)' }}
                                        >
                                          <Leaf size={12} />
                                          Side
                                        </div>
                                        <SideImagePicker
                                          slotKey={`${day.value}_${mealType.value}`}
                                          dayOfWeek={day.value}
                                          mealTypeValue={mealType.value}
                                        />
                                      </div>
                                      <button
                                        onClick={() => removeMealFromSlot(day.value, mealType.value)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-500 hover:bg-opacity-10"
                                        style={{ color: 'var(--color-danger)' }}
                                        aria-label="Remove meal"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleSelectMealSlot(day.value, mealType.value)}
                                      className="w-full p-4 border border-dashed rounded flex flex-col items-center justify-center gap-2 transition-colors"
                                      style={{
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-muted)',
                                        background: 'var(--color-surface)',
                                      }}
                                    >
                                      <Utensils size={16} />
                                      <span className="text-xs">Add {mealType.label}</span>
                                    </button>
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
              </div>

              <aside className="xl:sticky xl:top-20 h-fit space-y-4">
                <div
                  className="rounded-xl border p-4"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: hasMealsReady ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="font-semibold">Meal Plan Summary</h4>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: hasMealsReady ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: hasMealsReady ? 'var(--color-text-on-accent)' : 'var(--color-text-muted)',
                      }}
                    >
                      {totalSelectedMeals} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg p-2" style={{ background: 'var(--color-surface)' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>Total Meals</div>
                      <div className="text-base font-semibold">{totalSelectedMeals}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'var(--color-surface)' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>Total Sides</div>
                      <div className="text-base font-semibold">{totalSelectedSides}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'var(--color-surface)' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>Avg Calories</div>
                      <div className="text-base font-semibold">{averageDailyCalories}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'var(--color-surface)' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>Duration</div>
                      <div className="text-base font-semibold">{durationLabel}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: 'var(--color-surface)' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>Personalized</div>
                      <div className="text-base font-semibold">{personalizedMealsCount}</div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl border p-4"
                  style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle size={16} style={{ color: 'var(--color-accent)' }} />
                    Ready To Save
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Client selected</span>
                      <span style={{ color: isClientReady ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {isClientReady ? 'Done' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Plan name</span>
                      <span style={{ color: isPlanNameReady ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {isPlanNameReady ? 'Done' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Start date</span>
                      <span style={{ color: isStartDateReady ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {isStartDateReady ? 'Done' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>At least 1 meal</span>
                      <span style={{ color: hasMealsReady ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {hasMealsReady ? 'Done' : 'Missing'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitMealPlan}
                    disabled={!canSubmitMealPlan}
                    className={`w-full mt-4 px-5 py-3 rounded-lg flex items-center justify-center gap-2 text-base font-semibold ${
                      !canSubmitMealPlan ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 transition-opacity'
                    }`}
                    style={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-text-on-accent)',
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        {isEditingExistingPlan || hasExistingActivePlan ? 'Update Meal Plan' : 'Create Meal Plan'}
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Changes are saved only after you click this button.
                  </p>
                </div>
              </aside>
            </div>
          ) : (
            // Meal Selection Interface
            <div>
              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search meals..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </div>

              {/* Filter by meal type */}
              <div className="mb-4">
                <div
                  className="rounded-xl p-3 border"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Filter by Meal Type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMealTypeFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                        mealTypeFilter === 'all'
                          ? 'border-accent shadow-sm'
                          : 'border-transparent hover:border-opacity-30 hover:border-accent'
                      }`}
                      style={{
                        background: mealTypeFilter === 'all' ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
                        color: mealTypeFilter === 'all' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        borderColor: mealTypeFilter === 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                      }}
                    >
                      All Meals
                    </button>
                    {mealTypes.map(type => {
                      const TypeIcon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setMealTypeFilter(type.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 border-2 ${
                            mealTypeFilter === type.value
                              ? 'border-accent shadow-sm'
                              : 'border-transparent hover:border-opacity-30 hover:border-accent'
                          }`}
                          style={{
                            background: mealTypeFilter === type.value ? 'var(--color-black)' : 'rgba(255,255,255,0.04)',
                            color: mealTypeFilter === type.value ? 'var(--color-text)' : 'var(--color-text-muted)',
                            borderColor: mealTypeFilter === type.value ? 'var(--color-accent)' : 'var(--color-border)',
                          }}
                        >
                          <TypeIcon size={14} />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {loading ? (
                  <div className="col-span-full p-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    Loading meals...
                  </div>
                ) : filteredMeals.length === 0 ? (
                  <div className="col-span-full p-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    No meals found matching your search.
                  </div>
                ) : (
                  filteredMeals.map(meal => (
                    <div
                      key={meal.id}
                      className="border rounded-lg overflow-hidden"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {/* Display image from either images array or imageUrl field */}
                      {(() => {
                        const imageSource = meal.images?.[0] || meal.imageUrl;
                        const image = imageSource ? getMealImageDelivery(imageSource, 'card') : null;
                        return imageSource ? (
                          <div className="relative h-40 overflow-hidden">
                            <Image
                              src={image?.src ?? imageSource}
                              alt={meal.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized={image?.unoptimized}
                            />
                          </div>
                        ) : null;
                      })()}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold flex-1">{meal.name}</h4>
                          {isMealAssigned(meal.id) &&
                            (() => {
                              const slot = getMealAssignmentSlot(meal.id);
                              const dayName = slot ? daysOfWeek.find(d => d.value === slot.day)?.label : '';
                              const mealTypeName = slot ? mealTypes.find(m => m.value === slot.mealType)?.label : '';
                              return (
                                <div
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border-2"
                                  style={{
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    color: '#22c55e',
                                    borderColor: '#22c55e',
                                  }}
                                  title={`Assigned to ${dayName} - ${mealTypeName}`}
                                >
                                  <Check size={14} />
                                  <span>ASSIGNED</span>
                                </div>
                              );
                            })()}
                        </div>
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                          {meal.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {meal.prepTime + meal.cookTime} min
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users size={14} style={{ color: 'var(--color-text-muted)' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {meal.servings} {meal.servings === 1 ? 'serving' : 'servings'}
                            </span>
                          </div>
                        </div>

                        <div
                          className="grid grid-cols-3 gap-2 p-2 rounded-lg mb-4"
                          style={{ background: 'var(--color-bg-alt)' }}
                        >
                          <div className="text-center">
                            <div className="text-sm font-semibold">{meal.protein}g</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              Protein
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold">{meal.carbs}g</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              Carbs
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold">{meal.fat}g</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              Fat
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePersonalizeMeal(meal)}
                            className="flex-1 px-3 py-2 rounded border flex items-center justify-center gap-1"
                            style={{
                              borderColor: 'var(--color-accent)',
                              color: 'var(--color-accent)',
                              background: 'var(--color-accent-translucent)',
                            }}
                          >
                            <Edit size={16} />
                            <span>Personalize</span>
                          </button>

                          <button
                            onClick={() => handleAssignMeal(meal)}
                            disabled={isMealAssigned(meal.id)}
                            className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-1 ${
                              isMealAssigned(meal.id) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            style={{
                              background: isMealAssigned(meal.id) ? 'var(--color-bg-alt)' : 'var(--color-accent)',
                              color: isMealAssigned(meal.id) ? 'var(--color-text-muted)' : 'var(--color-text-black)',
                            }}
                            title={
                              isMealAssigned(meal.id)
                                ? 'This meal is already assigned. Remove it first to reassign.'
                                : 'Assign this meal'
                            }
                          >
                            <Calendar size={16} />
                            <span>{isMealAssigned(meal.id) ? 'Already Assigned' : 'Assign'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Personalization Modal */}
      {showPersonalizationModal && mealToPersonalize && (
        <AdvancedMealPersonalization
          meal={mealToPersonalize}
          clientId={selectedClientId || undefined}
          isOpen={showPersonalizationModal}
          onCloseAction={() => setShowPersonalizationModal(false)}
          onSaveAction={handleSavePersonalizedMeal}
        />
      )}
    </div>
  );
}
