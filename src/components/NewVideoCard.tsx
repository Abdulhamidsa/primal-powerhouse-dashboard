'use client';

import { Video } from '@/types/video';
import { DIFFICULTY_LEVELS, VIDEO_CATEGORIES } from '@/types/video';
import {
  CheckSquareIcon as CheckSquare,
  SquareIcon as Square,
  PlayIcon as Play,
  EyeIcon as Eye,
  TagIcon as Tag,
  ClockIcon as Clock,
  PulseIcon as Activity,
} from '@phosphor-icons/react';
import Image from 'next/image';

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  formatDuration: (minutes: number) => string;
}

export default function NewVideoCard({ video, isSelected, onSelect, onClick, formatDuration }: VideoCardProps) {
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
      className="relative rounded-xl shadow-sm border overflow-hidden cursor-pointer transition-all hover:shadow-md group"
      style={{
        background: 'var(--color-surface)',
        borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
        borderWidth: isSelected ? '2px' : '1px',
      }}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      <div className="select-checkbox absolute top-3 left-3 z-10" onClick={handleCheckboxClick}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center">
          {isSelected ? (
            <CheckSquare
              aria-hidden="true"
              focusable="false"
              className="w-5 h-5"
              style={{ color: 'var(--color-accent)' }}
            />
          ) : (
            <Square
              aria-hidden="true"
              focusable="false"
              className="w-5 h-5"
              style={{ color: 'var(--color-text-muted)' }}
            />
          )}
        </div>
      </div>

      {/* Video Thumbnail */}
      <div className="relative w-full h-48 overflow-hidden" style={{ background: 'var(--color-bg-alt)' }}>
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            width={500}
            height={300}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play aria-hidden="true" focusable="false" className="w-12 h-12" style={{ color: 'var(--color-accent)' }} />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
          <div
            className="rounded-full p-4 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"
            style={{ background: 'var(--color-surface)', backdropFilter: 'blur(4px)' }}
          >
            <Play aria-hidden="true" focusable="false" className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
          </div>
        </div>

        {/* Duration Badge */}
        <div
          className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', color: 'white' }}
        >
          <Clock aria-hidden="true" focusable="false" className="w-3 h-3 inline mr-1" />
          {formatDuration(video.duration)}
        </div>

        {/* View Count */}
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs flex items-center gap-1"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', color: 'white' }}
        >
          <Eye aria-hidden="true" focusable="false" className="w-3 h-3" />
          {video.viewCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold mb-2 line-clamp-2 leading-tight text-lg" style={{ color: 'var(--color-text)' }}>
          {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p className="text-sm mb-3 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {video.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between mb-4">
          {/* Category */}
          <span
            className="text-xs px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--color-accent-muted)',
              color: 'var(--color-accent)',
            }}
          >
            {categoryConfig?.label || video.category}
          </span>

          {/* Difficulty */}
          <span
            className="text-xs px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text)',
            }}
          >
            {difficultyConfig?.label || video.difficulty}
          </span>
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-md flex items-center gap-1"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Tag aria-hidden="true" focusable="false" className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span
                className="text-xs px-2 py-1 rounded-md"
                style={{
                  color: 'var(--color-text-muted)',
                }}
              >
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Muscle Groups */}
        {video.muscleGroups && video.muscleGroups.length > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Activity
              aria-hidden="true"
              focusable="false"
              className="w-4 h-4"
              style={{ color: 'var(--color-accent)' }}
            />
            <span>
              {video.muscleGroups.slice(0, 2).join(', ')}
              {video.muscleGroups.length > 2 && ' +more'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
