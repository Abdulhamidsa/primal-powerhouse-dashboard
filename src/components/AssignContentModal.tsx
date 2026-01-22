'use client';

import * as React from 'react';
import { Video } from '@/types/video';
import { Meal, MealIngredient } from '@/types/meal';
import IntegratedMealAssignmentModal from './IntegratedMealAssignmentModal';

// Use React hooks directly from React namespace
const { useState, useEffect } = React;

interface AssignContentModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  clientId: string;
  clientName: string;
  type: 'videos' | 'meals';
  onAssignmentCompleteAction: () => void;
}

export default function AssignContentModal({
  isOpen,
  onCloseAction,
  clientId,
  clientName,
  type,
  onAssignmentCompleteAction,
}: AssignContentModalProps) {
  const [content, setContent] = useState<Video[] | Meal[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewItem, setPreviewItem] = useState<Video | Meal | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Show the integrated meal assignment modal for meals
  const [showIntegratedModal, setShowIntegratedModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (type === 'meals') {
        // For meals, we'll use the integrated meal assignment modal
        setShowIntegratedModal(true);
      } else {
        // For videos, use the standard modal
        fetchContent();
      }
    } else {
      // Reset form when modal closes
      setSelectedItems([]);
      setDueDate('');
      setNotes('');
      setSearchTerm('');
      setShowIntegratedModal(false);
    }
  }, [isOpen, type]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'videos' ? '/api/videos' : '/api/meals';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter((item: Video | Meal) => {
    const searchLower = searchTerm.toLowerCase();
    if (type === 'videos') {
      const video = item as Video;
      return (
        video.title?.toLowerCase().includes(searchLower) ||
        false ||
        video.description?.toLowerCase().includes(searchLower) ||
        false ||
        video.category?.toString().toLowerCase().includes(searchLower) ||
        false
      );
    } else {
      const meal = item as Meal;
      return (
        meal.name?.toLowerCase().includes(searchLower) ||
        false ||
        meal.description?.toLowerCase().includes(searchLower) ||
        false ||
        meal.type?.toString().toLowerCase().includes(searchLower) ||
        false
      );
    }
  });

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev: string[]) =>
      prev.includes(itemId) ? prev.filter((id: string) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredContent.map((item: Video | Meal) => item.id));
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleAssign = async () => {
    if (selectedItems.length === 0) return;

    setAssigning(true);
    try {
      if (type === 'videos') {
        const assignments = selectedItems.map((videoId: string) => ({
          clientId,
          videoId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes: notes.trim() || undefined,
        }));

        const response = await fetch('/api/video-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments }),
        });

        if (response.ok) {
          onAssignmentCompleteAction();
          onCloseAction();
        } else {
          console.error('Failed to assign videos');
        }
      } else {
        // For meals, we'll create a meal plan
        const mealAssignments = selectedItems.map((mealId: string) => ({
          mealId,
          dayOfWeek: 1, // Default to Monday
          mealType: 'breakfast', // Default meal type
          portion: 1.0,
          notes: notes.trim() || undefined,
        }));

        const response = await fetch('/api/meal-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            name: `Meal Plan - ${new Date().toLocaleDateString()}`,
            startDate: new Date().toISOString().split('T')[0],
            endDate: dueDate || undefined,
            notes: notes.trim() || undefined,
            mealAssignments,
          }),
        });

        if (response.ok) {
          onAssignmentCompleteAction();
          onCloseAction();
        } else {
          console.error('Failed to assign meals');
        }
      }
    } catch (error) {
      console.error(`Error assigning ${type}:`, error);
    } finally {
      setAssigning(false);
    }
  };

  const formatDurationReadable = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Video embedding helper functions
  const getEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    } else if (url.includes('vimeo.com')) {
      const videoId = extractVimeoId(url);
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
    }
    return url;
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const extractVimeoId = (url: string): string | null => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const isYouTubeOrVimeo = (url: string): boolean => {
    return url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com');
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewItem(null);
  };

  // For meals, delegate to the IntegratedMealAssignmentModal
  if (type === 'meals' && showIntegratedModal) {
    return (
      <IntegratedMealAssignmentModal
        isOpen={isOpen && type === 'meals'}
        onCloseAction={onCloseAction}
        clientId={clientId}
        onAssignedAction={onAssignmentCompleteAction}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div
        className="rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--color-shadow)' }}
      >
        <div className="sticky top-0 p-6 rounded-t-3xl" style={{ background: 'var(--color-accent)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Assign {type === 'videos' ? 'Videos' : 'Meals'} to {clientName}
            </h2>
            <button
              onClick={onCloseAction}
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
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--color-text-muted)' }}
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
              className="w-full pl-12 pr-4 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium flex items-center gap-2"
              style={{ color: 'var(--color-accent)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={selectedItems.length === filteredContent.length ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'}
                />
              </svg>
              {selectedItems.length === filteredContent.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {filteredContent.length} {type} found
            </span>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
              ></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-96 overflow-y-auto">
              {filteredContent.map((item: Video | Meal) => (
                <div
                  key={item.id}
                  className="cursor-pointer block p-4 rounded-xl border transition-all relative group"
                  onClick={() => handleItemToggle(item.id)}
                  style={{
                    borderColor: selectedItems.includes(item.id) ? 'var(--color-accent)' : 'var(--color-border)',
                    background: selectedItems.includes(item.id) ? 'var(--color-accent-muted)' : 'var(--color-card)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleItemToggle(item.id)}
                    className="sr-only"
                  />
                  {/* Preview Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setPreviewItem(item);
                      setShowPreviewModal(true);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'var(--color-accent)',
                      color: 'white',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>

                  <div className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1"
                      style={{
                        borderColor: selectedItems.includes(item.id) ? 'var(--color-accent)' : 'var(--color-border)',
                        background: selectedItems.includes(item.id) ? 'var(--color-accent)' : 'transparent',
                      }}
                    >
                      {selectedItems.includes(item.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate mb-1" style={{ color: 'var(--color-text)' }}>
                        {type === 'videos' ? (item as Video).title : (item as Meal).name}
                      </h4>

                      {type === 'videos' ? (
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{formatDuration((item as Video).duration)}</span>
                          <span>•</span>
                          <span className="capitalize">{(item as Video).category}</span>
                          <span>•</span>
                          <span className="capitalize">{(item as Video).difficulty}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{(item as Meal).calories} cal</span>
                          <span>•</span>
                          <span>{(item as Meal).protein}g protein</span>
                          <span>•</span>
                          <span className="capitalize">{(item as Meal).type}</span>
                        </div>
                      )}

                      {item.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assignment Options */}
          <div className="border-t pt-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Assignment Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  📅 Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  📝 Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any special instructions..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl transition-all resize-none"
                  style={{
                    background: 'var(--color-bg-alt)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-6 mt-6 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {selectedItems.length > 0 && (
                <span>
                  Will assign {selectedItems.length} {type} to {clientName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onCloseAction}
                className="px-6 py-3 rounded-xl hover:bg-opacity-10 transition-all font-medium"
                style={{
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedItems.length === 0 || assigning}
                className="px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                style={{
                  backgroundColor:
                    selectedItems.length > 0 && !assigning ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                  color: selectedItems.length > 0 && !assigning ? 'white' : 'var(--color-text-muted)',
                  opacity: selectedItems.length > 0 && !assigning ? 1 : 0.6,
                  cursor: selectedItems.length > 0 && !assigning ? 'pointer' : 'not-allowed',
                }}
              >
                {assigning ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assign {type} ({selectedItems.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewItem && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={handleClosePreview}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--color-shadow)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="sticky top-0 p-6 rounded-t-3xl flex items-center justify-between"
              style={{ background: 'var(--color-accent)' }}
            >
              <h2 className="text-2xl font-bold text-white">
                {type === 'videos' ? (previewItem as Video).title : (previewItem as Meal).name}
              </h2>
              <button
                onClick={handleClosePreview}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {type === 'videos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Player */}
                  <div className="lg:col-span-2">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-6">
                      {isYouTubeOrVimeo((previewItem as Video).videoUrl) ? (
                        <iframe
                          src={getEmbedUrl((previewItem as Video).videoUrl)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (previewItem as Video).videoUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={(previewItem as Video).videoUrl}
                          controls
                          autoPlay
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center h-full"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <svg
                            className="w-16 h-16 mb-4 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-lg font-medium opacity-75">Video preview not available</p>
                          <a
                            href={(previewItem as Video).videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 px-4 py-2 rounded-lg transition-all"
                            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                          >
                            Open Video URL
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                        Description
                      </h3>
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: 'var(--color-card)', color: 'var(--color-text-muted)' }}
                      >
                        {(previewItem as Video).description || 'No description available'}
                      </div>
                    </div>
                  </div>

                  {/* Video Details */}
                  <div>
                    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-card)' }}>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                        Video Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Duration</span>
                          <span style={{ color: 'var(--color-text)' }}>
                            {formatDurationReadable((previewItem as Video).duration)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Category</span>
                          <span style={{ color: 'var(--color-text)' }}>
                            {(previewItem as Video).category.toString().toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Difficulty</span>
                          <span style={{ color: 'var(--color-text)' }}>
                            {(previewItem as Video).difficulty.toString().toLowerCase()}
                          </span>
                        </div>

                        {((previewItem as Video).equipment ?? []).length > 0 && (
                          <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Equipment</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {((previewItem as Video).equipment ?? []).map((item, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 rounded-full text-xs"
                                  style={{
                                    background: 'var(--color-accent-muted)',
                                    color: 'var(--color-accent)',
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instructions or tips if available */}
                    {((previewItem as Video).instructions ?? []).length > 0 && (
                      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)' }}>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                          Instructions
                        </h3>
                        <ul className="space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                          {((previewItem as Video).instructions ?? []).map((instruction, i) => (
                            <li key={i} className="flex gap-2">
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
                                style={{ background: 'var(--color-accent)', color: 'white' }}
                              >
                                {i + 1}
                              </span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {type === 'meals' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Meal Image and Info */}
                  <div className="lg:col-span-2">
                    {/* Image */}
                    <div className="relative aspect-[4/3] mb-6 rounded-xl overflow-hidden">
                      {(previewItem as Meal).images && (previewItem as Meal).images.length > 0 ? (
                        <img
                          src={(previewItem as Meal).images[0]}
                          alt={(previewItem as Meal).name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            // Fallback image if the meal image fails to load
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/800/600';
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: 'var(--color-card)' }}
                        >
                          <svg
                            className="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            style={{ color: 'var(--color-text-muted)' }}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                        Description
                      </h3>
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: 'var(--color-card)', color: 'var(--color-text-muted)' }}
                      >
                        {(previewItem as Meal).description || 'No description available'}
                      </div>
                    </div>

                    {/* Ingredients */}
                    {(previewItem as Meal).ingredients && (previewItem as Meal).ingredients.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                          Ingredients
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(previewItem as Meal).ingredients.map((ingredient: MealIngredient, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg flex items-center gap-2"
                              style={{ background: 'var(--color-card)', color: 'var(--color-text-muted)' }}
                            >
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
                                style={{ background: 'var(--color-accent)', color: 'white' }}
                              >
                                {i + 1}
                              </span>
                              <span>
                                {ingredient.amount} {ingredient.unit} {ingredient.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meal Details */}
                  <div>
                    {/* Nutritional Info */}
                    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-card)' }}>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                        Nutrition Facts
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Calories</span>
                          <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).calories} kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Protein</span>
                          <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).protein}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Carbs</span>
                          <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).carbs}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Fat</span>
                          <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).fat}g</span>
                        </div>
                        {typeof (previewItem as Meal).fiber === 'number' && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-muted)' }}>Fiber</span>
                            <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).fiber}g</span>
                          </div>
                        )}
                        {typeof (previewItem as Meal).sugar === 'number' && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-muted)' }}>Sugar</span>
                            <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).sugar}g</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meal Info */}
                    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-card)' }}>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                        Meal Info
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Type</span>
                          <span style={{ color: 'var(--color-text)' }} className="capitalize">
                            {(previewItem as Meal).type}
                          </span>
                        </div>
                        {typeof (previewItem as Meal).prepTime === 'number' && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-muted)' }}>Prep Time</span>
                            <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).prepTime} min</span>
                          </div>
                        )}
                        {typeof (previewItem as Meal).cookTime === 'number' && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-muted)' }}>Cook Time</span>
                            <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).cookTime} min</span>
                          </div>
                        )}
                        {typeof (previewItem as Meal).servings === 'number' && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-muted)' }}>Servings</span>
                            <span style={{ color: 'var(--color-text)' }}>{(previewItem as Meal).servings}</span>
                          </div>
                        )}
                        {(previewItem as Meal).difficulty && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-muted)' }}>Difficulty</span>
                            <span style={{ color: 'var(--color-text)' }} className="capitalize">
                              {(previewItem as Meal).difficulty}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {(previewItem as Meal).tags && (previewItem as Meal).tags.length > 0 && (
                      <div className="rounded-xl p-4" style={{ background: 'var(--color-card)' }}>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(previewItem as Meal).tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full text-sm"
                              style={{
                                background: 'var(--color-accent-muted)',
                                color: 'var(--color-accent)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
