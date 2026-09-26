'use client';

import { useState } from 'react';
import { CaretDownIcon as ChevronDown, PencilSimpleIcon as Wand2, WarningCircleIcon as AlertCircle } from '@phosphor-icons/react';
import { useMealAiAssist } from '@/features/meals/hooks/useMealAiAssist';
import type { SuggestIngredientsResult } from '@/features/meals/hooks/useMealAiAssist';

interface MealAiAssistInputProps {
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  onSuggestionsAccepted: (result: SuggestIngredientsResult) => void;
  onHelperSet: (helperText: string) => void;
}

export default function MealAiAssistInput({ mealType, onSuggestionsAccepted, onHelperSet }: MealAiAssistInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [mode, setMode] = useState<'helper' | 'prefill'>('helper');
  const { loading, error, suggestions, suggestIngredientsFromMealDescription, resetSuggestions } = useMealAiAssist();

  const handleSubmit = async () => {
    if (!description.trim()) return;

    const result = await suggestIngredientsFromMealDescription(description, mealType);
    if (result) {
      setShowResults(true);
    }
  };

  const handleAccept = () => {
    if (suggestions) {
      if (mode === 'prefill') {
        onSuggestionsAccepted(suggestions);
      } else {
        // build concise helper prompt
        const matchedNames = suggestions.ingredients
          .map(i => i.name)
          .slice(0, 8)
          .join(', ');
        const unmatchedNames = suggestions.unmatched.map(u => u.name).join(', ');
        const helperParts = [] as string[];
        if (suggestions.mealName) helperParts.push(`${suggestions.mealName}`);
        if (matchedNames) helperParts.push(`Matched: ${matchedNames}`);
        if (unmatchedNames) helperParts.push(`Unmatched: ${unmatchedNames}`);
        const helperText = helperParts.join(' • ');
        onHelperSet(helperText);
      }
      setDescription('');
      setShowResults(false);
      resetSuggestions();
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setShowResults(false);
    resetSuggestions();
  };

  return (
    <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-surface-hover)]"
      >
        <div className="flex items-center gap-2">
          <Wand2 size={16} style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">AI Meal Assist (Optional)</span>
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-text-secondary)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 space-y-3 bg-[var(--color-surface)]">
          {!showResults ? (
            <>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Describe a meal or type a meal name, and AI will suggest matching ingredients from your database.
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-secondary)]">Mode:</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('helper')}
                    className={`px-2 py-1 rounded ${mode === 'helper' ? 'bg-[var(--color-accent)] text-white' : 'bg-transparent border'}`}
                  >
                    Helper prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('prefill')}
                    className={`px-2 py-1 rounded ${mode === 'prefill' ? 'bg-[var(--color-accent)] text-white' : 'bg-transparent border'}`}
                  >
                    Prefill ingredients
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g., Grilled salmon with lemon butter and asparagus"
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent text-[var(--color-text-primary)]"
                  style={{ borderColor: 'var(--color-border)' }}
                  disabled={loading}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !description.trim()}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {loading ? 'Generating suggestions…' : 'Suggest ingredients'}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#ff6b6b' }} />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </>
          ) : suggestions ? (
            <>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {suggestions.mealName || 'Suggested Meal'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {suggestions.ingredients.length} matched
                    {suggestions.unmatched.length > 0 && ` • ${suggestions.unmatched.length} unmatched`}
                  </p>
                </div>

                {/* Matched ingredients preview */}
                {suggestions.ingredients.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="text-[var(--color-text-secondary)]">Matched ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.ingredients.slice(0, 8).map(ing => (
                        <span key={ing.id} className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          {ing.name}
                        </span>
                      ))}
                      {suggestions.ingredients.length > 8 && (
                        <span className="px-2 py-1 text-[var(--color-text-secondary)]">
                          +{suggestions.ingredients.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Unmatched items warning */}
                {suggestions.unmatched.length > 0 && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#ffd43b' }} />
                    <div className="text-xs text-yellow-400">
                      <p className="font-medium">{suggestions.unmatched.length} item(s) not in database:</p>
                      <p className="text-xs mt-1 opacity-90">{suggestions.unmatched.map(u => u.name).join(', ')}</p>
                    </div>
                  </div>
                )}

                {/* Macros summary */}
                <div className="text-xs p-2 rounded-lg" style={{ background: 'var(--color-surface-hover)' }}>
                  <p className="text-[var(--color-text-secondary)] mb-1">Estimated macros:</p>
                  <div className="flex gap-3 text-[var(--color-text-primary)]">
                    <span>{Math.round(suggestions.macros.calories)} kcal</span>
                    <span>P: {Math.round(suggestions.macros.protein)}g</span>
                    <span>C: {Math.round(suggestions.macros.carbs)}g</span>
                    <span>F: {Math.round(suggestions.macros.fat)}g</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border text-[var(--color-text-primary)]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Discard
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--color-accent)' }}
                >
                  Accept & Continue
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
