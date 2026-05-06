'use client';

import { useState } from 'react';
import { useCoachPlans, usePlanDays } from '../hooks/useCoachPlans';
import { trainingDayTypeEnum, planStatusEnum } from '../enums/training.enums';
import type { ClientTrainingPlan } from '@prisma/client';

export function PlanManager() {
  const { plans, isLoading, isError, createPlan, updatePlan } = useCoachPlans();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    clientId: string;
    startDate: string;
    endDate: string;
    status?: string;
  }>({
    clientId: '',
    startDate: '',
    endDate: '',
  });

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenForm = (plan?: ClientTrainingPlan) => {
    if (plan) {
      setEditingId(plan.id);
      const formatDateForInput = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0];
      };
      setFormData({
        clientId: plan.clientId,
        startDate: formatDateForInput(plan.startDate),
        endDate: formatDateForInput(plan.endDate ?? new Date()),
        status: plan.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        clientId: '',
        startDate: '',
        endDate: '',
      });
    }
    setShowForm(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      clientId: '',
      startDate: '',
      endDate: '',
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.clientId || !formData.startDate || !formData.endDate) {
        setError('All fields are required');
        setIsSubmitting(false);
        return;
      }

      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updatePlan(editingId, {
          endDate: formData.endDate,
          status: formData.status,
        });
      } else {
        await createPlan({
          clientId: formData.clientId,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }

      handleCloseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusOptions = planStatusEnum.options;
  const dayTypeOptions = trainingDayTypeEnum.options;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Training Plans</h1>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Plan
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">
              {editingId ? 'Edit Training Plan' : 'Create Training Plan'}
            </h2>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID *
                </label>
                <input
                  type="text"
                  disabled={!!editingId}
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="e.g., client-123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    disabled={!!editingId}
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status ?? ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-3">
        {isLoading && <p className="text-gray-600">Loading plans...</p>}
        {isError && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            Error loading plans. Please try again.
          </div>
        )}
        {plans && plans.length === 0 && (
          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
            No training plans created yet. Create one to get started!
          </div>
        )}

        {plans?.map((plan) => (
          <div
            key={plan.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div
              className="p-4 cursor-pointer flex items-center justify-between"
              onClick={() =>
                setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
              }
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Client: {plan.clientId}
                </h3>
                <p className="text-gray-600 text-sm">
                  {formatDate(plan.startDate)} - {formatDate(plan.endDate ?? undefined)}
                </p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium mt-2">
                  {plan.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenForm(plan);
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Days Preview */}
            {expandedPlan === plan.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
                <p className="text-sm text-gray-600 font-medium">Plan days will be managed in the day assignment view</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
