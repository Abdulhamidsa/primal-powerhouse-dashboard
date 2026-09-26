'use client';



import { TargetIcon } from '@phosphor-icons/react';
import { CalendarIcon, ClockIcon, LightningIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { useUserTraining } from '@/features/training/hooks/useUserTraining';

export default function UserVideosPage() {
  const { assignments: videoAssignments, isLoading: loading } = useUserTraining();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredAssignments = videoAssignments.filter(assignment => {
    if (filter === 'completed') return assignment.isCompleted;
    if (filter === 'pending') return !assignment.isCompleted;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const completedCount = videoAssignments.filter(a => a.isCompleted).length;
  const totalCount = videoAssignments.length;

  return (
    <div className="px-4 pb-8 space-y-6">
      <PageHeader title="Training Videos" description="Your personalized workout video assignments" />

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Total Videos</h3>
          <p className="text-2xl font-bold text-primary">{totalCount}</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Progress</h3>
          <p className="text-2xl font-bold text-primary">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending ({totalCount - completedCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Video List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <div className="text-4xl mb-4"><TargetIcon className="h-[1em] w-[1em]" aria-hidden="true" /></div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {filter === 'all'
              ? 'No videos assigned yet'
              : filter === 'completed'
                ? 'No completed videos'
                : 'No pending videos'}
          </h3>
          <p className="text-muted-foreground">
            {filter === 'all'
              ? 'Your coach will assign training videos soon.'
              : filter === 'completed'
                ? 'Complete some videos to see them here.'
                : 'Great job! All videos are completed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              {isImageDemo(assignment.video.videoUrl) && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-black/20 relative w-full h-56">
                  <Image
                    src={assignment.video.videoUrl}
                    alt={assignment.video.title}
                    fill
                    className="object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-1">{assignment.video.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{assignment.video.description}</p>
                </div>
                <div
                  className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {assignment.isCompleted ? 'Completed' : 'Pending'}
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" aria-hidden="true" focusable="false" />
                  {assignment.video.duration} min
                </span>
                <span className="flex items-center">
                  <LightningIcon className="w-4 h-4 mr-1" aria-hidden="true" focusable="false" />
                  {assignment.video.difficulty}
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" aria-hidden="true" focusable="false" />
                  {new Date(assignment.assignedDate).toLocaleDateString()}
                </span>
              </div>

              {assignment.video.tags && assignment.video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {assignment.video.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex space-x-3">
                <Link
                  href={`/user/videos/${assignment.id}`}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-center hover:bg-primary/90 transition-colors"
                >
                  {isImageDemo(assignment.video.videoUrl) ? 'Open Exercise Page' : 'Open Video Page'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isImageDemo(url: string): boolean {
  return /\.(gif|webp|png|jpg|jpeg)$/i.test(url);
}
