'use client';

import React, { useState, useEffect } from 'react';
import { Meal, Client, MealType } from '@/types/meal';
import { DataService } from '@/services/dataService';
import { clientApi } from '@/lib/client-api';
import { MealAssignmentService } from '@/services/mealAssignmentService';
import { X, Search, Calendar, Edit, User, Check, Clock, Users, Utensils, Save } from 'lucide-react';
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

// Meal types with icons
const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
] as const;

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

  // State for UI control
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'select-meals' | 'schedule'>('select-meals');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
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
  const [existingMealAssignments, setExistingMealAssignments] = useState<any[]>([]);

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
      checkExistingMealPlans();
    }
  }, [isOpen, clientId]);

  // Check for existing meal plans and load meal assignments
  const checkExistingMealPlans = async () => {
    if (clientId) {
      try {
        console.log(`Checking for existing meal plans for client: ${clientId}`);

        // Fetch existing meal plans for the client
        const response = await fetch(`/api/clients/${clientId}/meal-plans`);

        // Check if we got a 404 - this could be because the API endpoint doesn't exist yet
        if (response.status === 404) {
          console.warn('API endpoint not found: /api/clients/${clientId}/meal-plans');
          console.warn('This is likely because the API route has not been created yet.');
          console.warn('Falling back to creating a new meal plan');
          initializeMealPlan();
          return;
        }

        if (response.ok) {
          const plans = await response.json();
          console.log(`Found ${plans.length} meal plans for client ${clientId}`);

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
              // Fetch meal assignments for this plan separately
              try {
                console.log(`Fetching meal assignments for plan: ${activePlan.id}`);
                const assignmentsResponse = await fetch(`/api/meal-plans/${activePlan.id}/assignments`);

                if (assignmentsResponse.ok) {
                  const assignments = await assignmentsResponse.json();
                  console.log('Loaded existing meal assignments:', assignments);
                  processExistingMealAssignments(assignments);
                } else {
                  console.error('Failed to fetch meal assignments:', assignmentsResponse.status);
                  console.error('Initializing empty meal plan');
                  setSelectedMeals({}); // Start with empty selections
                }
              } catch (error) {
                console.error('Error fetching meal assignments:', error);
                setSelectedMeals({}); // Start with empty selections
              }
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
    setExistingMealAssignments(assignments);

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

      // Handle different formats of mealType
      let mealTypeKey = assignment.mealType;
      if (typeof mealTypeKey === 'string') {
        mealTypeKey = mealTypeKey.toLowerCase();
      }

      const key = `${assignment.dayOfWeek}_${mealTypeKey}`;

      // Check if we have meal data directly in the assignment
      if (assignment.meal) {
        console.log('Assignment has meal data:', assignment.meal.name);
        // Add this meal to our collection to update the meals array
        mealsToAdd.push(assignment.meal);
      }

      mealMap[key] = {
        mealId: assignment.mealId,
        isPersonalized: assignment.isPersonalized || false,
        // If the meal is already included in the assignment, use it
        meal: assignment.meal,
        personalizedMeal: assignment.isPersonalized ? assignment.meal : undefined,
        originalMealId: assignment.originalMealId,
      };
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
      setLoading(false);
    }
  };

  // Filter meals based on search term
  const filteredMeals = meals.filter(
    meal =>
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get the selected meal and client
  const selectedMeal = meals.find(meal => meal.id === selectedMealId) || null;
  const selectedClient = clients.find(client => client.id === selectedClientId) || null;

  // Handle meal selection for a specific day and meal type
  const handleSelectMealSlot = (dayOfWeek: number, mealType: string) => {
    setSelectedDay(dayOfWeek);
    setSelectedMealType(mealType);
    setActiveTab('select-meals');
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
    originalMealId?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      console.log('Saving personalized meal in IntegratedMealAssignmentModal:', personalizedMeal.name);
      console.log('Original meal ID:', originalMealId);
      console.log('For client ID:', clientId || selectedClientId);

      // If we have a day and meal type selected, assign the personalized meal to that slot
      if (selectedDay !== null && selectedMealType !== null && selectedClientId) {
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

          // Find a valid coach ID to use for the meal creation
          let coachId = 'clmermeye5001d7k2kwvec0tkv'; // Use a fallback ID
          console.log('Using coach ID for personalized meal:', coachId);

          // Use client-side safe API to create personalized meal
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
            // Convert meal type to uppercase format to match Prisma enum
            type:
              typeof personalizedMeal.type === 'string' ? personalizedMeal.type.toUpperCase() : personalizedMeal.type,
            coachId: coachId, // Use a valid coach ID from the database
          };

          const savedMeal = await clientApi.createPersonalizedMeal(
            mealData,
            selectedClientId || clientId!, // Make sure we pass the selected client ID
            originalId
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
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
            `Failed to save personalized meal to database: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
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
            'Meal personalized but could not be saved to database. Will try again when creating meal plan.'
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
      const key = `${selectedDay}_${selectedMealType}`;

      console.log(
        `Assigning meal "${meal.name}" (ID: ${meal.id}) to ${mealTypes.find(m => m.value === selectedMealType)?.label} on ${daysOfWeek.find(d => d.value === selectedDay)?.label}`
      );

      setSelectedMeals(prev => ({
        ...prev,
        [key]: { mealId: meal.id, isPersonalized: false },
      }));

      setActiveTab('schedule');
      setSuccessMessage(
        `"${meal.name}" added to ${daysOfWeek.find(d => d.value === selectedDay)?.label}'s ${mealTypes.find(m => m.value === selectedMealType)?.label}!`
      );

      // Show more detailed message
      alert(
        `"${meal.name}" has been added to your meal plan for ${daysOfWeek.find(d => d.value === selectedDay)?.label}'s ${mealTypes.find(m => m.value === selectedMealType)?.label}. Click "Create Meal Plan" to save all assignments.`
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
    const key = `${dayOfWeek}_${mealType}`;
    const selection = selectedMeals[key];

    if (!selection) return null;

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
    const key = `${dayOfWeek}_${mealType}`;

    setSelectedMeals(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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

      // First, save any personalized meals that need to be saved
      const personalizedMealPromises = Object.entries(selectedMeals)
        .filter(([_, selection]) => selection.isPersonalized && selection.personalizedMeal)
        .map(async ([key, selection]) => {
          if (!selection.personalizedMeal) return null;

          // If the meal was already saved to the database (in handleSavePersonalizedMeal),
          // we can skip saving it again
          if (
            (!selection.needsSaving && !selection.personalizedMeal.id.includes('personalized-')) ||
            selection.alreadySaved === true
          ) {
            console.log('Personalized meal already saved to database:', selection.personalizedMeal.id);
            return { key, mealId: selection.personalizedMeal.id };
          }

          try {
            console.log('Saving personalized meal:', selection.personalizedMeal.name);
            console.log('Original meal ID:', selection.originalMealId);

            // Make sure we have the original meal ID to maintain the reference
            const originalId = selection.originalMealId || selection.personalizedMeal.id;

            console.log('Using original meal ID for reference:', originalId);

            // Find a valid coach ID to use for the meal creation
            let coachId = 'clmermeye5001d7k2kwvec0tkv'; // Use a fallback ID
            console.log('Using coach ID for personalized meal:', coachId);

            // Save personalized meal with the PersonalizedMealService
            // Pass the original meal ID to maintain the reference
            // Use client-side safe API to create personalized meal
            const mealData = {
              name: selection.personalizedMeal.name,
              description: selection.personalizedMeal.description,
              ingredients: JSON.stringify(selection.personalizedMeal.ingredients),
              instructions: JSON.stringify(selection.personalizedMeal.instructions),
              calories: selection.personalizedMeal.calories,
              protein: selection.personalizedMeal.protein,
              carbs: selection.personalizedMeal.carbs,
              fat: selection.personalizedMeal.fat,
              fiber: selection.personalizedMeal.fiber,
              prepTime: selection.personalizedMeal.prepTime,
              cookTime: selection.personalizedMeal.cookTime,
              servings: selection.personalizedMeal.servings,
              imageUrl: selection.personalizedMeal.images?.[0],
              tags: selection.personalizedMeal.tags,
              // Convert meal type to uppercase format to match Prisma enum
              type:
                typeof selection.personalizedMeal.type === 'string'
                  ? selection.personalizedMeal.type.toUpperCase()
                  : selection.personalizedMeal.type,
              coachId: coachId, // Use valid coach ID
            };

            const savedMeal = await clientApi.createPersonalizedMeal(mealData, selectedClientId, originalId);

            // Format the response to match what the component expects
            const result = {
              meal: savedMeal,
              client: { id: selectedClientId, name: 'Client' },
            };

            console.log('Successfully saved personalized meal:', result.meal.id);
            return { key, mealId: result.meal.id };
          } catch (error) {
            console.error('Error saving personalized meal:', error);
            console.warn('Continuing with other meals, will exclude this one from the plan');
            // Don't alert, just return null so this meal gets excluded
            return null;
          }
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
            `${failedMeals.length} out of ${savedPersonalizedMeals.length} personalized meals failed to save. The meal plan will be created with only the successfully saved meals.`
          );
        }
      }

      // Update meal assignments with the newly saved personalized meal IDs
      const finalMealAssignments = Object.entries(selectedMeals)
        .map(([key, selection]) => {
          const [dayOfWeek, mealType] = key.split('_');

          // If this was a personalized meal, find its saved ID
          let mealId = selection.mealId;
          if (selection.isPersonalized) {
            const savedMeal = savedPersonalizedMeals.find(item => item?.key === key);
            if (savedMeal) {
              mealId = savedMeal.mealId;
              console.log(`Using saved personalized meal ID ${mealId} for assignment ${key}`);

              // Don't include temporary IDs in the final assignments
              if (mealId.startsWith('personalized-')) {
                console.warn(`Skipping assignment with temporary ID: ${mealId}`);
                return null; // Will be filtered out below
              }

              // Return the assignment with the valid meal ID
              return {
                mealId,
                dayOfWeek: parseInt(dayOfWeek),
                mealType: mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
                portion: 1.0,
                isPersonalized: selection.isPersonalized,
                notes: selection.isPersonalized ? 'Personalized meal' : undefined,
              };
            } else {
              console.warn(`No saved personalized meal found for assignment ${key}, will skip this meal`);
              return null; // Will be filtered out below
            }
          }

          // Return the assignment with the original meal ID for non-personalized meals
          return {
            mealId,
            dayOfWeek: parseInt(dayOfWeek),
            mealType: mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
            portion: 1.0,
            isPersonalized: selection.isPersonalized,
            notes: selection.isPersonalized ? 'Personalized meal' : undefined,
          };
        })
        // Filter out any null entries (failed personalized meals)
        .filter(assignment => assignment !== null && assignment.mealId) as Array<{
        mealId: string;
        dayOfWeek: number;
        mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
        portion: number;
        isPersonalized?: boolean;
        notes?: string;
      }>;

      console.log('Final meal assignments to create:', finalMealAssignments);

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
              notes || undefined
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
              notes || undefined
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
            notes || undefined
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
          `Failed to ${isEditingExistingPlan ? 'update' : 'create'} meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error in meal plan submission process:', error);
      alert(
        `Error ${isEditingExistingPlan ? 'updating' : 'creating'} meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto">
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl m-4 w-full max-w-6xl max-h-[calc(100vh-2rem)] overflow-y-auto"
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
            <div>
              {/* Meal Plan Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Meal Plan Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Plan Name</label>
                    <input
                      type="text"
                      value={planName}
                      onChange={e => setPlanName(e.target.value)}
                      className="w-full p-2 border rounded"
                      style={{
                        background: 'var(--color-bg-alt)',
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
                      className="w-full p-2 border rounded"
                      style={{
                        background: 'var(--color-bg-alt)',
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
                      className="w-full p-2 border rounded"
                      style={{
                        background: 'var(--color-bg-alt)',
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
                      className="w-full p-2 border rounded"
                      style={{
                        background: 'var(--color-bg-alt)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                      rows={2}
                      placeholder="Add any notes about this meal plan"
                    />
                  </div>
                </div>
              </div>

              {/* Meal Schedule */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Weekly Meal Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th
                          className="p-3 text-left font-medium border"
                          style={{
                            background: 'var(--color-bg-alt)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text)',
                          }}
                        >
                          Day
                        </th>
                        {mealTypes.map(mealType => (
                          <th
                            key={mealType.value}
                            className="p-3 text-center font-medium border min-w-[180px]"
                            style={{
                              background: 'var(--color-bg-alt)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text)',
                            }}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>{mealType.icon}</span>
                              <span>{mealType.label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map(day => (
                        <tr key={day.value}>
                          <td
                            className="p-3 font-medium border"
                            style={{
                              background: 'var(--color-bg-alt)',
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
                                className="p-2 border"
                                style={{ borderColor: 'var(--color-border)' }}
                              >
                                {meal ? (
                                  <div className="p-2 rounded relative" style={{ background: 'var(--color-bg-alt)' }}>
                                    <div className="font-medium mb-1">{meal.name}</div>
                                    <div className="flex items-center text-xs gap-3 mb-1">
                                      <span style={{ color: 'var(--color-text-muted)' }}>{meal.calories} cal</span>
                                      <span style={{ color: 'var(--color-text-muted)' }}>P: {meal.protein}g</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 justify-between">
                                      <div
                                        className="flex items-center gap-1 text-xs"
                                        style={{ color: 'var(--color-text-muted)' }}
                                      >
                                        <Clock size={12} />
                                        <span>{meal.prepTime + meal.cookTime} min</span>
                                      </div>

                                      {selectedMeals[`${day.value}_${mealType.value}`]?.isPersonalized && (
                                        <div
                                          className="text-xs px-1 py-0.5 rounded"
                                          style={{
                                            background: 'var(--color-accent-translucent)',
                                            color: 'var(--color-accent)',
                                          }}
                                        >
                                          Personalized
                                        </div>
                                      )}
                                    </div>

                                    {/* Remove button */}
                                    <button
                                      onClick={() => removeMealFromSlot(day.value, mealType.value)}
                                      className="absolute top-1 right-1 p-1 rounded-full hover:bg-red-500 hover:bg-opacity-10"
                                      style={{ color: 'var(--color-danger)' }}
                                      aria-label="Remove meal"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleSelectMealSlot(day.value, mealType.value)}
                                    className="w-full p-3 border border-dashed rounded flex flex-col items-center justify-center gap-1 hover:bg-opacity-5 transition-colors"
                                    style={{
                                      borderColor: 'var(--color-border)',
                                      color: 'var(--color-text-muted)',
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

              {/* Summary */}
              <div
                className="mb-6 p-4 rounded-lg border"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: Object.keys(selectedMeals).length > 0 ? 'var(--color-accent)' : 'var(--color-border)',
                  boxShadow:
                    Object.keys(selectedMeals).length > 0 ? '0 0 8px rgba(var(--color-accent-rgb), 0.3)' : 'none',
                }}
              >
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span>Meal Plan Summary</span>
                  {Object.keys(selectedMeals).length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}
                    >
                      {Object.keys(selectedMeals).length} meals ready to save
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Meals:</span>
                    <span className="ml-2 font-medium">{Object.keys(selectedMeals).length}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Avg Daily Calories:</span>
                    <span className="ml-2 font-medium">
                      {Object.values(selectedMeals).length > 0
                        ? Math.round(
                            Object.entries(selectedMeals).reduce((total, [key, selection]) => {
                              const meal =
                                selection.isPersonalized && selection.personalizedMeal
                                  ? selection.personalizedMeal
                                  : meals.find(m => m.id === selection.mealId);

                              return total + (meal?.calories || 0);
                            }, 0) / 7
                          )
                        : 0}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Personalized Meals:</span>
                    <span className="ml-2 font-medium">
                      {Object.values(selectedMeals).filter(selection => selection.isPersonalized).length}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Duration:</span>
                    <span className="ml-2 font-medium">
                      {startDate && endDate
                        ? `${Math.ceil(
                            (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
                          )} days`
                        : 'Ongoing'}
                    </span>
                  </div>
                </div>

                {Object.keys(selectedMeals).length > 0 && (
                  <div className="mt-3 text-sm italic" style={{ color: 'var(--color-accent)' }}>
                    Don&apos;t forget to click &quot;Create Meal Plan&quot; to save your selections!
                  </div>
                )}
              </div>

              {/* Instructions and Submit Button */}
              <div className="flex flex-col gap-4">
                <div
                  className="p-4 rounded-lg border-2 border-dashed"
                  style={{
                    borderColor: 'var(--color-accent)',
                    background: 'var(--color-accent-translucent)',
                  }}
                >
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Save size={18} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ color: 'var(--color-accent)' }}>Important: Save Your Meal Plan</span>
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Your meal assignments will not be saved until you click the &quot;Create Meal Plan&quot; button
                    below. Make sure all your meals are assigned correctly before saving.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  {Object.keys(selectedMeals).length > 0 && (
                    <div
                      className="w-full max-w-lg text-center mb-4 p-3 rounded-lg animate-slide-down"
                      style={{ background: 'var(--color-accent-translucent)' }}
                    >
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-accent)' }}>
                        You&apos;ve selected {Object.keys(selectedMeals).length} meal(s). Click below to save all
                        assignments.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitMealPlan}
                    disabled={
                      loading || !selectedClientId || !planName || !startDate || Object.keys(selectedMeals).length === 0
                    }
                    className={`px-8 py-4 rounded-lg flex items-center gap-3 text-lg font-bold ${
                      loading || !selectedClientId || !planName || !startDate || Object.keys(selectedMeals).length === 0
                        ? 'opacity-50 cursor-not-allowed'
                        : Object.keys(selectedMeals).length > 0
                          ? 'animate-pulse hover:animate-none hover:scale-105 transition-transform'
                          : ''
                    }`}
                    style={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-text-on-accent)',
                      boxShadow:
                        Object.keys(selectedMeals).length > 0
                          ? '0 8px 16px rgba(0, 0, 0, 0.2)'
                          : '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={24} />
                        {isEditingExistingPlan || hasExistingActivePlan ? 'Update Meal Plan' : 'Create Meal Plan'}
                      </>
                    )}
                  </button>
                </div>
              </div>
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
              <div className="flex flex-wrap gap-2 mb-4">
                {mealTypes.map(type => (
                  <button
                    key={type.value}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      selectedMealType === type.value ? 'border-2' : 'border'
                    }`}
                    style={{
                      background:
                        selectedMealType === type.value ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
                      borderColor: selectedMealType === type.value ? 'var(--color-accent)' : 'var(--color-border)',
                      color: selectedMealType === type.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                    onClick={() => {
                      setSearchTerm(prevTerm => {
                        if (prevTerm.includes(type.value)) return prevTerm;
                        return prevTerm ? `${prevTerm} ${type.value}` : type.value;
                      });
                    }}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
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
                      {meal.images && meal.images[0] && (
                        <div
                          className="h-40 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${meal.images[0]})`,
                          }}
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold mb-1">{meal.name}</h4>
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
                            className="flex-1 px-3 py-2 rounded flex items-center justify-center gap-1"
                            style={{
                              background: 'var(--color-accent)',
                              color: 'var(--color-text-on-accent)',
                            }}
                          >
                            <Calendar size={16} />
                            <span>Assign</span>
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
