'use client';

import { useState } from 'react';
import { Beef, Wheat, Droplets, AlertCircle, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { HealthMetricsOutput } from '@/lib/health/calculators';

interface HealthMetricsResultsProps {
  clientId: string;
  metrics: HealthMetricsOutput;
  onCloseAction: () => void;
  onSaveNotesAction: (notes: string[]) => void;
}

export function HealthMetricsResults({
  clientId,
  metrics,
  onCloseAction,
  onSaveNotesAction,
}: HealthMetricsResultsProps) {
  const [notes, setNotes] = useState<string[]>(metrics.notes || []);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNote = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !newNote.trim()) return;
    e.preventDefault();

    const updatedNotes = [...notes, newNote.trim()];
    setNotes(updatedNotes);
    setNewNote('');

    // Save notes to API
    setIsSaving(true);
    try {
      await fetch(`/api/clients/${clientId}/health-metrics/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      onSaveNotesAction(updatedNotes);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const removeNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);

    setIsSaving(true);
    try {
      await fetch(`/api/clients/${clientId}/health-metrics/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      onSaveNotesAction(updatedNotes);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
    <div
      className="rounded-3xl border p-6 md:p-8 shadow-lg mt-6"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          📊 Health Metrics Results
        </h2>
        <button
          onClick={onCloseAction}
          className="px-4 py-2 rounded-lg font-semibold transition"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
          }}
        >
          Done
        </button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* BMI Card */}
        <div className={`rounded-2xl border-2 p-6 text-center ${getBMIColorClass(metrics.bmiCategory)}`}>
          <p className="text-sm font-medium opacity-75 mb-2">BMI</p>
          <p className="text-4xl font-bold mb-1">{metrics.bmi.toFixed(1)}</p>
          <p className="text-sm font-semibold capitalize">{metrics.bmiCategory}</p>
        </div>

        {/* BMR Card */}
        <div
          className="rounded-2xl border-2 p-6 text-center"
          style={{
            borderColor: '#ec4899',
            background: '#ec489920',
            color: '#ec4899',
          }}
        >
          <p className="text-sm font-medium opacity-75 mb-2">BMR</p>
          <p className="text-4xl font-bold">{metrics.bmr}</p>
          <p className="text-xs mt-1">kcal/day</p>
        </div>

        {/* TDEE Card */}
        <div
          className="rounded-2xl border-2 p-6 text-center"
          style={{
            borderColor: '#8b5cf6',
            background: '#8b5cf620',
            color: '#8b5cf6',
          }}
        >
          <p className="text-sm font-medium opacity-75 mb-2">TDEE</p>
          <p className="text-4xl font-bold">{metrics.tdee}</p>
          <p className="text-xs mt-1">kcal/day</p>
        </div>

        {/* Goal Calories Card */}
        <div
          className="rounded-2xl border-2 p-6 text-center"
          style={{
            borderColor: '#06b6d4',
            background: '#06b6d420',
            color: '#06b6d4',
          }}
        >
          <p className="text-sm font-medium opacity-75 mb-2">GOAL</p>
          <p className="text-4xl font-bold">{metrics.recommendedCalories}</p>
          <p className="text-xs mt-1">kcal/day</p>
        </div>
      </div>

      {/* BMI Analysis Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          📊 BMI Analysis
        </h3>
        <div
          className="rounded-2xl border p-6"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* BMI Scale */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                BMI Scale
              </span>
              <span style={{ color: 'var(--color-text)' }} className="font-semibold">
                Your BMI: {metrics.bmi.toFixed(1)}
              </span>
            </div>

            {/* Visual BMI Bar */}
            <div
              className="relative h-12 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-lg overflow-hidden border-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Current BMI Marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                style={{
                  left: `${Math.min(Math.max((metrics.bmi / 45) * 100, 0), 100)}%`,
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
                }}
              />
              <div
                className="absolute -top-8 text-white font-bold text-sm"
                style={{
                  left: `${Math.min(Math.max((metrics.bmi / 45) * 100, 0), 100)}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {metrics.bmi.toFixed(1)}
              </div>
            </div>

            {/* Scale Labels */}
            <div className="grid grid-cols-4 gap-2 mt-6">
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 mx-auto mb-2 flex items-center justify-center">
                  <span style={{ color: '#3b82f6' }} className="text-sm font-bold">
                    ↓
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                  Underweight
                </p>
                <p style={{ color: 'var(--color-text)' }} className="text-xs font-semibold">
                  &lt; 18.5
                </p>
              </div>

              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 mx-auto mb-2 flex items-center justify-center">
                  <span style={{ color: '#10b981' }} className="text-sm font-bold">
                    ✓
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                  Normal
                </p>
                <p style={{ color: 'var(--color-text)' }} className="text-xs font-semibold">
                  18.5 - 24.9
                </p>
              </div>

              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 mx-auto mb-2 flex items-center justify-center">
                  <span style={{ color: '#f97316' }} className="text-sm font-bold">
                    ⚠
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                  Overweight
                </p>
                <p style={{ color: 'var(--color-text)' }} className="text-xs font-semibold">
                  25 - 29.9
                </p>
              </div>

              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 mx-auto mb-2 flex items-center justify-center">
                  <span style={{ color: '#ef4444' }} className="text-sm font-bold">
                    ✕
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                  Obese
                </p>
                <p style={{ color: 'var(--color-text)' }} className="text-xs font-semibold">
                  30+
                </p>
              </div>
            </div>
          </div>

          {/* BMI Interpretation */}
          <div
            className="p-4 rounded-lg border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <p style={{ color: 'var(--color-text)' }} className="font-semibold mb-2">
              💡 Your Status
            </p>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
              {metrics.bmiCategory === 'underweight' &&
                'Your BMI indicates you are underweight. Focus on building muscle mass and consuming adequate calories with nutrient-dense foods.'}
              {metrics.bmiCategory === 'normal' &&
                'Your BMI is in the healthy range. Maintain your current weight with balanced nutrition and regular exercise.'}
              {metrics.bmiCategory === 'overweight' &&
                'Your BMI indicates you are overweight. A combination of caloric deficit and regular exercise can help you reach a healthy weight.'}
              {metrics.bmiCategory === 'obese' &&
                'Your BMI indicates obesity. Consult with a healthcare provider for personalized guidance on weight management.'}
            </p>
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          🎯 Macro Targets
        </h3>

        {/* Pie Chart */}
        <div
          className="rounded-2xl border p-6 mb-6"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Protein', value: metrics.macros.protein * 4, color: '#ef4444' },
                  { name: 'Carbs', value: metrics.macros.carbs * 4, color: '#f59916' },
                  { name: 'Fat', value: metrics.macros.fat * 9, color: '#ffd93d' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#ef4444" />
                <Cell fill="#f59916" />
                <Cell fill="#ffd93d" />
              </Pie>
              <Tooltip
                formatter={value => `${value} kcal`}
                contentStyle={{
                  background: 'var(--color-accent)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein */}
          <div
            className="rounded-2xl border p-6 text-center"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex justify-center mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: '#ef444420',
                }}
              >
                <Beef size={28} style={{ color: '#ef4444' }} />
              </div>
            </div>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
              Protein
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#ef4444' }}>
              {metrics.macros.protein}g
            </p>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
              {Math.round(((metrics.macros.protein * 4) / metrics.recommendedCalories) * 100)}% of total
            </p>
          </div>

          {/* Carbs */}
          <div
            className="rounded-2xl border p-6 text-center"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex justify-center mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: '#f5991620',
                }}
              >
                <Wheat size={28} style={{ color: '#f59916' }} />
              </div>
            </div>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
              Carbs
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#f59916' }}>
              {metrics.macros.carbs}g
            </p>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
              {Math.round(((metrics.macros.carbs * 4) / metrics.recommendedCalories) * 100)}% of total
            </p>
          </div>

          {/* Fat */}
          <div
            className="rounded-2xl border p-6 text-center"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex justify-center mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: '#ffd93d20',
                }}
              >
                <Droplets size={28} style={{ color: '#ffd93d' }} />
              </div>
            </div>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
              Fat
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#ffd93d' }}>
              {metrics.macros.fat}g
            </p>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
              {Math.round(((metrics.macros.fat * 9) / metrics.recommendedCalories) * 100)}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          📝 Notes & Observations
        </h3>

        {/* Add Note Input */}
        <div className="mb-4">
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={handleAddNote}
            disabled={isSaving}
            placeholder="Add a note and press Enter..."
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              opacity: isSaving ? 0.6 : 1,
            }}
          />
          <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
            💡 Press Enter to add a note
          </p>
        </div>

        {/* Notes List */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-4 rounded-lg border"
                style={{
                  background: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex-1">
                  <p style={{ color: 'var(--color-text)' }}>{note}</p>
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
                    Note {idx + 1} of {notes.length}
                  </p>
                </div>
                <button
                  onClick={() => removeNote(idx)}
                  disabled={isSaving}
                  className="ml-3 p-2 hover:bg-red-500/10 rounded-lg transition"
                  style={{ opacity: isSaving ? 0.5 : 1 }}
                >
                  <Trash2 size={18} style={{ color: '#ef4444' }} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="p-6 rounded-lg border text-center"
            style={{
              background: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
            }}
          >
            <AlertCircle size={24} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
              No notes yet. Add observations about this calculation!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
