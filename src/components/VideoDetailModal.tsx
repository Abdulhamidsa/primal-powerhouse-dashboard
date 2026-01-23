'use client';

import { Video } from '@/types/video';
import { useState } from 'react';

interface VideoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onEdit?: (video: Video) => void;
  onDelete?: (videoId: string) => void;
  onAssign?: (video: Video) => void;
}

export default function VideoDetailModal({
  isOpen,
  onClose,
  video,
  onEdit,
  onDelete,
  onAssign,
}: VideoDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  if (!isOpen || !video) return null;

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
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-orange-100 text-orange-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'STRENGTH_TRAINING':
        return '🏋️';
      case 'CARDIO':
        return '🏃';
      case 'MOBILITY':
        return '🧘';
      case 'YOGA':
        return '🕉️';
      case 'PILATES':
        return '🤸';
      case 'WARM_UP':
        return '🔥';
      case 'COOL_DOWN':
        return '❄️';
      case 'FUNCTIONAL':
        return '⚡';
      case 'REHABILITATION':
        return '🏥';
      case 'SPORTS_SPECIFIC':
        return '⚽';
      default:
        return '🎯';
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(video.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  {getCategoryIcon(video.category)} {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
                </span>
                <span className="text-blue-200">•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)} bg-white/20 text-white`}
                >
                  💪 {video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
                </span>
                <span className="text-blue-200">•</span>
                <span className="flex items-center gap-1">⏱️ {formatDuration(video.duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onAssign && (
                <button
                  onClick={() => {
                    if (onAssign) onAssign(video);
                  }}
                  className="flex items-center gap-1 text-white/90 hover:text-white bg-green-500/30 hover:bg-green-500/50 rounded-xl px-3 py-2 transition-all"
                  title="Assign to Clients"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium text-sm">Assign</span>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(video)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                  title="Edit Video"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-white/80 hover:text-white hover:bg-red-500/30 rounded-xl p-2 transition-all"
                  title="Delete Video"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
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
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="xl:col-span-2">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
                {isYouTubeOrVimeo(video.videoUrl) ? (
                  <iframe
                    src={getEmbedUrl(video.videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.videoUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={video.videoUrl} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium opacity-75">Video format not supported</p>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                    >
                      Open Original Link
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{video.description}</p>
              </div>

              {/* Instructions */}
              {video.instructions && video.instructions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Instructions
                  </h3>
                  <div className="space-y-3">
                    {video.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3 bg-green-50 rounded-xl p-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {video.tips && video.tips.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Tips & Form Cues
                  </h3>
                  <div className="space-y-3">
                    {video.tips.map((tip, index) => (
                      <div key={index} className="flex gap-3 bg-yellow-50 rounded-xl p-4">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-yellow-500 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Video Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                    />
                  </svg>
                  Video Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-800">{formatDuration(video.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold text-gray-800">
                      {getCategoryIcon(video.category)}{' '}
                      {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Difficulty</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}
                    >
                      💪 {video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              {video.equipment && video.equipment.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.equipment.map((item, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        🏋️ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Muscle Groups */}
              {video.muscleGroups && video.muscleGroups.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Muscle Groups Targeted
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.muscleGroups.map((muscle, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        🎯 {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-3xl">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Video</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete &quot;{video.title}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete Video'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
