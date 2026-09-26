'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PlayIcon as Play, PauseIcon as Pause, BarbellIcon as Dumbbell } from '@phosphor-icons/react';
import type { WorkoutPlanExercise } from '@/features/workout-plans/types/workoutPlan.types';

interface Props {
  exercise: WorkoutPlanExercise;
  isTransitioning: boolean;
}

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function isGifUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.gif(\?.*)?$/i.test(url);
}

function isYouTubeOrVimeo(url?: string | null): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&controls=0&playlist=${ytMatch[1]}&modestbranding=1&playsinline=1`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  }
  return null;
}

export default function MobileExerciseHero({ exercise, isTransitioning }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mediaUrl = exercise.video.videoUrl || exercise.video.thumbnailUrl;
  const thumbnailUrl = exercise.video.thumbnailUrl;
  const isVideo = isVideoUrl(mediaUrl);
  const isGif = isGifUrl(mediaUrl);
  const isEmbed = isYouTubeOrVimeo(mediaUrl);

  // Reset on exercise change
  useEffect(() => {
    setMediaLoaded(false);
    setIsPlaying(true);
  }, [exercise.id]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    showControlsBriefly();
  }

  function showControlsBriefly() {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
  }

  return (
    <div
      className="relative h-fit w-full bg-muted overflow-hidden transition-opacity duration-300"
      style={{
        aspectRatio: '4 / 4',
        opacity: isTransitioning ? 0 : 1,
      }}
    >
      {/* Loading skeleton */}
      {!mediaLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <Dumbbell size={40} className="text-muted-foreground/40" />
        </div>
      )}

      {/* Media rendering */}
      {mediaUrl ? (
        <>
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              poster={thumbnailUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setMediaLoaded(true)}
              onClick={togglePlay}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : isEmbed ? (
            <iframe
              src={getYouTubeEmbedUrl(mediaUrl) || mediaUrl}
              title={exercise.video.title}
              onLoad={() => setMediaLoaded(true)}
              allow="autoplay; encrypted-media; picture-in-picture"
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          ) : isGif ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={exercise.video.title}
              onLoad={() => setMediaLoaded(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={mediaUrl}
              alt={exercise.video.title}
              fill
              sizes="100vw"
              priority
              onLoad={() => setMediaLoaded(true)}
              className="object-cover"
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell size={48} className="text-muted-foreground/40" />
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-background to-transparent" />

      {/* Play/Pause control (only for direct video) */}
      {isVideo && showControls && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-200"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            {isPlaying ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-1" />}
          </div>
        </button>
      )}
    </div>
  );
}
