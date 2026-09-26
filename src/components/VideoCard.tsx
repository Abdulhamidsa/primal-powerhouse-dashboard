'use client';


import { CheckIcon, EyeIcon, PlayIcon, VideoCameraIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { Video } from '@/types/video';
import { DIFFICULTY_LEVELS, VIDEO_CATEGORIES } from '@/types/video';

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onSelectAction: () => void;
  onClickAction: () => void;
  formatDurationAction: (minutes: number) => string;
}

export default function VideoCard({
  video,
  isSelected,
  onSelectAction,
  onClickAction,
  formatDurationAction,
}: VideoCardProps) {
  const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === video.difficulty);
  const categoryConfig = VIDEO_CATEGORIES.find(c => c.value === video.category);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.select-checkbox')) {
      return; // Don't trigger card click if checkbox was clicked
    }
    onClickAction();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectAction();
  };

  return (
    <div
      className={`group relative bg-zinc-900 rounded-2xl shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${isSelected ? 'ring-2 ring-blue-500 shadow-xl bg-blue-900/30' : 'hover:shadow-lg'}`}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      <div className="select-checkbox absolute top-3 left-3 z-10" onClick={handleCheckboxClick}>
        <div
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all backdrop-blur-sm ${isSelected ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-zinc-800/90 border-zinc-600 group-hover:border-blue-500 group-hover:bg-blue-900/20'}`}
        >
          {isSelected && (
            <CheckIcon className="w-4 h-4 text-white" weight="fill" aria-hidden="true" focusable="false" />
          )}
        </div>
      </div>

      {/* Video Thumbnail */}
      <div className="relative w-full h-48 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 rounded-t-2xl overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-purple-900/30">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <VideoCameraIcon className="w-8 h-8 text-white" aria-hidden="true" focusable="false" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Training Video</span>
            </div>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
          <div className="bg-zinc-900/95 backdrop-blur-sm rounded-full p-4 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg">
            <PlayIcon className="w-8 h-8 text-blue-600 ml-1" weight="fill" aria-hidden="true" focusable="false" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
          {formatDurationAction(video.duration)}
        </div>

        {/* View Count */}
        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <EyeIcon className="w-3 h-3" weight="fill" aria-hidden="true" focusable="false" />
          {video.viewCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-zinc-100 mb-2 line-clamp-2 leading-tight text-lg">{video.title}</h3>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-zinc-400 mb-3 line-clamp-2 leading-relaxed">{video.description}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between mb-4">
          {/* Category */}
          <span className="text-xs bg-gradient-to-r from-blue-900/50 to-purple-900/50 text-blue-300 px-3 py-1.5 rounded-full font-medium">
            {categoryConfig?.label || video.category}
          </span>

          {/* Difficulty */}
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${difficultyConfig?.color?.replace('bg-gray-100 text-gray-800', 'bg-zinc-800 text-zinc-200') || 'bg-zinc-800 text-zinc-200'}`}
          >
            {difficultyConfig?.label || video.difficulty}
          </span>
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs text-zinc-500 font-medium">+{video.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Muscle Groups */}
        {video.muscleGroups && video.muscleGroups.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <VideoCameraIcon className="w-4 h-4 text-purple-500" weight="fill" aria-hidden="true" focusable="false" />
            <span className="truncate font-medium">
              {video.muscleGroups.slice(0, 2).join(', ')}
              {video.muscleGroups.length > 2 && ' +more'}
            </span>
          </div>
        )}
      </div>

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-2xl pointer-events-none" />
    </div>
  );
}
