'use client';

import { Video } from '@/types/video';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ClockIcon as Clock } from '@phosphor-icons/react';

interface VideoDetailModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  video: Video | null;
  onEditAction?: (video: Video) => void;
  onDeleteAction?: (videoId: string) => void;
  onAssignAction?: (video: Video) => void;
}

export default function NewVideoDetailModal({
  isOpen,
  onCloseAction,
  video,
  onEditAction,
  onDeleteAction,
  onAssignAction,
}: VideoDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'STRENGTH_TRAINING':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M6 7v10"></path>
            <path d="M18 7v10"></path>
            <path d="M2 17h20"></path>
            <path d="M2 7h20"></path>
            <path d="M6 7H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"></path>
            <path d="M18 7h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2"></path>
          </svg>
        );
      case 'CARDIO':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        );
      case 'MOBILITY':
      case 'YOGA':
      case 'PILATES':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        );
    }
  };

  const handleDelete = async () => {
    if (!onDeleteAction) return;

    setIsDeleting(true);
    try {
      await onDeleteAction(video.id);
      setShowDeleteConfirm(false);
      onCloseAction();
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Video Player */}
        <div className="w-full aspect-video bg-black relative">
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
            <div
              className="flex flex-col items-center justify-center h-full"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-16 h-16 mb-4 opacity-50"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <p className="text-lg font-medium opacity-75">Video format not supported</p>
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
              >
                Open Original Link
              </a>
            </div>
          )}

          {/* Video badge */}
          <div
            className="absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2"
            style={{
              background: 'var(--color-accent-muted)',
              color: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            {getCategoryIcon(video.category)} {video.category.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="p-6">
          <div>
            <DialogTitle className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              {video.title}
            </DialogTitle>
            <div style={{ color: 'var(--color-text-muted)' }}>Video details</div>
            <div
              className="flex flex-wrap items-center gap-4 text-sm mt-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="8" r="6"></circle>
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                </svg>
                <span>{video.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="mb-6">
                <h3
                  className="text-lg font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Description
                </h3>
                <p
                  className="rounded-lg p-4"
                  style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
                >
                  {video.description}
                </p>
              </div>

              {/* Instructions */}
              {video.instructions && video.instructions.length > 0 && (
                <div className="mb-6">
                  <h3
                    className="text-lg font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <Clock className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    Instructions
                  </h3>
                  <ol className="space-y-3">
                    {video.instructions.map((instruction, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg"
                        style={{ background: 'var(--color-bg-alt)' }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                          style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                        >
                          {index + 1}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tips */}
              {video.tips && video.tips.length > 0 && (
                <div>
                  <h3
                    className="text-lg font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    Form Tips
                  </h3>
                  <div className="space-y-3">
                    {video.tips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg"
                        style={{ background: 'var(--color-bg-alt)' }}
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5"
                          style={{
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {index + 1}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Video info card */}
              <div
                className="rounded-xl p-5 border"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Video Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--color-text-muted)' }}>Duration</span>
                    <span style={{ color: 'var(--color-text)' }}>{formatDuration(video.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--color-text-muted)' }}>Category</span>
                    <span style={{ color: 'var(--color-text)' }}>{video.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--color-text-muted)' }}>Difficulty</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'var(--color-accent-muted)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {video.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--color-text-muted)' }}>Created</span>
                    <span style={{ color: 'var(--color-text)' }}>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              {video.equipment && video.equipment.length > 0 && (
                <div
                  className="rounded-xl p-5 border"
                  style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.equipment.map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium border"
                        style={{
                          background: 'var(--color-accent-muted)',
                          color: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Muscle Groups */}
              {video.muscleGroups && video.muscleGroups.length > 0 && (
                <div
                  className="rounded-xl p-5 border"
                  style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Muscle Groups
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.muscleGroups.map((muscle, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium border"
                        style={{
                          background: 'var(--color-accent-muted)',
                          color: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                        }}
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div
                  className="rounded-xl p-5 border"
                  style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium border"
                        style={{
                          background: 'var(--color-accent-muted)',
                          color: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              ID: {video.id.slice(0, 8)}...
            </div>
            <div className="flex gap-2">
              {onAssignAction && (
                <button
                  onClick={() => onAssignAction(video)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Assign
                </button>
              )}

              {onEditAction && (
                <button
                  onClick={() => onEditAction(video)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  Edit
                </button>
              )}

              {onDeleteAction && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          >
            <div className="rounded-xl p-6 max-w-md w-full" style={{ background: 'var(--color-surface)' }}>
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--color-accent-muted)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Delete Video
                </h3>
                <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                  Are you sure you want to delete &ldquo;{video.title}&rdquo;? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border rounded-lg transition-all"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                  >
                    {isDeleting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
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
      </DialogContent>
    </Dialog>
  );
}
