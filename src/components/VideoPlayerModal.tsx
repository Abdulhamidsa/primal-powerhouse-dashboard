'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    title: string;
    description: string;
    videoUrl: string;
    duration: number;
    difficulty: string;
  };
  onComplete?: () => void;
}

export default function VideoPlayerModal({ isOpen, onClose, video, onComplete }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle different video URL formats
  const getVideoSource = (url: string) => {
    // YouTube URLs
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtu.be/')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }

    // Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&controls=1&title=0&byline=0&portrait=0`,
        thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      };
    }

    // Direct video files or other URLs
    return {
      type: 'direct',
      embedUrl: url,
      thumbnailUrl: null,
    };
  };

  const videoSource = getVideoSource(video.videoUrl);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setVideoError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) onComplete();
    };
    const handleError = () => setVideoError(true);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      video.play();
      setIsPlaying(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="relative w-full max-w-6xl mx-4 bg-black rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Header */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-semibold">{video.title}</h2>
              <p className="text-gray-300 text-sm">
                {video.difficulty} • {video.duration} min
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {videoSource.type === 'direct' ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={video.videoUrl}
              onError={() => setVideoError(true)}
            />
          ) : (
            <iframe
              className="w-full h-full border-0"
              src={videoSource.embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={video.title}
            />
          )}

          {/* Error State */}
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold mb-2">Video Unavailable</h3>
                <p className="text-gray-300 mb-4">This video cannot be played at the moment.</p>
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          )}

          {/* Play Button Overlay */}
          {!isPlaying && !videoError && videoSource.type === 'direct' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={togglePlay} className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-colors">
                <Play size={48} className="text-white ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* External Link Fallback for YouTube/Vimeo */}
        {(videoSource.type === 'youtube' || videoSource.type === 'vimeo') && (
          <div
            className={`absolute bottom-4 right-4 flex space-x-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            {onComplete && (
              <button
                onClick={onComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                ✓ Mark Complete
              </button>
            )}
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Open in {videoSource.type === 'youtube' ? 'YouTube' : 'Vimeo'}
            </a>
          </div>
        )}

        {/* Controls - Only for direct videos */}
        {videoSource.type === 'direct' && !videoError && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-white text-sm mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={restart} className="text-white hover:text-gray-300 transition-colors">
                  <RotateCcw size={20} />
                </button>
                <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {onComplete && currentTime > 0 && (
                  <button
                    onClick={onComplete}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black/90 p-4 transform transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <p className="text-gray-300 text-sm">{video.description}</p>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
