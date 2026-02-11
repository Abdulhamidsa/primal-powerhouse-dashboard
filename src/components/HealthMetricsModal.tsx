'use client';

import { useState } from 'react';
import { X, TrendingDown, TrendingUp, Activity, Flame, Beef, Wheat, Droplets, AlertCircle } from 'lucide-react';
import type { HealthMetricsOutput } from '@/lib/health/calculators';

interface HealthMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientData: {
    currentWeight: number | null;
    height: number | null;
    age: number | null;
    gender: string | null;
    activityLevel: string | null;
  };
  onSuccess?: (metrics: HealthMetricsOutput) => void;
}

export default function HealthMetricsModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientData,
  onSuccess,
}: HealthMetricsModalProps) {
  const [weight, setWeight] = useState(clientData.currentWeight?.toString() || '');
  const [goal, setGoal] = useState<'maintain' | 'lose_fat' | 'gain_muscle'>('maintain');
  const [aggressiveness, setAggressiveness] = useState<'conservative' | 'standard' | 'aggressive'>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HealthMetricsOutput | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/health-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWeight: parseFloat(weight),
          goal,
          goalAggressiveness: aggressiveness,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to calculate metrics');
      }

      const data = await response.json();
      setResults(data.metrics);
      setSubmitted(true);
      onSuccess?.(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getBMIColorClass = (category: string) => {
    switch (category) {
      case 'underweight':
        return 'bg-blue-500/10 border-blue-500 text-blue-600';
      case 'normal':
        return 'bg-green-500/10 border-green-500 text-green-600';
      case 'overweight':
        return 'bg-orange-500/10 border-orange-500 text-orange-600';
      case 'obese':
        return 'bg-red-500/10 border-red-500 text-red-600';
      default:
        return 'bg-gray-500/10 border-gray-500 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-3xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              💪 Health Metrics Calculator
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mt-1">
              {clientName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 rounded-lg transition">
            <X size={24} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!submitted ? (
            <form onSubmit={handleCalculate} className="space-y-6">
              {/* Weight Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                  required
                />
              </div>

              {/* Goal Selection */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                  Goal
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'lose_fat', label: '⬇️ Lose Fat', icon: TrendingDown },
                    { value: 'maintain', label: '➡️ Maintain', icon: Activity },
                    { value: 'gain_muscle', label: '⬆️ Gain Muscle', icon: TrendingUp },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGoal(opt.value as any)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                        goal === opt.value ? 'border-green-500 bg-green-500/10' : 'border-transparent'
                      }`}
                      style={{
                        background: goal === opt.value ? 'var(--color-bg)' : 'var(--color-bg)',
                        color: goal === opt.value ? 'var(--color-accent)' : 'var(--color-text)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aggressiveness */}
              {goal !== 'maintain' && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                    How Aggressive? ({goal === 'lose_fat' ? 'deficit' : 'surplus'} kcal)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: 'conservative',
                        label: 'Conservative',
                        desc: goal === 'lose_fat' ? '-300 kcal' : '+200 kcal',
                      },
                      {
                        value: 'standard',
                        label: 'Standard',
                        desc: goal === 'lose_fat' ? '-400 kcal' : '+250 kcal',
                      },
                      {
                        value: 'aggressive',
                        label: 'Aggressive',
                        desc: goal === 'lose_fat' ? '-500 kcal' : '+300 kcal',
                      },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAggressiveness(opt.value as any)}
                        className={`py-3 px-4 rounded-lg border-2 font-medium transition text-center`}
                        style={{
                          borderColor: aggressiveness === opt.value ? 'var(--color-accent)' : 'var(--color-border)',
                          background: aggressiveness === opt.value ? 'var(--color-accent)' : 'var(--color-bg)',
                          color: aggressiveness === opt.value ? 'white' : 'var(--color-text)',
                        }}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-xs opacity-75 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    borderColor: '#ef4444',
                    color: '#ef4444',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !weight}
                className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-50"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-text-on-accent)',
                }}
              >
                {loading ? 'Calculating...' : '🚀 Calculate Metrics'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
