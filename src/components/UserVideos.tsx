'use client';

import { useEffect, useState } from 'react';

interface Video {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string;
  equipment?: string;
  muscleGroups?: string;
  tags?: string;
  instructions?: string;
  tips?: string;
}

interface VideoAssignment {
  id: string;
  assignedDate: string;
  dueDate?: string;
  scheduledTime?: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  progress: number;
  video: Video;
}

interface UserVideosProps {
  userId: string;
}

export default function UserVideos({ userId }: UserVideosProps) {
  const [videoAssignments, setVideoAssignments] = useState<VideoAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoAssignment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchVideoAssignments();
  }, [userId]);

  const fetchVideoAssignments = async () => {
    try {
      const response = await fetch(`/api/user-dashboard/videos?clientId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setVideoAssignments(data);
      } else {
        console.error('Failed to fetch video assignments');
      }
    } catch (error) {
      console.error('Error fetching video assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'text-green-400 bg-green-400/10';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'advanced':
        return 'text-orange-400 bg-orange-400/10';
      case 'expert':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength_training':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'cardio':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        );
      case 'mobility':
      case 'yoga':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"
            />
          </svg>
        );
    }
  };

  const markAsCompleted = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/user-dashboard/videos/${assignmentId}/complete`, {
        method: 'POST',
      });
      if (response.ok) {
        setVideoAssignments(prev =>
          prev.map(assignment =>
            assignment.id === assignmentId
              ? { ...assignment, isCompleted: true, completedAt: new Date().toISOString(), progress: 100 }
              : assignment
          )
        );
      }
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  const filteredAssignments = videoAssignments.filter(assignment => {
    switch (filter) {
      case 'pending':
        return !assignment.isCompleted;
      case 'completed':
        return assignment.isCompleted;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-400">Loading your videos...</span>
      </div>
    );
  }

  if (videoAssignments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No Video Assignments Yet</h3>
        <p className="text-gray-400">Your coach will assign training videos soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Training Videos</h2>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-700/50 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-400">
            {videoAssignments.filter(a => a.isCompleted).length} / {videoAssignments.length} completed
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map(assignment => (
          <div
            key={assignment.id}
            className="bg-gray-700/30 rounded-lg overflow-hidden hover:bg-gray-700/50 transition-colors"
          >
            {/* Thumbnail */}
            <div className="relative">
              {assignment.video.thumbnailUrl ? (
                <img
                  src={assignment.video.thumbnailUrl}
                  alt={assignment.video.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"
                    />
                  </svg>
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedVideo(assignment)}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>

              {/* Duration Badge */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(assignment.video.duration)}
              </div>

              {/* Completion Status */}
              {assignment.isCompleted && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Complete
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="text-blue-400">{getCategoryIcon(assignment.video.category)}</div>
                <span className="text-xs text-gray-400 uppercase">{assignment.video.category.replace('_', ' ')}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(assignment.video.difficulty)}`}>
                  {assignment.video.difficulty}
                </span>
              </div>

              <h3 className="text-white font-semibold mb-2 line-clamp-2">{assignment.video.title}</h3>

              {assignment.video.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{assignment.video.description}</p>
              )}

              {/* Progress Bar */}
              {assignment.progress > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{assignment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${assignment.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedVideo(assignment)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    View
                  </button>
                  {!assignment.isCompleted && (
                    <button
                      onClick={() => markAsCompleted(assignment.id)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">{selectedVideo.video.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Video Player Placeholder */}
              <div className="bg-black rounded-lg mb-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"
                    />
                  </svg>
                  <p className="text-gray-400 mb-4">Video Player</p>
                  <a
                    href={selectedVideo.video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Watch Video
                  </a>
                </div>
              </div>

              {/* Video Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Video Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{formatDuration(selectedVideo.video.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white capitalize">{selectedVideo.video.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className={`capitalize ${getDifficultyColor(selectedVideo.video.difficulty)} p-1 rounded`}>
                        {selectedVideo.video.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={selectedVideo.isCompleted ? 'text-green-400' : 'text-yellow-400'}>
                        {selectedVideo.isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Assignment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Assigned:</span>
                      <span className="text-white">{new Date(selectedVideo.assignedDate).toLocaleDateString()}</span>
                    </div>
                    {selectedVideo.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Due:</span>
                        <span className="text-white">{new Date(selectedVideo.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedVideo.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed:</span>
                        <span className="text-green-400">
                          {new Date(selectedVideo.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedVideo.video.description && (
                <div className="mt-6">
                  <h4 className="font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300 text-sm">{selectedVideo.video.description}</p>
                </div>
              )}

              {selectedVideo.video.instructions && (
                <div className="mt-6">
                  <h4 className="font-semibold text-white mb-2">Instructions</h4>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap">{selectedVideo.video.instructions}</pre>
                  </div>
                </div>
              )}

              {selectedVideo.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold text-white mb-2">Coach Notes</h4>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm">{selectedVideo.notes}</p>
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
