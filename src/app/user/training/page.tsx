'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
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

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto no-scrollbar rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-1">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'shrink-0 px-3 py-1.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
              active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Thumb({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      <div className="relative h-16 w-24 sm:h-16 sm:w-24 overflow-hidden rounded-2xl border border-border bg-muted">
        <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="h-16 w-24 overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="opacity-60">
        <path d="M10.5 8.5V15.5L16 12L10.5 8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path
          d="M7 4.5H17C18.3807 4.5 19.5 5.61929 19.5 7V17C19.5 18.3807 18.3807 19.5 17 19.5H7C5.61929 19.5 4.5 18.3807 4.5 17V7C4.5 5.61929 5.61929 4.5 7 4.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </div>
  );
}

export default function UserTrainingPage() {
  const [assignments, setAssignments] = useState<VideoAssignment[]>([]);
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
    }
  };

  const markVideoCompleted = async (assignmentId: string) => {
    try {
      const response = await fetch('/api/user/videos/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });

      if (response.ok) {
        setAssignments(prev => prev.map(a => (a.id === assignmentId ? { ...a, isCompleted: true } : a)));
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

  const allTags = useMemo(
    () => Array.from(new Set(assignments.flatMap(a => (Array.isArray(a.video.tags) ? a.video.tags : [])))),
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    if (selectedTag === 'all') return assignments;
    return assignments.filter(a => Array.isArray(a.video.tags) && a.video.tags.includes(selectedTag));
  }, [assignments, selectedTag]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">My Training</h1>
            <p className="text-sm text-muted-foreground">
              Your plan, clean and simple{coachInfo?.name ? ` • Coach: ${coachInfo.name}` : ''}.
            </p>
          </div>

          {allTags.length > 0 && (
            <div className="sm:shrink-0">
              <Segmented
                value={selectedTag}
                onChange={setSelectedTag}
                options={[{ label: 'All', value: 'all' }, ...allTags.slice(0, 8).map(t => ({ label: t, value: t }))]}
              />
            </div>
          )}
        </div>

        {/* Empty */}
        {filteredAssignments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center">
            <p className="text-sm text-muted-foreground">No videos assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map(assignment => {
              const dateLabel = format(new Date(assignment.assignedDate), 'MMM dd');
              const timeLabel = assignment.scheduledTime ? format(new Date(assignment.scheduledTime), 'HH:mm') : null;

              return (
                <div
                  key={assignment.id}
                  className={[
                    'rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-4',
                    'transition-all hover:shadow-md hover:border-border/70',
                  ].join(' ')}
                >
                  {/* Make it stack on very small screens */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={() => openVideoModal(assignment)}
                      className="shrink-0 self-start"
                      aria-label={`Open ${assignment.video.title}`}
                    >
                      <Thumb src={assignment.video.thumbnailUrl} alt={assignment.video.title} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {dateLabel}
                            {timeLabel ? <span className="ml-2">• {timeLabel}</span> : null}
                          </p>

                          <h3 className="mt-0.5 font-semibold text-foreground truncate">{assignment.video.title}</h3>

                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {assignment.video.description}
                          </p>
                        </div>

                        {assignment.isCompleted ? (
                          <span className="shrink-0 rounded-full border border-border bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground">
                            Done
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* meta row */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-background/60 border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {formatDuration(assignment.video.duration)}
                        </span>
                        <span className="rounded-full bg-background/60 border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {assignment.video.difficulty}
                        </span>

                        {Array.isArray(assignment.video.tags) && assignment.video.tags.length > 0 && (
                          <span className="rounded-full bg-background/60 border border-border px-2.5 py-1 text-xs text-muted-foreground">
                            {assignment.video.tags[0]}
                            {assignment.video.tags.length > 1 ? ` +${assignment.video.tags.length - 1}` : ''}
                          </span>
                        )}
                      </div>

                      {/* actions: stack on phone */}
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <button
                          onClick={() => openVideoModal(assignment)}
                          className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          Watch
                        </button>

                        {!assignment.isCompleted && (
                          <button
                            onClick={() => markVideoCompleted(assignment.id)}
                            className="w-full sm:w-auto px-4 py-2 rounded-2xl border border-border bg-background/50 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            Mark done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
