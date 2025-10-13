'use client';

import { useState, useEffect } from 'react';
import VideoPlayerModal from '@/components/VideoPlayerModal';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  tags: string[];
  thumbnailUrl?: string;
  videoUrl: string;
}

interface VideoAssignment {
  id: string;
  assignedDate: Date;
  isCompleted: boolean;
  video: Video;
}

export default function UserTrainingPage() {
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoAssignment | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    fetchUserVideos();
  }, []);

  const fetchUserVideos = async () => {
    try {
      const response = await fetch('/api/user/videos');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const markVideoCompleted = async (assignmentId: string) => {
    try {
      const response = await fetch('/api/user/videos/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId }),
      });

      if (response.ok) {
        setAssignments(
          assignments.map(assignment =>
            assignment.id === assignmentId ? { ...assignment, isCompleted: true } : assignment
          )
        );
      }
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  const openVideoModal = (assignment: VideoAssignment) => {
    setSelectedVideo(assignment);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
  };

  const handleVideoComplete = () => {
    if (selectedVideo) {
      markVideoCompleted(selectedVideo.id);
      closeVideoModal();
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'completed') return assignment.isCompleted;
    if (filter === 'pending') return !assignment.isCompleted;
    return true;
  });

  // Group videos by muscle groups
  const getVideosByMuscleGroup = () => {
    const muscleGroups: { [key: string]: VideoAssignment[] } = {};

    filteredAssignments.forEach(assignment => {
      const tags = Array.isArray(assignment.video.tags)
        ? assignment.video.tags
        : assignment.video.tags.split(',').map(tag => tag.trim());

      let muscleGroup = 'General Fitness';

      // Determine muscle group based on tags
      if (tags.some(tag => ['chest', 'push', 'bench'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Chest';
      } else if (tags.some(tag => ['back', 'pull', 'lat', 'row'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Back';
      } else if (tags.some(tag => ['leg', 'squat', 'glute', 'quad', 'hamstring'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Legs';
      } else if (tags.some(tag => ['shoulder', 'deltoid', 'press'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Shoulders';
      } else if (tags.some(tag => ['arm', 'bicep', 'tricep', 'curl'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Arms';
      } else if (tags.some(tag => ['core', 'abs', 'plank', 'crunch'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Core';
      } else if (tags.some(tag => ['cardio', 'hiit', 'running', 'cycling'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Cardio';
      } else if (tags.some(tag => ['stretch', 'flexibility', 'yoga', 'mobility'].includes(tag.toLowerCase()))) {
        muscleGroup = 'Flexibility';
      }

      if (!muscleGroups[muscleGroup]) {
        muscleGroups[muscleGroup] = [];
      }
      muscleGroups[muscleGroup].push(assignment);
    });

    return muscleGroups;
  };

  const muscleGroups = getVideosByMuscleGroup();

  const getMuscleGroupIcon = (muscleGroup: string) => {
    const icons: { [key: string]: string } = {
      Chest: '💪',
      Back: '🔙',
      Legs: '🦵',
      Shoulders: '🏋️',
      Arms: '💥',
      Core: '🎯',
      Cardio: '❤️',
      Flexibility: '🧘',
      'General Fitness': '⚡',
    };
    return icons[muscleGroup] || '💪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const completedCount = assignments.filter(a => a.isCompleted).length;
  const totalCount = assignments.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Videos 🎥</h1>
          <p className="text-muted-foreground">Your personalized workout video assignments</p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Total Videos</h3>
          <p className="text-2xl font-bold text-primary">{totalCount}</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Progress</h3>
          <p className="text-2xl font-bold text-primary">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending ({totalCount - completedCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Training by Muscle Groups */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {filter === 'all'
              ? 'No videos assigned yet'
              : filter === 'completed'
                ? 'No completed videos'
                : 'No pending videos'}
          </h3>
          <p className="text-muted-foreground">
            {filter === 'all'
              ? 'Your coach will assign training videos soon.'
              : filter === 'completed'
                ? 'Complete some videos to see them here.'
                : 'Great job! All videos are completed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(muscleGroups).map(([muscleGroup, assignments]) => (
            <div key={muscleGroup} className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <span className="mr-2">{getMuscleGroupIcon(muscleGroup)}</span>
                  {muscleGroup} Training
                </h2>
                <span className="text-sm text-muted-foreground">
                  {assignments.length} video{assignments.length !== 1 ? 's' : ''} •{' '}
                  {assignments.filter(a => a.isCompleted).length} completed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="bg-background p-4 rounded-lg border border-border hover:shadow-md transition-shadow group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                          {assignment.video.title}
                        </h3>
                        <div
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                            assignment.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {assignment.isCompleted ? '✓ Completed' : 'Pending'}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-medium text-primary">{assignment.video.duration} min</p>
                        <p className="text-xs text-muted-foreground">{assignment.video.difficulty}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{assignment.video.description}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                          />
                        </svg>
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </span>
                    </div>

                    {assignment.video.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(Array.isArray(assignment.video.tags)
                          ? assignment.video.tags
                          : assignment.video.tags.split(',').map(tag => tag.trim())
                        )
                          .slice(0, 3)
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openVideoModal(assignment)}
                        className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded text-sm text-center hover:bg-primary/90 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play Video
                      </button>
                      {!assignment.isCompleted && (
                        <button
                          onClick={() => markVideoCompleted(assignment.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          ✓ Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={isVideoModalOpen}
          onClose={closeVideoModal}
          video={{
            title: selectedVideo.video.title,
            description: selectedVideo.video.description,
            videoUrl: selectedVideo.video.videoUrl,
            duration: selectedVideo.video.duration,
            difficulty: selectedVideo.video.difficulty,
          }}
          onComplete={selectedVideo.isCompleted ? undefined : handleVideoComplete}
        />
      )}
    </div>
  );
}
