'use client';

import { VideoCameraIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUserTraining } from '@/features/training/hooks/useUserTraining';

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
    <div className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-border bg-card/60 p-1">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'shrink-0 px-3 py-1.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
              active ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
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
      <div className="relative h-20 w-28 sm:h-24 sm:w-32 overflow-hidden rounded-2xl border border-border bg-muted">
        <Image src={src} alt={alt} fill sizes="128px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="h-20 w-28 sm:h-24 sm:w-32 overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center">
      <VideoCameraIcon className="opacity-60" size="28" aria-hidden="true" focusable="false" />
    </div>
  );
}

export function UserTrainingAssignments({ showHeader = true }: { showHeader?: boolean }) {
  const { selectedTag, setSelectedTag, filteredAssignments, allTags, coachInfo, isLoading, error } = useUserTraining();

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-3xl border border-border/70 bg-card/80" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">Failed to load training: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Training Videos</h2>
            <p className="text-sm text-muted-foreground">
              Your plan, clean and simple{coachInfo?.name ? ` • Coach: ${coachInfo.name}` : ''}.
            </p>
          </div>

          {allTags.length > 0 ? (
            <div className="sm:shrink-0">
              <Segmented
                value={selectedTag}
                onChange={setSelectedTag}
                options={[{ label: 'All', value: 'all' }, ...allTags.slice(0, 8).map(t => ({ label: t, value: t }))]}
              />
            </div>
          ) : null}
        </div>
      ) : allTags.length > 0 ? (
        <div>
          <Segmented
            value={selectedTag}
            onChange={setSelectedTag}
            options={[{ label: 'All', value: 'all' }, ...allTags.slice(0, 8).map(t => ({ label: t, value: t }))]}
          />
        </div>
      ) : null}

      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
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
                  'rounded-3xl border border-border bg-card/60 p-4',
                  'transition-all hover:shadow-md hover:border-border/70',
                ].join(' ')}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/user/videos/${assignment.id}`}
                    className="shrink-0 self-start"
                    aria-label={`Open ${assignment.video.title}`}
                  >
                    <Thumb
                      src={assignment.video.thumbnailUrl || assignment.video.videoUrl}
                      alt={assignment.video.title}
                    />
                  </Link>

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

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-background/60 border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        {formatDuration(assignment.video.duration)}
                      </span>
                      <span className="rounded-full bg-background/60 border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        {assignment.video.difficulty}
                      </span>

                      {Array.isArray(assignment.video.tags) && assignment.video.tags.length > 0 ? (
                        <span className="rounded-full bg-background/60 border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {assignment.video.tags[0]}
                          {assignment.video.tags.length > 1 ? ` +${assignment.video.tags.length - 1}` : ''}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <Link
                        href={`/user/videos/${assignment.id}`}
                        className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors text-center"
                      >
                        Show full page
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
