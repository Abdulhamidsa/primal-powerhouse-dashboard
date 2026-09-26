'use client';


import { BarbellIcon, ChartBarIcon, CircleNotchIcon, ClipboardTextIcon, FileTextIcon, FirstAidIcon, FlameIcon, FlaskIcon, LightbulbIcon, LightningIcon, PencilSimpleIcon, PersonSimpleIcon, PersonSimpleRunIcon, PersonSimpleTaiChiIcon, PlusIcon, SnowflakeIcon, SoccerBallIcon, SunHorizonIcon, TagIcon, TargetIcon, TrashIcon, UserIcon, VideoCameraIcon, XIcon } from '@phosphor-icons/react';
import { Video } from '@/types/video';
import { useState } from 'react';

interface VideoDetailModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  video: Video | null;
  onEdit?: (video: Video) => void;
  onDelete?: (videoId: string) => void;
  onAssign?: (video: Video) => void;
}

export default function VideoDetailModal({
  isOpen,
  onCloseAction,
  video,
  onEdit,
  onDelete,
  onAssign,
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
    const hours = Math.floor(minutes / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-orange-100 text-orange-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'STRENGTH_TRAINING':
        return <BarbellIcon size={18} aria-hidden="true" />;
      case 'CARDIO':
        return <PersonSimpleRunIcon size={18} aria-hidden="true" />;
      case 'MOBILITY':
        return <PersonSimpleIcon size={18} aria-hidden="true" />;
      case 'YOGA':
        return <PersonSimpleTaiChiIcon size={18} aria-hidden="true" />;
      case 'PILATES':
        return <PersonSimpleIcon size={18} aria-hidden="true" />;
      case 'WARM_UP':
        return <SunHorizonIcon size={18} aria-hidden="true" />;
      case 'COOL_DOWN':
        return <SnowflakeIcon size={18} aria-hidden="true" />;
      case 'FUNCTIONAL':
        return <LightningIcon size={18} aria-hidden="true" />;
      case 'REHABILITATION':
        return <FirstAidIcon size={18} aria-hidden="true" />;
      case 'SPORTS_SPECIFIC':
        return <SoccerBallIcon size={18} aria-hidden="true" />;
      default:
        return <TargetIcon size={18} aria-hidden="true" />;
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(video.id);
      setShowDeleteConfirm(false);
      onCloseAction();
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  {getCategoryIcon(video.category)} {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
                </span>
                <span className="text-blue-200">•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)} bg-white/20 text-white`}
                >
                   {video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
                </span>
                <span className="text-blue-200">•</span>
                <span className="flex items-center gap-1">⏱️ {formatDuration(video.duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onAssign && (
                <button
                  onClick={() => {
                    if (onAssign) onAssign(video);
                  }}
                  className="flex items-center gap-1 text-white/90 hover:text-white bg-green-500/30 hover:bg-green-500/50 rounded-xl px-3 py-2 transition-all"
                  title="Assign to Clients"
                >
                  <PlusIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
                  <span className="font-medium text-sm">Assign</span>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(video)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                  title="Edit Video"
                >
                  <PencilSimpleIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-white/80 hover:text-white hover:bg-red-500/30 rounded-xl p-2 transition-all"
                  title="Delete Video"
                >
                  <TrashIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
                </button>
              )}
              <button
                onClick={onCloseAction}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
              >
                <XIcon className="w-6 h-6" aria-hidden="true" focusable="false" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="xl:col-span-2">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
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
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <VideoCameraIcon className="w-16 h-16 mb-4 opacity-50" aria-hidden="true" focusable="false" />
                    <p className="text-lg font-medium opacity-75">Video format not supported</p>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                    >
                      Open Original Link
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5 text-blue-500" aria-hidden="true" focusable="false" />
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{video.description}</p>
              </div>

              {/* Instructions */}
              {video.instructions && video.instructions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ClipboardTextIcon className="w-5 h-5 text-green-500" aria-hidden="true" focusable="false" />
                    Instructions
                  </h3>
                  <div className="space-y-3">
                    {video.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3 bg-green-50 rounded-xl p-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {video.tips && video.tips.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <LightbulbIcon className="w-5 h-5 text-yellow-500" aria-hidden="true" focusable="false" />
                    Tips & Form Cues
                  </h3>
                  <div className="space-y-3">
                    {video.tips.map((tip, index) => (
                      <div key={index} className="flex gap-3 bg-yellow-50 rounded-xl p-4">
                        <div className="flex-shrink-0">
                          <LightbulbIcon className="w-5 h-5 text-yellow-500 mt-0.5" aria-hidden="true" focusable="false" />
                        </div>
                        <p className="text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Video Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-blue-500" aria-hidden="true" focusable="false" />
                  Video Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-800">{formatDuration(video.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold text-gray-800">
                      {getCategoryIcon(video.category)}{' '}
                      {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Difficulty</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}
                    >
                       {video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              {video.equipment && video.equipment.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FlaskIcon className="w-5 h-5 text-green-500" aria-hidden="true" focusable="false" />
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.equipment.map((item, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                         {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Muscle Groups */}
              {video.muscleGroups && video.muscleGroups.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-purple-500" aria-hidden="true" focusable="false" />
                    Muscle Groups Targeted
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.muscleGroups.map((muscle, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                         {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-orange-500" aria-hidden="true" focusable="false" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                         {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-3xl">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-6 h-6 text-red-600" aria-hidden="true" focusable="false" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Video</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete &quot;{video.title}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
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
      </div>
    </div>
  );
}
