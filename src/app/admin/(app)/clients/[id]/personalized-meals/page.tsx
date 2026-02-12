'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { DataService, Client } from '@/services/dataService';
import EditMealModal from '@/components/EditMealModal';
import { Utensils, Flame, Clock, Users, Edit, ArrowLeft, Sparkles } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface PersonalizedMeal {
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
  isPersonalized: boolean;
  originalMealId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ClientPersonalizedMealsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [meals, setMeals] = useState<PersonalizedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch client data
        const clients = await DataService.getClients();
        const clientData = clients.find(c => c.id === clientId);
        setClient(clientData || null);

        // Fetch personalized meals for this client
        const response = await fetch(`/api/clients/${clientId}/meals`);
        if (response.ok) {
          const data = await response.json();
          setMeals(data.meals || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleEditMeal = (mealId: string) => {
    setMealToEdit(mealId);
    setShowEditModal(true);
  };

  const handleMealUpdated = async () => {
    try {
      setLoading(true);

      // Fetch client data
      const clients = await DataService.getClients();
      const clientData = clients.find(c => c.id === clientId);
      setClient(clientData || null);

      // Fetch personalized meals for this client
      const response = await fetch(`/api/clients/${clientId}/meals`);
      if (response.ok) {
        const data = await response.json();
        setMeals(data.meals || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      BREAKFAST: '🌅',
      LUNCH: '☀️',
      DINNER: '🌙',
      SNACK: '🍎',
    };
    return icons[type] || '🍽️';
  };

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      BREAKFAST: 'bg-orange-100 text-orange-800 border-orange-300',
      LUNCH: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      DINNER: 'bg-purple-100 text-purple-800 border-purple-300',
      SNACK: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-zinc-800 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-zinc-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-4 mb-4">
            {client && (
              <Image
                src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`}
                alt={client.name}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-blue-500" />
                Personalized Meals
              </h1>
              <p className="text-zinc-400">
                {client?.name}&apos;s custom meal collection ({meals.length} meals)
              </p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-400 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                These are personalized copies you can edit independently without affecting the original meal templates.
              </span>
            </p>
          </div>
        </div>

        {/* Meals Grid */}
        {meals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map(meal => (
              <div
                key={meal.id}
                className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 w-full">
                  {meal.imageUrl ? (
                    <Image
                      src={
                        meal.imageUrl.includes('cloudinary.com')
                          ? getOptimizedImageUrl(meal.imageUrl.split('/upload/')[1] || meal.imageUrl, 'card')
                          : meal.imageUrl
                      }
                      alt={meal.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Utensils className="w-12 h-12 text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border ${getMealTypeColor(meal.type)}`}
                    >
                      {getMealTypeIcon(meal.type)} {meal.type}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-blue-500/90 text-white border border-blue-400">
                      <Sparkles className="w-3 h-3" />
                      Personalized
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-zinc-100">{meal.name}</h3>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500 flex items-center justify-center gap-1">
                        <Flame className="w-5 h-5" />
                        {meal.calories}
                      </p>
                      <p className="text-xs text-zinc-400">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">{meal.protein}g</p>
                      <p className="text-xs text-zinc-400">Protein</p>
                    </div>
                  </div>

                  {/* Timing Info */}
                  <div className="flex items-center justify-between text-sm text-zinc-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {meal.prepTime + meal.cookTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {meal.servings} serving{meal.servings > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Tags */}
                  {meal.tags && meal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {meal.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {meal.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          +{meal.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditMeal(meal.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Personalized Meal
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
            <Sparkles className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-zinc-100">No personalized meals yet</h3>
            <p className="text-zinc-400 mb-6">
              Assign meals to {client?.name} to create personalized copies that can be customized.
            </p>
            <button
              onClick={() => router.push(`/admin/clients/${clientId}/assign-meals`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Assign Meals
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditMealModal
        isOpen={showEditModal}
        mealId={mealToEdit}
        onCloseAction={() => {
          setShowEditModal(false);
          setMealToEdit(null);
        }}
        onMealUpdatedAction={handleMealUpdated}
      />
    </div>
  );
}
