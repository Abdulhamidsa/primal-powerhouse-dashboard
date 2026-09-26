'use client';


import { PlusIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Video } from '@/types/video';
import NewAddVideoModal from '@/components/NewAddVideoModal';
// import VideoCard from '@/components/VideoCard';
import NewVideoDetailModal from '@/components/NewVideoDetailModal';
// import VideoFilters from '@/components/VideoFilters';
import AssignVideosModal from '@/components/AssignVideosModal';
import ExerciseDbLibraryPanel from '@/features/exercises/components/ExerciseDbLibraryPanel';
import type { ExerciseDbExercise } from '@/features/exercises/types/exerciseDb.types';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  // const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigningExercise, setIsAssigningExercise] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'exercises' | 'videos'>('exercises');
  // const [filters] = useState({
  //   category: 'all' as VideoCategory | 'all',
  //   difficulty: 'all' as DifficultyLevel | 'all',
  //   search: '',
  // });

  // const fetchVideos = async () => {
  //   try {
  //     setLoading(true);
  //     const params = new URLSearchParams();
  //     if (filters.category !== 'all') params.append('category', filters.category);
  //     if (filters.difficulty !== 'all') params.append('difficulty', filters.difficulty);

  //     const response = await fetch(`/api/videos?${params}`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setVideos(data);
  //     } else {
  //       console.error('Failed to fetch videos');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching videos:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchVideos();
  // });

  const handleAddVideo = (video: Video) => {
    setVideos([video, ...videos]);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVideos(videos.filter(v => v.id !== videoId));
        setIsDetailModalOpen(false);
      } else {
        console.error('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  // const handleVideoSelect = (video: Video) => {
  //   if (selectedVideos.find(v => v.id === video.id)) {
  //     setSelectedVideos(selectedVideos.filter(v => v.id !== video.id));
  //   } else {
  //     setSelectedVideos([...selectedVideos, video]);
  //   }
  // };

  const handleBulkAssign = () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least one video to assign');
      return;
    }
    setIsAssignModalOpen(true);
  };

  const handleAssignExercise = async (exercise: ExerciseDbExercise) => {
    try {
      setIsAssigningExercise(exercise.exerciseId);

      const response = await fetch('/api/videos/import-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exercise),
      });

      if (!response.ok) {
        throw new Error('Failed to import exercise for assignment');
      }

      const importedVideo: Video = await response.json();
      setSelectedVideos([importedVideo]);
      setIsAssignModalOpen(true);
    } catch (error) {
      console.error('Error assigning exercise:', error);
      alert('Could not assign this exercise. Please try again.');
    } finally {
      setIsAssigningExercise(null);
    }
  };

  // const filteredVideos = videos.filter(
  //   video =>
  //     video.title.toLowerCase().includes(filters.search.toLowerCase()) ||
  //     video.description?.toLowerCase().includes(filters.search.toLowerCase())
  // );

  // const formatDuration = (seconds: number) => {
  //   const minutes = Math.floor(seconds / 60);
  //   if (minutes < 60) return `${minutes}min`;
  //   const hours = Math.floor(seconds / 3600);
  //   const remainingMinutes = Math.floor((seconds % 3600) / 60);
  //   return `${hours}h ${remainingMinutes}min`;
  // };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Video Library
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Build your training video collection and assign them to clients
            </p>
          </div>

          <div className="flex gap-3 mt-4 sm:mt-0">
            {selectedVideos.length > 0 && (
              <button
                onClick={handleBulkAssign}
                className="px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-colors font-medium"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
              >
                <PlusIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
                Assign ({selectedVideos.length})
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-colors font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
            >
              <PlusIcon className="w-5 h-5" aria-hidden="true" focusable="false" />
              Add Video
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3">
          {/* <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              activeTab === 'videos'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            My Videos
          </button> */}
          <button
            type="button"
            onClick={() => setActiveTab('exercises')}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              activeTab === 'exercises'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            ExerciseDB
          </button>
        </div>

        {/* {activeTab === 'videos' && (
          <VideoFilters filters={filters} onFiltersChange={setFilters} videosCount={filteredVideos.length} />
        )} */}

        {/* Videos Grid */}
        {/* {activeTab === 'videos' && (loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-bg-alt)' }}
            >
              <VideoCameraIcon className="w-12 h-12" aria-hidden="true" focusable="false" />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              No videos found
            </h3>
            <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {filters.search || filters.category !== 'all' || filters.difficulty !== 'all'
                ? "Try adjusting your filters to find what you're looking for"
                : 'Start building your video library by adding your first training video'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-colors font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
            >
              Add Your First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                isSelected={selectedVideos.some(v => v.id === video.id)}
                onSelectAction={() => handleVideoSelect(video)}
                onClickAction={() => {
                  setSelectedVideo(video);
                  setIsDetailModalOpen(true);
                }}
                formatDurationAction={formatDuration}
              />
            ))}
          </div>
        ))} */}

        {activeTab === 'exercises' && (
          <ExerciseDbLibraryPanel
            onAssignExerciseAction={handleAssignExercise}
            assigningExerciseId={isAssigningExercise}
          />
        )}

        {/* Modals */}
        {activeTab === 'videos' && (
          <NewAddVideoModal
            isOpen={isAddModalOpen}
            onCloseAction={() => setIsAddModalOpen(false)}
            onVideoAddedAction={handleAddVideo}
          />
        )}

        {activeTab === 'videos' && selectedVideo && (
          <NewVideoDetailModal
            video={selectedVideo}
            isOpen={isDetailModalOpen}
            onCloseAction={() => {
              setIsDetailModalOpen(false);
              setSelectedVideo(null);
            }}
            onDeleteAction={handleDeleteVideo}
            onAssignAction={(video: Video) => {
              setSelectedVideos([video]);
              setIsAssignModalOpen(true);
              setIsDetailModalOpen(false);
            }}
          />
        )}

        <AssignVideosModal
          selectedVideos={selectedVideos}
          isOpen={isAssignModalOpen}
          onCloseAction={() => {
            setIsAssignModalOpen(false);
            setSelectedVideos([]);
          }}
          onAssignAction={assignments => {
            setSelectedVideos([]);
            setIsAssignModalOpen(false);
            alert(`Successfully assigned ${assignments.length} video assignments to clients!`);
          }}
        />
      </div>
    </div>
  );
}
