'use client';

import { useMemo, useState } from 'react';
import { buildMealChatGptImagePrompt } from '@/features/meals/utils/buildMealChatGptImagePrompt';
import type { MealPromptInput, MealPromptOutput } from '@/features/meals/types/mealPrompt.types';

export function useMealPromptGenerator() {
  const [prompt, setPrompt] = useState<MealPromptOutput | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const promptText = useMemo(() => {
    if (!prompt) return '';
    return prompt.fullPrompt;
  }, [prompt]);

  const generate = (input: MealPromptInput) => {
    const mealName = input.mealName.trim();
    if (!mealName) {
      setError('Meal name is required to generate a prompt.');
      setPrompt(null);
      return null;
    }

    const built = buildMealChatGptImagePrompt(input);
    setPrompt(built);
    setError('');
    setCopied(false);
    return built;
  };

  const copy = async () => {
    if (!promptText) {
      setError('Generate a prompt first.');
      return false;
    }

    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setError('');
      setTimeout(() => setCopied(false), 1800);
      return true;
    } catch {
      setError('Could not copy prompt. Please copy it manually.');
      return false;
    }
  };

  const reset = () => {
    setPrompt(null);
    setError('');
    setCopied(false);
  };

  return {
    prompt,
    promptText,
    error,
    copied,
    hasPrompt: Boolean(promptText),
    generate,
    copy,
    reset,
  };
}
