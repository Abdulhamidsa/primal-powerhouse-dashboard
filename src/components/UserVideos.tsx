'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Play, Clock, X, CheckCircle, Filter, Dumbbell, Heart, Zap, User } from 'lucide-react';

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
  });

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
        return <Dumbbell className="w-5 h-5" />;
      case 'cardio':
        return <Heart className="w-5 h-5" />;
      case 'mobility':
      case 'yoga':
        return <User className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
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
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading your workouts...</p>
        </div>
      </div>
    );
  }

  if (videoAssignments.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No Workouts Yet</h3>
          <p className="text-slate-400 max-w-sm">
            Your coach will assign your training videos soon. Get ready to sweat!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Training Videos</h2>
            <p className="text-slate-400">Your personalized workout collection</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-700/50 rounded-xl p-1">
              {[
                { key: 'all', label: 'All', icon: Filter },
                { key: 'pending', label: 'Todo', icon: Clock },
                { key: 'completed', label: 'Done', icon: CheckCircle },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    filter === tab.key ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Progress</p>
              <p className="text-white font-semibold">
                {videoAssignments.filter(a => a.isCompleted).length} of {videoAssignments.length} completed
              </p>
            </div>
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {Math.round((videoAssignments.filter(a => a.isCompleted).length / videoAssignments.length) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="space-y-4">
          {filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center p-4 gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  {assignment.video.thumbnailUrl ? (
                    <Image
                      src={assignment.video.thumbnailUrl}
                      alt={assignment.video.title}
                      className="w-full h-full object-cover rounded-xl"
                      fill
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
                      <Play className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white" />
                  </div>

                  {/* Completion badge */}
                  {assignment.isCompleted && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-purple-400">{getCategoryIcon(assignment.video.category)}</div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(assignment.video.difficulty)}`}
                    >
                      {assignment.video.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {formatDuration(assignment.video.duration)}
                    </div>
                  </div>

                  <h3 className="text-white font-semibold mb-1 truncate">{assignment.video.title}</h3>

                  {assignment.video.description && (
                    <p className="text-slate-400 text-sm truncate mb-2">{assignment.video.description}</p>
                  )}

                  {/* Progress bar */}
                  {assignment.progress > 0 && (
                    <div className="mb-2">
                      <div className="w-full bg-slate-600/50 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${assignment.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setSelectedVideo(assignment)}
                    className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl transition-colors"
                  >
                    <Play className="w-5 h-5 text-purple-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">{selectedVideo.video.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Player */}
              <div className="bg-black rounded-xl mb-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Ready to train?</p>
                  <a
                    href={selectedVideo.video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                  >
                    <Play size={16} />
                    Start Workout
                  </a>
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-white font-semibold text-sm">
                      {formatDuration(selectedVideo.video.duration)}
                    </div>
                    <div className="text-slate-400 text-xs">Duration</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <div className="text-purple-400 mb-1">{getCategoryIcon(selectedVideo.video.category)}</div>
                    <div className="text-white font-semibold text-sm capitalize">
                      {selectedVideo.video.category.replace('_', ' ')}
                    </div>
                    <div className="text-slate-400 text-xs">Type</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                    <Zap className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                    <div
                      className={`font-semibold text-sm capitalize ${getDifficultyColor(selectedVideo.video.difficulty)}`}
                    >
                      {selectedVideo.video.difficulty}
                    </div>
                    <div className="text-slate-400 text-xs">Level</div>
                  </div>
                </div>

                {selectedVideo.video.description && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">About This Workout</h4>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <p className="text-slate-300 text-sm leading-relaxed">{selectedVideo.video.description}</p>
                    </div>
                  </div>
                )}

                {selectedVideo.video.instructions && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Instructions</h4>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <pre className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedVideo.video.instructions}
                      </pre>
                    </div>
                  </div>
                )}

                {!selectedVideo.isCompleted && (
                  <button
                    onClick={() => markAsCompleted(selectedVideo.id)}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Mark as Completed
                  </button>
                )}

                {selectedVideo.isCompleted && (
                  <div className="w-full py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                    <CheckCircle size={20} />
                    Workout Completed!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
