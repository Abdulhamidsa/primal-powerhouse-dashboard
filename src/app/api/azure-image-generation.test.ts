import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
const chatCompletion = vi.hoisted(() => vi.fn());
const imageGeneration = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({ prisma: database }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/azure-openai', () => ({
  AZURE_CHAT_DEPLOYMENT: 'gpt-4o',
  AZURE_IMAGE_DEPLOYMENT: 'gpt-image-1',
  azureOpenAI: {
    chat: { completions: { create: chatCompletion } },
    images: { generate: imageGeneration },
  },
}));

import { getAzureImageGenerationAvailability } from '@/lib/azure-image-availability';
import { generateMeals } from '@/lib/meal-generator';

describe('Azure image generation availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.$queryRaw.mockResolvedValue([
      {
        id: 'food-1',
        name: 'Chicken breast',
        display_name: 'Chicken breast',
        canonical_name: 'chicken breast',
        alias_names: [],
        caloriesKcal: 165,
        proteinG: 31,
        carbsG: 0,
        fatG: 3.6,
        fiberG: 0,
      },
    ]);
    chatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              meals: [{ name: 'Chicken bowl', ingredients: [{ name: 'chicken breast', grams: 150 }] }],
            }),
          },
        },
      ],
    });
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AZURE_OPENAI_IMAGE_GENERATION_ENABLED', '');
    vi.stubEnv('AZURE_OPENAI_IMAGE_DEPLOYMENT', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('disables production image generation when no deployment is configured', () => {
    expect(
      getAzureImageGenerationAvailability({
        NODE_ENV: 'production',
        AZURE_OPENAI_IMAGE_GENERATION_ENABLED: 'true',
        AZURE_OPENAI_IMAGE_DEPLOYMENT: '',
      }),
    ).toMatchObject({
      available: false,
      explicitlyEnabled: true,
      hasDeployment: false,
      reason: 'missing-deployment',
    });
  });

  it('returns meals without images and does not call Azure images when disabled', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const meals = await generateMeals({
      calories: 500,
      protein: 30,
      type: 'dinner',
      mealCount: 1,
      generateImages: true,
      imageProvider: 'azure',
    });

    expect(meals).toHaveLength(1);
    expect(meals[0]?.imageUrl).toBeNull();
    expect(imageGeneration).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('Azure image generation unavailable; continuing without images.');
    warning.mockRestore();
  });

  it('requires explicit production opt-in even when a deployment name exists', () => {
    expect(
      getAzureImageGenerationAvailability({
        NODE_ENV: 'production',
        AZURE_OPENAI_IMAGE_GENERATION_ENABLED: 'false',
        AZURE_OPENAI_IMAGE_DEPLOYMENT: 'gpt-image-1',
      }),
    ).toMatchObject({
      available: false,
      explicitlyEnabled: false,
      hasDeployment: true,
      reason: 'disabled',
    });
  });
});
