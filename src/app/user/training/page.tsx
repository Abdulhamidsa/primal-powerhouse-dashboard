'use client';

import { useState, useEffect } from 'react';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { format } from 'date-fns';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  videoUrl: string;
  muscleGroups?: string;
}

interface VideoAssignment {
  id: string;
  assignedDate: Date;
  scheduledTime?: Date;
  isCompleted: boolean;
  video: Video;
}

interface CoachInfo {
  name: string;
  email: string;
}

export default function UserTrainingPage() {
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoAssignment | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);

  useEffect(() => {
    fetchUserVideos();
    fetchCoachInfo();
  }, []);

  const fetchCoachInfo = async () => {
    try {
      const response = await fetch('/api/user/coach');
      if (response.ok) {
        const data = await response.json();
        setCoachInfo(data.coach);
      }
    } catch (error) {
      console.error('Error fetching coach info:', error);
    }
  };

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

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      assignments.flatMap(a => 
        Array.isArray(a.video.tags) ? a.video.tags : []
      )
    )
  );

  const filteredAssignments = selectedTag === 'all' 
    ? assignments 
    : assignments.filter(a => 
        Array.isArray(a.video.tags) && a.video.tags.includes(selectedTag)
      );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Training Videos</h1>
            {coachInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                Coach: {coachInfo.name}
              </p>
            )}
          </div>
          
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">All Categories</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>

        {/* Videos List */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-card p-12 rounded-lg border border-border text-center">
            <p className="text-muted-foreground">No videos assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map(assignment => (
              <div
                key={assignment.id}
                className="bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Timeline Date */}
                  <div className="text-sm text-muted-foreground min-w-[80px]">
                    {format(new Date(assignment.assignedDate), 'MMM dd')}
                    {assignment.scheduledTime && (
                      <div className="text-xs">{format(new Date(assignment.scheduledTime), 'HH:mm')}</div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{assignment.video.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{assignment.video.description}</p>
                        
                        {/* Tags */}
                        {Array.isArray(assignment.video.tags) && assignment.video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {assignment.video.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Duration & Status */}
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {formatDuration(assignment.video.duration)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {assignment.video.difficulty}
                        </div>
                        {assignment.isCompleted && (
                          <span className="inline-flex items-center text-xs text-green-600">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openVideoModal(assignment)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        Watch Video
                      </button>
                      {!assignment.isCompleted && (
                        <button
                          onClick={() => markVideoCompleted(assignment.id)}
                          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
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
    </div>
  );
}
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
