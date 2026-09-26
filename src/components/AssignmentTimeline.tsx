'use client';

import { CalendarIcon, ForkKnifeIcon, NotePencilIcon, TrashIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import Image from 'next/image';
import { VideoAssignment } from '@/types/video';

interface TimelineEvent {
  id: string;
  type: 'video_assigned' | 'meal_assigned' | 'video_removed' | 'meal_removed' | 'note_added';
  title: string;
  description: string;
  date: Date;
  item?: any;
  notes?: string;
}

interface MealAssignment {
  id: string;
  mealId: string;
  assignedDate: Date;
  dueDate?: Date;
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

interface AssignmentTimelineProps {
  assignments: VideoAssignment[] | MealAssignment[];
  type: 'videos' | 'meals';
  onUpdateAction: () => void;
}

export default function AssignmentTimeline({ assignments, type, onUpdateAction }: AssignmentTimelineProps) {
  const [showAddNote, setShowAddNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  // Generate timeline events
  const generateTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Ensure assignments is an array
    if (!Array.isArray(assignments)) {
      return events;
    }

    if (type === 'videos') {
      // Add video assignments
      (assignments as VideoAssignment[]).forEach(assignment => {
        events.push({
          id: `video-${assignment.id}`,
          type: 'video_assigned',
          title: `Video Assigned: ${assignment.video?.title || 'Unknown Video'}`,
          description: `${assignment.video?.category} • ${assignment.video?.difficulty} • ${Math.floor((assignment.video?.duration || 0) / 60)}min`,
          date: new Date(assignment.assignedDate),
          item: assignment,
          notes: assignment.notes,
        });
      });
    } else {
      // Add meal assignments
      (assignments as MealAssignment[]).forEach(assignment => {
        events.push({
          id: `meal-${assignment.id}`,
          type: 'meal_assigned',
          title: `Meal Assigned: ${assignment.meal.name}`,
          description: `${assignment.meal.type} • ${assignment.meal.calories} cal • ${assignment.meal.protein}g protein`,
          date: assignment.assignedDate,
          item: assignment,
          notes: assignment.notes,
        });
      });
    }

    // Sort by date (newest first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const handleRemoveAssignment = async (type: 'video' | 'meal', id: string) => {
    if (!confirm(`Are you sure you want to remove this ${type} assignment?`)) return;

    try {
      const endpoint = type === 'video' ? `/api/video-assignments/${id}` : `/api/meal-assignments/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdateAction();
      } else {
        console.error(`Failed to remove ${type} assignment`);
      }
    } catch (error) {
      console.error(`Error removing ${type} assignment:`, error);
    }
  };

  const handleUpdateNotes = async (type: 'video' | 'meal', id: string, notes: string) => {
    try {
      const endpoint = type === 'video' ? `/api/video-assignments/${id}` : `/api/meal-assignments/${id}`;
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        setShowAddNote(null);
        setNewNote('');
        onUpdateAction();
      } else {
        console.error(`Failed to update ${type} notes`);
      }
    } catch (error) {
      console.error(`Error updating ${type} notes:`, error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'video_assigned':
        return <VideoCameraIcon className="h-5 w-5" aria-hidden="true" />;
      case 'meal_assigned':
        return <ForkKnifeIcon className="h-5 w-5" aria-hidden="true" />;
      case 'video_removed':
        return <TrashIcon className="h-5 w-5" aria-hidden="true" />;
      case 'meal_removed':
        return <TrashIcon className="h-5 w-5" aria-hidden="true" />;
      case 'note_added':
        return <NotePencilIcon className="h-5 w-5" aria-hidden="true" />;
      default:
        return <CalendarIcon className="h-5 w-5" aria-hidden="true" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'video_assigned':
        return 'bg-purple-100 border-purple-200';
      case 'meal_assigned':
        return 'bg-green-100 border-green-200';
      case 'video_removed':
        return 'bg-red-100 border-red-200';
      case 'meal_removed':
        return 'bg-red-100 border-red-200';
      case 'note_added':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const timeline = generateTimeline();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">
            <CalendarIcon className="h-[1em] w-[1em]" aria-hidden="true" />
          </span>
          Assignment Timeline
        </h3>
        <div className="text-sm text-gray-500">{timeline.length} total assignments</div>
      </div>

      {timeline.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-6">
            {timeline.map(event => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full border-2 ${getEventColor(event.type)} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        <div className="text-xs text-gray-500">
                          {event.date.toLocaleDateString()} at{' '}
                          {event.date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => setShowAddNote(showAddNote === event.id ? null : event.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="Add/Edit Notes"
                          aria-label="Add or edit notes"
                        >
                          <NotePencilIcon size={16} aria-hidden="true" />
                        </button>

                        {event.type.includes('assigned') && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveAssignment(event.type.includes('video') ? 'video' : 'meal', event.item.id)
                            }
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove Assignment"
                            aria-label="Remove assignment"
                          >
                            <TrashIcon size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes section */}
                    {event.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600">
                            <NotePencilIcon className="h-[1em] w-[1em]" aria-hidden="true" />
                          </span>
                          <p className="text-sm text-blue-800">{event.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Add/Edit notes form */}
                    {showAddNote === event.id && (
                      <div className="mt-3 p-3 bg-gray-100 rounded-lg border border-gray-300">
                        <textarea
                          value={newNote || event.notes || ''}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder="Add notes for this assignment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={3}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              handleUpdateNotes(
                                event.type.includes('video') ? 'video' : 'meal',
                                event.item.id,
                                newNote || event.notes || '',
                              )
                            }
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Save Notes
                          </button>
                          <button
                            onClick={() => {
                              setShowAddNote(null);
                              setNewNote('');
                            }}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Enhanced item details */}
                    {event.type === 'video_assigned' && event.item?.video && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-start gap-3">
                          {event.item.video.thumbnailUrl ? (
                            <Image
                              src={event.item.video.thumbnailUrl}
                              alt={event.item.video.title}
                              width={64}
                              height={48}
                              className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-600">
                                <VideoCameraIcon className="h-[1em] w-[1em]" aria-hidden="true" />
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-purple-900 text-sm">{event.item.video.title}</h5>
                            <div className="flex items-center gap-3 text-xs text-purple-700 mt-1">
                              <span>{formatDuration(event.item.video.duration)}</span>
                              <span>•</span>
                              <span className="capitalize">{event.item.video.difficulty}</span>
                              <span>•</span>
                              <span className="capitalize">{event.item.video.category}</span>
                            </div>
                            {event.item.dueDate && (
                              <div className="text-xs text-purple-600 mt-1">
                                Due: {new Date(event.item.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {event.type === 'meal_assigned' && event.item?.meal && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-12 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-lg">
                              <ForkKnifeIcon size={20} aria-hidden="true" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-green-900 text-sm">{event.item.meal.name}</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs text-green-700 mt-1">
                              <span>{event.item.meal.calories} cal</span>
                              <span>{event.item.meal.protein}g protein</span>
                              <span>{event.item.meal.carbs}g carbs</span>
                              <span>{event.item.meal.fat}g fat</span>
                            </div>
                            {event.item.dueDate && (
                              <div className="text-xs text-green-600 mt-1">
                                Due: {new Date(event.item.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            <CalendarIcon className="h-[1em] w-[1em]" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
          <p className="text-gray-500">Start assigning videos and meals to see the timeline here.</p>
        </div>
      )}
    </div>
  );
}
