/**
 * AssignMealModal Component
 * Modal for assigning meals to clients with search and confirmation
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataService } from '@/services/dataService';

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface AssignMealModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  mealId: string;
  mealName: string;
  onAssignSuccessAction?: () => void;
}

export default function AssignMealModal({
  isOpen,
  onCloseAction,
  mealId,
  mealName,
  onAssignSuccessAction,
}: AssignMealModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen && clients.length === 0) {
      fetchClients();
    }
  }, [clients.length, isOpen]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientsData = await DataService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(
      client => client.name.toLowerCase().includes(query) || client.email.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setConfirming(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedClient) return;

    try {
      setAssigning(true);
      await DataService.assignMealToClient(mealId, selectedClient.id);

      // Success
      setSelectedClient(null);
      setConfirming(false);
      setSearchQuery('');
      onAssignSuccessAction?.();
      onCloseAction();
    } catch (error) {
      console.error('Error assigning meal:', error);
      alert('Failed to assign meal');
    } finally {
      setAssigning(false);
    }
  };

  const handleCancel = () => {
    setConfirming(false);
    setSelectedClient(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {!confirming ? (
        // Client Selection View
        <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-zinc-700">
          {/* Header */}
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-100">Assign Meal to Client</h2>
            <p className="text-zinc-400 mt-1">Select a client to assign &quot;{mealName}&quot; to</p>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-zinc-700">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clients List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-zinc-400">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-zinc-400">
                  {clients.length === 0 ? 'No clients available' : 'No clients match your search'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left p-4 rounded-lg border border-zinc-700 hover:border-blue-500 hover:bg-zinc-800/50 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-sm text-zinc-400">{client.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background:
                              client.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: client.status === 'ACTIVE' ? '#22c55e' : '#9ca3af',
                          }}
                        >
                          {client.status}
                        </span>
                        <div className="w-5 h-5 rounded border-2 border-zinc-600 group-hover:border-blue-500 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-700 flex gap-3">
            <button
              onClick={onCloseAction}
              className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Confirmation View
        <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Confirm Assignment</h3>
            <p className="text-zinc-400">
              Assign <span className="font-semibold text-zinc-200">&quot;{mealName}&quot;</span> to{' '}
              <span className="font-semibold text-zinc-200">{selectedClient?.name}</span>?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={assigning}
              className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              onClick={handleConfirmAssign}
              disabled={assigning}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {assigning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
