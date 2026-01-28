'use client';

import { Video } from '@/types/video';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Client {
  id: string;
  name: string; // The client has 'name' instead of firstName/lastName
  email: string;
  avatar?: string; // The client has 'avatar' instead of profilePicture
}

interface AssignVideosModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  selectedVideos: Video[];
  onAssignAction: (assignments: VideoAssignment[]) => void;
}

interface VideoAssignment {
  clientId: string;
  videoId: string;
  dueDate?: Date;
  notes?: string;
}

export default function AssignVideosModal({
  isOpen,
  onCloseAction,
  selectedVideos,
  onAssignAction,
}: AssignVideosModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    } else {
      // Reset form when modal closes
      setSelectedClients([]);
      setDueDate('');
      setNotes('');
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      } else {
        console.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(
    client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => (prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]));
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  const getTotalDuration = (): number => {
    return selectedVideos.reduce((total, video) => total + video.duration, 0);
  };

  const handleSubmit = async () => {
    if (selectedClients.length === 0) return;

    setIsSubmitting(true);
    try {
      const assignments: VideoAssignment[] = [];

      for (const clientId of selectedClients) {
        for (const video of selectedVideos) {
          assignments.push({
            clientId,
            videoId: video.id,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            notes: notes.trim() || undefined,
          });
        }
      }

      const response = await fetch('/api/video-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });

      if (response.ok) {
        onAssignAction(assignments);
        onCloseAction();
      } else {
        console.error('Failed to assign videos');
      }
    } catch (error) {
      console.error('Error assigning videos:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assign Videos to Clients</h2>
              <p className="text-purple-100 mt-1">
                {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected •{' '}
                {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={onCloseAction}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selected Videos Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Videos to Assign ({selectedVideos.length})
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {selectedVideos.map(video => (
                    <div key={video.id} className="flex gap-3 bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex-shrink-0">
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            width={64}
                            height={48}
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-2-9a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{video.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>{formatDuration(video.duration)}</span>
                          <span>•</span>
                          <span className="capitalize">{video.category}</span>
                          <span>•</span>
                          <span className="capitalize">{video.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Total Duration:</span>
                    <span className="font-semibold text-purple-600">{formatDuration(getTotalDuration())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                Select Clients
              </h3>

              {/* Client Search */}
              <div className="relative mb-4">
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={selectedClients.length === filteredClients.length ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'}
                    />
                  </svg>
                  {selectedClients.length === filteredClients.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-500">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Client List */}
              <div className="bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                    <p className="font-medium">No clients found</p>
                    <p className="text-sm">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredClients.map(client => (
                      <label
                        key={client.id}
                        className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedClients.includes(client.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => handleClientToggle(client.id)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedClients.includes(client.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}
                        >
                          {selectedClients.includes(client.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          {client.avatar ? (
                            <Image
                              src={
                                client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`
                              }
                              alt={client.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">{client.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{client.name}</p>
                            <p className="text-sm text-gray-500 truncate">{client.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignment Options */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              Assignment Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for clients..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {selectedClients.length > 0 && selectedVideos.length > 0 && (
                <span>
                  Will create {selectedClients.length * selectedVideos.length} assignment
                  {selectedClients.length * selectedVideos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onCloseAction}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedClients.length === 0 || isSubmitting}
                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  selectedClients.length > 0 && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Assigning Videos...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assign Videos ({selectedClients.length * selectedVideos.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
