'use client';

import { Video } from '@/types/video';
import { DIFFICULTY_LEVELS, VIDEO_CATEGORIES } from '@/types/video';

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  formatDuration: (minutes: number) => string;
}

export default function VideoCard({
  video,
  isSelected,
  onSelect,
  onClick,
  formatDuration,
}: VideoCardProps) {
  const difficultyConfig = DIFFICULTY_LEVELS.find(d => d.value === video.difficulty);
  const categoryConfig = VIDEO_CATEGORIES.find(c => c.value === video.category);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.select-checkbox')) {
      return; // Don't trigger card click if checkbox was clicked
    }
    onClick();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
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
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Video Thumbnail */}
      <div className="relative w-full h-48 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 rounded-t-2xl overflow-hidden">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-purple-900/30">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-sm text-gray-500 font-medium">Training Video</span>
            </div>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
          <div className="bg-zinc-900/95 backdrop-blur-sm rounded-full p-4 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg">
            <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l7-5z" />
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* View Count */}
        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          {video.viewCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-zinc-100 mb-2 line-clamp-2 leading-tight text-lg">
          {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
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
              <span className="text-xs text-zinc-500 font-medium">
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Muscle Groups */}
        {video.muscleGroups && video.muscleGroups.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489A2 2 0 0111.85 18H8.15a2 2 0 01-1.051-1.511L7.22 15H5a2 2 0 01-2-2V5zm5.771 4.757a.75.75 0 101.498-.104L9.75 7.5A.75.75 0 101 8l.479 2.757z"
                clipRule="evenodd"
              />
            </svg>
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
