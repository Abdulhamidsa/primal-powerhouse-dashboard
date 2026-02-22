'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  tags: string[];
  thumbnailUrl?: string;
  videoUrl: string;
  instructions?: string[];
  muscleGroups?: string[];
  equipment?: string[];
}

interface VideoAssignment {
  id: string;
  assignedDate: string;
  isCompleted: boolean;
  notes?: string;
  video: Video;
}

function formatDuration(seconds: number) {
  const mins = Math.max(1, Math.floor(seconds / 60));
  return `${mins} min`;
}

export default function UserVideoDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [assignment, setAssignment] = useState<VideoAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImage = useMemo(() => {
    if (!assignment?.video?.videoUrl) return false;
    return /\.(gif|webp|png|jpg|jpeg)$/i.test(assignment.video.videoUrl);
  }, [assignment]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/videos/${assignmentId}`);
        if (!response.ok) {
          throw new Error('Failed to load exercise details');
        }
        const data = await response.json();
        setAssignment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      run();
    }
  }, [assignmentId]);

  const handleImageFullscreen = async () => {
    const container = document.getElementById('exercise-media-container');
    if (!container) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-80 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-4">
        <Link href="/user/training" className="inline-flex items-center text-sm text-primary hover:underline">
          ← Back to training
        </Link>
        <div className="bg-card border border-border rounded-xl p-6 text-destructive">{error ?? 'Video not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/user/training" className="inline-flex items-center text-sm text-primary hover:underline">
        ← Back to training
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
          <div id="exercise-media-container" className="relative bg-black">
            {isImage ? (
              <button
                type="button"
                onClick={handleImageFullscreen}
                className="relative block w-full h-[420px] sm:h-[520px] focus:outline-none"
                title="Click to toggle fullscreen"
              >
                <Image
                  src={assignment.video.videoUrl}
                  alt={assignment.video.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              </button>
            ) : (
              <video
                src={assignment.video.videoUrl}
                controls
                className="w-full h-[420px] sm:h-[520px] object-contain"
              />
            )}

            <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded bg-black/60 text-white">
              Click media for fullscreen
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h1 className="text-2xl font-bold text-foreground mb-2">{assignment.video.title}</h1>
            <p className="text-sm text-muted-foreground mb-4">{assignment.video.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">{formatDuration(assignment.video.duration)}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground">Difficulty</p>
                <p className="font-semibold text-foreground">{assignment.video.difficulty}</p>
              </div>
            </div>

            {assignment.video.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {assignment.video.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">Instructions</h2>
            {assignment.video.instructions && assignment.video.instructions.length > 0 ? (
              <ol className="space-y-2 list-decimal pl-5 text-sm text-foreground/90">
                {assignment.video.instructions.map(step => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No instructions available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
