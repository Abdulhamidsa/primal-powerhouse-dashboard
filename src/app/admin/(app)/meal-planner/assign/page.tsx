'use client';

import React, { useState } from 'react';
import IntegratedMealAssignmentModal from '@/components/IntegratedMealAssignmentModal';

export default function MealAssignmentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [lastAssignmentResult, setLastAssignmentResult] = useState<string | null>(null);

  // Sample clients for demonstration
  const clients = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Alex Johnson' },
  ];

  const handleOpenModal = (client?: { id: string; name: string }) => {
    setClientId(client?.id);
    setIsModalOpen(true);
  };

  const handleMealsAssigned = () => {
    setLastAssignmentResult(
      `Successfully assigned meals ${clientId ? `to client ${clients.find(c => c.id === clientId)?.name || ''}` : ''}`
    );

    // Clear the result message after 3 seconds
    setTimeout(() => {
      setLastAssignmentResult(null);
    }, 3000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Meal Assignment</h1>

      {lastAssignmentResult && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
          {lastAssignmentResult}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleOpenModal()}
            className="p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <h3 className="text-lg font-medium text-blue-800">Create New Meal Plan</h3>
            <p className="text-sm text-blue-600 mt-1">Create a new meal plan and assign to any client</p>
          </button>

          <button
            onClick={() => {
              // Open modal with personalization view directly
            }}
            className="p-6 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <h3 className="text-lg font-medium text-purple-800">Personalize a Meal</h3>
            <p className="text-sm text-purple-600 mt-1">Create a personalized meal variant for a specific client</p>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {clients.map(client => (
            <div
              key={client.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors"
              onClick={() => handleOpenModal(client)}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                {client.name.charAt(0)}
              </div>
              <h3 className="font-medium">{client.name}</h3>
              <p className="text-sm text-gray-600">Click to assign meals</p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenModal(client);
                  }}
                  className="flex-1 py-1 text-sm bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100"
                >
                  Assign Meals
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integrated Meal Assignment Modal */}
      <IntegratedMealAssignmentModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        clientId={clientId}
        onAssignedAction={handleMealsAssigned}
      />
    </div>
  );
}
