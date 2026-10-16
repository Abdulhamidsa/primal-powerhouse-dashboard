import { afterEach, describe, expect, it } from 'vitest';
import { getWorkoutXAvailability, mapWorkoutXExercise } from '@/features/exercises/api/workoutX.server';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('WorkoutX integration', () => {
  it('normalizes WorkoutX v2 media and metadata', () => {
    const exercise = mapWorkoutXExercise({
      id: 'ex_123',
      name: 'Bench Press',
      bodyPart: 'chest',
      target: 'pectorals',
      equipment: 'barbell',
      secondaryMuscles: ['triceps'],
      instructions: ['Lower the bar.', 'Press it up.'],
      media: {
        mp4: 'https://cdn.test/720.mp4',
        poster: 'https://cdn.test/poster.jpg',
      },
    });

    expect(exercise.exerciseId).toBe('ex_123');
    expect(exercise.videoUrl).toBe('https://cdn.test/720.mp4');
    expect(exercise.gifUrl).toBe('');
    expect(exercise.imageUrl).toBe('https://cdn.test/poster.jpg');
    expect(exercise.thumbnailUrl).toBe('https://cdn.test/poster.jpg');
    expect(exercise.targetMuscles).toEqual(['pectorals']);
  });

  it('only enables the provider when its server-side configuration is present', () => {
    process.env = {
      ...process.env,
      WORKOUTX_API_KEY: 'test-key',
      WORKOUTX_API_BASE_URL: 'http://localhost:3100',
    };
    expect(getWorkoutXAvailability()).toEqual({ enabled: true });

    process.env = { ...process.env, WORKOUTX_API_KEY: '' };
    expect(getWorkoutXAvailability()).toEqual({ enabled: false, reason: 'missing_key' });
  });
});
