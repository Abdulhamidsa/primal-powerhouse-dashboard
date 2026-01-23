'use client';

import { useState, useEffect } from 'react';
import { Video, VideoAssignment } from '@/types/video';

interface Meal {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  imageUrl?: string;
}

interface MealAssignment {
  id: string;
  mealId: string;
  assignedDate: Date;
  dueDate?: Date;
  status: string;
  notes?: string;
  meal: Meal;
}

interface EditAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  type: 'videos' | 'meals';
  currentAssignments: VideoAssignment[] | MealAssignment[];
  onUpdate: () => void;
}

export default function EditAssignmentsModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  type,
  currentAssignments,
  onUpdate,
}: EditAssignmentsModalProps) {
  const [allContent, setAllContent] = useState<Video[] | Meal[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAllContent();
      // Initialize selected items with current assignments
      const currentIds = currentAssignments.map(assignment =>
        type === 'videos' ? (assignment as VideoAssignment).videoId : (assignment as MealAssignment).mealId
      );
      setSelectedItems(currentIds);
    } else {
      setSearchTerm('');
    }
  }, [isOpen, currentAssignments, type]);

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'videos' ? '/api/videos' : '/api/meals';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setAllContent(data);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = allContent.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    if (type === 'videos') {
      const video = item as Video;
      return (
        video.title.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower) ||
        video.category.toLowerCase().includes(searchLower)
      );
    } else {
      const meal = item as Meal;
      return (
        meal.name.toLowerCase().includes(searchLower) ||
        meal.description?.toLowerCase().includes(searchLower) ||
        meal.type.toLowerCase().includes(searchLower)
      );
    }
  });

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => (prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]));
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Get current assignment IDs
      const currentIds = currentAssignments.map(assignment =>
        type === 'videos' ? (assignment as VideoAssignment).videoId : (assignment as MealAssignment).mealId
      );

      // Find items to add and remove
      const toAdd = selectedItems.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !selectedItems.includes(id));

      // Remove assignments
      for (const itemId of toRemove) {
        const assignment = currentAssignments.find(a =>
          type === 'videos' ? (a as VideoAssignment).videoId === itemId : (a as MealAssignment).mealId === itemId
        );
        if (assignment) {
          const endpoint =
            type === 'videos' ? `/api/video-assignments/${assignment.id}` : `/api/meal-assignments/${assignment.id}`;
          await fetch(endpoint, { method: 'DELETE' });
        }
      }

      // Add new assignments
      if (toAdd.length > 0) {
        if (type === 'videos') {
          const assignments = toAdd.map(videoId => ({
            clientId,
            videoId,
            dueDate: undefined,
            notes: undefined,
          }));

          await fetch('/api/video-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignments }),
          });
        } else {
          // For meals, create a meal plan
          const mealAssignments = toAdd.map(mealId => ({
            mealId,
            dayOfWeek: 1,
            mealType: 'breakfast',
            portion: 1.0,
            notes: undefined,
          }));

          await fetch('/api/meal-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId,
              name: `Updated Meal Plan - ${new Date().toLocaleDateString()}`,
              startDate: new Date().toISOString().split('T')[0],
              mealAssignments,
            }),
          });
        }
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error(`Error updating ${type} assignments:`, error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentIds = currentAssignments.map(assignment =>
    type === 'videos' ? (assignment as VideoAssignment).videoId : (assignment as MealAssignment).mealId
  );

  const toAdd = selectedItems.filter(id => !currentIds.includes(id));
  const toRemove = currentIds.filter(id => !selectedItems.includes(id));
  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`sticky top-0 ${type === 'videos' ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600' : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600'} text-white p-6 rounded-t-3xl`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Edit {clientName}&apos;s {type === 'videos' ? 'Video' : 'Meal'} Assignments
              </h2>
              <p className="text-white/90 mt-1">
                {selectedItems.length} {type} selected
                {hasChanges && (
                  <span className="ml-2">
                    ({toAdd.length} to add, {toRemove.length} to remove)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Pending Changes:</h3>
              <div className="flex items-center gap-6 text-sm">
                {toAdd.length > 0 && (
                  <span className="text-green-700">
                    ✅ Adding {toAdd.length} {type}
                  </span>
                )}
                {toRemove.length > 0 && (
                  <span className="text-red-700">
                    ❌ Removing {toRemove.length} {type}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-96 overflow-y-auto">
              {filteredContent.map(item => {
                const isCurrentlyAssigned = currentIds.includes(item.id);
                const isSelected = selectedItems.includes(item.id);
                const willBeAdded = isSelected && !isCurrentlyAssigned;
                const willBeRemoved = !isSelected && isCurrentlyAssigned;

                return (
                  <label
                    key={item.id}
                    className={`cursor-pointer block p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? type === 'videos'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-green-500 bg-green-50'
                        : willBeRemoved
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleItemToggle(item.id)}
                      className="sr-only"
                    />

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${isSelected ? (type === 'videos' ? 'border-purple-500 bg-purple-500' : 'border-green-500 bg-green-500') : 'border-gray-300'}`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {type === 'videos' ? (item as Video).title : (item as Meal).name}
                          </h4>
                          {isCurrentlyAssigned && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Currently Assigned
                            </span>
                          )}
                          {willBeAdded && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Will Add</span>
                          )}
                          {willBeRemoved && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Will Remove</span>
                          )}
                        </div>

                        {type === 'videos' ? (
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{formatDuration((item as Video).duration)}</span>
                            <span>•</span>
                            <span className="capitalize">{(item as Video).category}</span>
                            <span>•</span>
                            <span className="capitalize">{(item as Video).difficulty}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{(item as Meal).calories} cal</span>
                            <span>•</span>
                            <span>{(item as Meal).protein}g protein</span>
                            <span>•</span>
                            <span className="capitalize">{(item as Meal).type}</span>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {selectedItems.length} {type} selected
              {hasChanges && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {toAdd.length + toRemove.length} changes pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={!hasChanges || saving}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  hasChanges && !saving
                    ? type === 'videos'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes ({toAdd.length + toRemove.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
