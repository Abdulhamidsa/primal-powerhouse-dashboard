'use client';

import { useState, useEffect } from 'react';
import { Video, VideoCategory, DifficultyLevel, VideoFormData } from '@/types/video';
import NewAddVideoModal from '@/components/NewAddVideoModal';
import VideoCard from '@/components/VideoCard';
import NewVideoDetailModal from '@/components/NewVideoDetailModal';
import VideoFilters from '@/components/VideoFilters';
import AssignVideosModal from '@/components/AssignVideosModal';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [filters, setFilters] = useState({
    category: 'all' as VideoCategory | 'all',
    difficulty: 'all' as DifficultyLevel | 'all',
    search: '',
  });

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.difficulty !== 'all') params.append('difficulty', filters.difficulty);

      const response = await fetch(`/api/videos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      } else {
        console.error('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filters.category, filters.difficulty]);

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

  const handleVideoSelect = (video: Video) => {
    if (selectedVideos.find(v => v.id === video.id)) {
      setSelectedVideos(selectedVideos.filter(v => v.id !== video.id));
    } else {
      setSelectedVideos([...selectedVideos, video]);
    }
  };

  const handleBulkAssign = () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least one video to assign');
      return;
    }
    setIsAssignModalOpen(true);
  };

  const filteredVideos = videos.filter(
    video =>
      video.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      video.description?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Assign ({selectedVideos.length})
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-colors font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Video
            </button>
          </div>
        </div>

        {/* Filters */}
        <VideoFilters filters={filters} onFiltersChange={setFilters} videosCount={filteredVideos.length} />

        {/* Videos Grid */}
        {loading ? (
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
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--color-accent)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
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
                onSelect={() => handleVideoSelect(video)}
                onClick={() => {
                  setSelectedVideo(video);
                  setIsDetailModalOpen(true);
                }}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <NewAddVideoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onVideoAdded={handleAddVideo}
        />

        {selectedVideo && (
          <NewVideoDetailModal
            video={selectedVideo}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedVideo(null);
            }}
            onDelete={handleDeleteVideo}
            onAssign={(video: Video) => {
              setSelectedVideos([video]);
              setIsAssignModalOpen(true);
              setIsDetailModalOpen(false);
            }}
          />
        )}

        <AssignVideosModal
          selectedVideos={selectedVideos}
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedVideos([]);
          }}
          onAssign={assignments => {
            setSelectedVideos([]);
            setIsAssignModalOpen(false);
            alert(`Successfully assigned ${assignments.length} video assignments to clients!`);
          }}
        />
      </div>
    </div>
  );
}
