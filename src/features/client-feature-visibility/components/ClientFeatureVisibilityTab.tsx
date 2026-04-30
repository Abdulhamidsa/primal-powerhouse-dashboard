'use client';

import { useEffect, useState } from 'react';
import { useClientFeatureVisibility } from '../hooks/useClientFeatureVisibility';
import { ClientFeatureVisibilityFormValues } from '../types/clientFeatureVisibility.types';

interface ClientFeatureVisibilityTabProps {
  clientId: string;
}

export function ClientFeatureVisibilityTab({ clientId }: ClientFeatureVisibilityTabProps) {
  const { data, isLoading, isSubmitting, submitError, submit } = useClientFeatureVisibility(clientId);
  const [formValues, setFormValues] = useState<ClientFeatureVisibilityFormValues>({
    dailyCheckinsEnabled: true,
    dailyWeightEnabled: true,
    weeklyCheckinsEnabled: true,
    weightChartEnabled: true,
    progressPhotosEnabled: true,
    nutritionTrackingEnabled: true,
    workoutTrackingEnabled: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (data) {
      const newValues: ClientFeatureVisibilityFormValues = {
        dailyCheckinsEnabled: data.dailyCheckinsEnabled,
        dailyWeightEnabled: data.dailyWeightEnabled ?? true,
        weeklyCheckinsEnabled: data.weeklyCheckinsEnabled,
        weightChartEnabled: data.weightChartEnabled,
        progressPhotosEnabled: data.progressPhotosEnabled,
        nutritionTrackingEnabled: data.nutritionTrackingEnabled,
        workoutTrackingEnabled: data.workoutTrackingEnabled,
      };
      setFormValues(newValues);
      setHasChanges(false);
    }
  }, [data]);

  const handleToggle = (field: keyof ClientFeatureVisibilityFormValues) => {
    setFormValues(prev => ({
      ...prev,
      [field]: !(prev[field] ?? true),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await submit(formValues);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update feature visibility:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Check-ins Group */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Check-ins
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.dailyCheckinsEnabled ?? true}
              onChange={() => handleToggle('dailyCheckinsEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Daily check-ins</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.dailyWeightEnabled ?? true}
              onChange={() => handleToggle('dailyWeightEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Daily weight (extra)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.weeklyCheckinsEnabled ?? true}
              onChange={() => handleToggle('weeklyCheckinsEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Weekly check-ins</span>
          </label>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Control whether the client can access daily and weekly check-in features.
          </p>
        </div>
      </div>

      {/* Progress Group */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Progress
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.weightChartEnabled ?? true}
              onChange={() => handleToggle('weightChartEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Weight chart</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.progressPhotosEnabled ?? true}
              onChange={() => handleToggle('progressPhotosEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Progress photos</span>
          </label>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Control access to weight tracking and progress photo features.
          </p>
        </div>
      </div>

      {/* Tracking Group */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Tracking
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.nutritionTrackingEnabled ?? true}
              onChange={() => handleToggle('nutritionTrackingEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Nutrition tracking</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues.workoutTrackingEnabled ?? true}
              onChange={() => handleToggle('workoutTrackingEnabled')}
              className="w-5 h-5 rounded cursor-pointer"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <span style={{ color: 'var(--color-text)' }}>Workout tracking</span>
          </label>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Control access to nutrition and workout logging features.
          </p>
        </div>
      </div>

      {/* Error message */}
      {submitError && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            borderColor: 'var(--color-error)',
            background: 'rgba(220, 38, 38, 0.1)',
            color: 'var(--color-error)',
          }}
        >
          Failed to update settings. Please try again.
        </div>
      )}

      {/* Save button */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSubmitting}
          className="px-4 py-2 rounded-lg font-medium transition-opacity disabled:opacity-50"
          style={{
            background: hasChanges ? 'var(--color-primary)' : 'var(--color-border)',
            color: hasChanges ? 'white' : 'var(--color-text-muted)',
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
