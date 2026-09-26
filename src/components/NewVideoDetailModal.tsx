'use client';


import { BarbellIcon, CircleNotchIcon, MedalIcon, PencilSimpleIcon, PlayIcon, PulseIcon, TagIcon, TrashIcon, UserIcon } from '@phosphor-icons/react';
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
        return <BarbellIcon className="h-5 w-5" aria-hidden="true" />;
      case 'CARDIO':
        return (
          <PulseIcon className="h-5 w-5" aria-hidden="true" focusable="false" />
        );
      case 'MOBILITY':
      case 'YOGA':
      case 'PILATES':
        return (
          <UserIcon className="h-5 w-5" aria-hidden="true" focusable="false" />
        );
      default:
        return <PlayIcon className="h-5 w-5" aria-hidden="true" />;
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
              <PlayIcon className="mb-4 h-16 w-16 opacity-50" aria-hidden="true" />
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
                <Clock aria-hidden="true" focusable="false" className="w-4 h-4" />
                <span>{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MedalIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
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
                  <PulseIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
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
                    <Clock aria-hidden="true" focusable="false" className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
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
                    <TagIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
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
                  <UserIcon className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Assign
                </button>
              )}

              {onEditAction && (
                <button
                  onClick={() => onEditAction(video)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                >
                  <PencilSimpleIcon className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Edit
                </button>
              )}

              {onDeleteAction && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" focusable="false" />
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
                  <TrashIcon className="w-6 h-6" aria-hidden="true" focusable="false" />
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
                        <CircleNotchIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
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
