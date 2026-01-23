'use client';

import { useState, useEffect } from 'react';
import { Video, VideoAssignment } from '@/types/video';

interface MealAssignment {
  id: string;
  mealId: string;
  assignedDate: Date;
  dueDate?: Date;
  scheduledTime?: string;
  status: string;
  notes?: string;
  meal: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    description?: string;
    imageUrl?: string;
  };
}

interface AssignmentSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  type: 'videos' | 'meals';
  assignments: VideoAssignment[] | MealAssignment[];
  onUpdate: () => void;
}

interface ScheduleItem {
  id: string;
  title: string;
  type: 'video' | 'meal';
  scheduledDate: Date;
  scheduledTime: string;
  duration?: number;
  originalAssignment: VideoAssignment | MealAssignment;
}

export default function AssignmentScheduler({
  isOpen,
  onClose,
  clientId,
  clientName,
  type,
  assignments,
  onUpdate,
}: AssignmentSchedulerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);
  const [showTimeModal, setShowTimeModal] = useState<{
    item: ScheduleItem;
    day: Date;
    time: string;
  } | null>(null);

  // Generate week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);
  const weekNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (isOpen) {
      generateScheduleItems();
    }
  }, [isOpen, assignments, type]);

  const generateScheduleItems = () => {
    const items: ScheduleItem[] = [];

    assignments.forEach(assignment => {
      if (type === 'videos') {
        const videoAssignment = assignment as VideoAssignment;
        items.push({
          id: videoAssignment.id,
          title: videoAssignment.video?.title || 'Unknown Video',
          type: 'video',
          scheduledDate: videoAssignment.dueDate || videoAssignment.assignedDate,
          scheduledTime: '09:00', // Default time
          duration: videoAssignment.video?.duration || 0,
          originalAssignment: videoAssignment,
        });
      } else {
        const mealAssignment = assignment as MealAssignment;
        items.push({
          id: mealAssignment.id,
          title: mealAssignment.meal.name,
          type: 'meal',
          scheduledDate: mealAssignment.dueDate || mealAssignment.assignedDate,
          scheduledTime: getMealDefaultTime(mealAssignment.meal.type),
          originalAssignment: mealAssignment,
        });
      }
    });

    setScheduleItems(items);
  };

  const getMealDefaultTime = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '08:00';
      case 'lunch':
        return '12:00';
      case 'dinner':
        return '18:00';
      case 'snack':
        return '15:00';
      default:
        return '12:00';
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const isItemScheduledForDay = (item: ScheduleItem, day: Date) => {
    const itemDate = new Date(item.scheduledDate);
    return (
      itemDate.getDate() === day.getDate() &&
      itemDate.getMonth() === day.getMonth() &&
      itemDate.getFullYear() === day.getFullYear()
    );
  };

  const getItemsForDay = (day: Date) => {
    return scheduleItems
      .filter(item => isItemScheduledForDay(item, day))
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  };

  const handleDragStart = (item: ScheduleItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (day: Date, time?: string) => {
    if (!draggedItem) return;

    const updatedItems = scheduleItems.map(item => {
      if (item.id === draggedItem.id) {
        return {
          ...item,
          scheduledDate: day,
          scheduledTime: time || item.scheduledTime,
        };
      }
      return item;
    });

    setScheduleItems(updatedItems);
    setDraggedItem(null);
  };

  const handleTimeChange = (item: ScheduleItem, day: Date, newTime: string) => {
    setShowTimeModal({ item, day, time: newTime });
  };

  const saveTimeChange = () => {
    if (!showTimeModal) return;

    const { item, day, time } = showTimeModal;
    const updatedItems = scheduleItems.map(scheduleItem => {
      if (scheduleItem.id === item.id) {
        return {
          ...scheduleItem,
          scheduledDate: day,
          scheduledTime: time,
        };
      }
      return scheduleItem;
    });

    setScheduleItems(updatedItems);
    setShowTimeModal(null);
  };

  const saveSchedule = async () => {
    try {
      for (const item of scheduleItems) {
        const endpoint =
          item.type === 'video' ? `/api/video-assignments/${item.id}` : `/api/meal-assignments/${item.id}`;

        await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dueDate: item.scheduledDate.toISOString(),
            scheduledTime: item.scheduledTime,
          }),
        });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`sticky top-0 ${type === 'videos' ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600' : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600'} text-white p-6 rounded-t-3xl`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Schedule {clientName}&apos;s {type === 'videos' ? 'Videos' : 'Meals'}
              </h2>
              <p className="text-white/90 mt-1">Drag and drop assignments to schedule them throughout the week</p>
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
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateWeek('prev')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous Week
            </button>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
                {weekDates[6].toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              Next Week
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4 mb-6">
            {weekDates.map((day, index) => (
              <div key={day.toString()} className="border border-gray-200 rounded-lg">
                {/* Day Header */}
                <div
                  className={`p-3 text-center font-medium ${new Date().toDateString() === day.toDateString() ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700'} rounded-t-lg`}
                >
                  <div className="text-sm">{weekNames[index]}</div>
                  <div className="text-lg">{day.getDate()}</div>
                </div>

                {/* Drop Zone */}
                <div
                  className="min-h-48 p-2 space-y-2"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(day)}
                >
                  {getItemsForDay(day).map(item => (
                    <div
                      key={`${item.id}-${day.toString()}`}
                      draggable
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      className={`p-2 rounded-lg border-2 cursor-move hover:shadow-md transition-all ${item.type === 'video' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-green-50 border-green-200 text-green-900'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{item.scheduledTime}</span>
                        <button
                          onClick={() => handleTimeChange(item, day, item.scheduledTime)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ⏰
                        </button>
                      </div>
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      {item.type === 'video' && item.duration && (
                        <div className="text-xs text-gray-600">{formatDuration(item.duration)}</div>
                      )}
                      {item.type === 'meal' && (
                        <div className="text-xs text-gray-600">
                          {(item.originalAssignment as MealAssignment).meal.type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Unscheduled Items */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Unscheduled {type}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleItems
                .filter(item => !weekDates.some(day => isItemScheduledForDay(item, day)))
                .map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 rounded-lg border-2 cursor-move hover:shadow-md transition-all ${item.type === 'video' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-green-50 border-green-200 text-green-900'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.type === 'video' ? '🎥' : '🍽️'}</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.type === 'video' && item.duration && (
                      <div className="text-sm text-gray-600">{formatDuration(item.duration)}</div>
                    )}
                    {item.type === 'meal' && (
                      <div className="text-sm text-gray-600">
                        {(item.originalAssignment as MealAssignment).meal.calories} cal
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <div className="text-sm text-gray-500">{scheduleItems.length} total assignments</div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  type === 'videos'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Set Time</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time for {showTimeModal.item.title}
              </label>
              <input
                type="time"
                value={showTimeModal.time}
                onChange={e => setShowTimeModal({ ...showTimeModal, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTimeModal(null)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTimeChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
