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
  const allTags = Array.from(new Set(assignments.flatMap(a => (Array.isArray(a.video.tags) ? a.video.tags : []))));

  const filteredAssignments =
    selectedTag === 'all'
      ? assignments
      : assignments.filter(a => Array.isArray(a.video.tags) && a.video.tags.includes(selectedTag));

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
            {coachInfo && <p className="text-sm text-muted-foreground mt-1">Coach: {coachInfo.name}</p>}
          </div>

          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">All Categories</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
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
                              <span key={idx} className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
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
                        <div className="text-xs text-muted-foreground mb-2">{assignment.video.difficulty}</div>
                        {assignment.isCompleted && (
                          <span className="inline-flex items-center text-xs text-green-600">✓ Done</span>
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
