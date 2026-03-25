import 'server-only';

import { azureOpenAI, AZURE_IMAGE_DEPLOYMENT } from '@/lib/azure-openai';
import type { MatchedIngredient, MealImageProvider, MealImageQualityProfile } from '@/types/meal';
import { buildMealImagePrompt } from '@/lib/prompts';

type GenerateMealImageOptions = {
  provider: MealImageProvider;
  qualityProfile?: MealImageQualityProfile;
  batchMealCount?: number;
  checkpoint?: string;
  mealName: string;
  ingredients: MatchedIngredient[];
};

type SdProfileConfig = {
  steps: number;
  width: number;
  height: number;
  samplerName: string;
  cfgScale: number;
};

function resolveEffectiveProfile(
  profile: MealImageQualityProfile | undefined,
  batchMealCount: number | undefined,
): MealImageQualityProfile {
  if (profile) return profile;
  if ((batchMealCount ?? 0) > 8) return 'fast';
  return 'balanced';
}

function getSdProfileConfig(profile: MealImageQualityProfile): SdProfileConfig {
  switch (profile) {
    case 'fast':
      return {
        steps: Number(process.env.LOCAL_SD_FAST_STEPS ?? 16),
        width: Number(process.env.LOCAL_SD_FAST_WIDTH ?? 640),
        height: Number(process.env.LOCAL_SD_FAST_HEIGHT ?? 640),
        samplerName: process.env.LOCAL_SD_FAST_SAMPLER ?? 'DPM++ 2M Karras',
        cfgScale: Number(process.env.LOCAL_SD_FAST_CFG_SCALE ?? 7),
      };
    case 'high':
      return {
        steps: Number(process.env.LOCAL_SD_HIGH_STEPS ?? 30),
        width: Number(process.env.LOCAL_SD_HIGH_WIDTH ?? 1024),
        height: Number(process.env.LOCAL_SD_HIGH_HEIGHT ?? 1024),
        samplerName: process.env.LOCAL_SD_HIGH_SAMPLER ?? 'DPM++ 2M Karras',
        cfgScale: Number(process.env.LOCAL_SD_HIGH_CFG_SCALE ?? 7),
      };
    case 'balanced':
    default:
      return {
        steps: Number(process.env.LOCAL_SD_BALANCED_STEPS ?? 20),
        width: Number(process.env.LOCAL_SD_BALANCED_WIDTH ?? 768),
        height: Number(process.env.LOCAL_SD_BALANCED_HEIGHT ?? 768),
        samplerName: process.env.LOCAL_SD_BALANCED_SAMPLER ?? 'DPM++ 2M Karras',
        cfgScale: Number(process.env.LOCAL_SD_BALANCED_CFG_SCALE ?? 7),
      };
  }
}

function getCloudinaryUploadConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'meals';

  if (!cloudName || !uploadPreset) {
    return null;
  }

  return { cloudName, uploadPreset, folder };
}

async function uploadDataUriToCloudinary(dataUri: string, tags: string[]): Promise<string | null> {
  const config = getCloudinaryUploadConfig();
  if (!config) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', config.folder);
  if (tags.length > 0) {
    formData.append('tags', tags.join(','));
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as { secure_url?: string };
  return payload.secure_url ?? null;
}

async function generateAzureImage(prompt: string): Promise<string | null> {
  if (!AZURE_IMAGE_DEPLOYMENT) {
    return null;
  }

  const imageResponse = await azureOpenAI.images.generate({
    model: AZURE_IMAGE_DEPLOYMENT,
    prompt,
    size: '1024x1024',
  });

  const image = imageResponse.data?.[0];
  if (!image) return null;

  if ('url' in image && image.url) {
    return image.url;
  }

  if ('b64_json' in image && image.b64_json) {
    return uploadDataUriToCloudinary(`data:image/png;base64,${image.b64_json}`, ['ai-generated', 'provider:azure']);
  }

  return null;
}

async function requestLocalSdImage(
  prompt: string,
  checkpoint: string | undefined,
  qualityProfile: MealImageQualityProfile,
): Promise<string | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const sdBaseUrl = process.env.LOCAL_SD_URL || 'http://127.0.0.1:7860';
  const configuredPath = process.env.LOCAL_SD_TXT2IMG_PATH;
  const profileConfig = getSdProfileConfig(qualityProfile);
  const payload: Record<string, unknown> = {
    prompt,
    steps: profileConfig.steps,
    cfg_scale: profileConfig.cfgScale,
    width: profileConfig.width,
    height: profileConfig.height,
    sampler_name: profileConfig.samplerName,
  };

  if (checkpoint) {
    payload.override_settings = {
      sd_model_checkpoint: checkpoint,
    };
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.LOCAL_SD_TIMEOUT_MS ?? 180000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const defaultPaths = ['/sdapi/v1/txt2img', '/sdapi/v1/txt2img/'];
    const candidatePaths = configuredPath
      ? [configuredPath, ...defaultPaths.filter(path => path !== configuredPath)]
      : defaultPaths;

    let lastError: Error | null = null;

    for (const path of candidatePaths) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const response = await fetch(`${sdBaseUrl}${normalizedPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 404) {
        const text = await response.text();
        lastError = new Error(`404 on ${normalizedPath}: ${text}`);
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Local SD request failed on ${normalizedPath}: ${response.status} ${text}`);
      }

      const result = (await response.json()) as { images?: string[] };
      const firstImage = result.images?.[0];
      if (!firstImage) {
        return null;
      }

      return uploadDataUriToCloudinary(`data:image/png;base64,${firstImage}`, ['ai-generated', 'provider:local-sd']);
    }

    let openApiHint = '';
    try {
      const openapiResponse = await fetch(`${sdBaseUrl}/openapi.json`, { signal: controller.signal });
      if (openapiResponse.ok) {
        const openapi = (await openapiResponse.json()) as { paths?: Record<string, unknown> };
        const hasTxt2Img = Boolean(openapi.paths && openapi.paths['/sdapi/v1/txt2img']);
        const hasGradioPredict = Boolean(openapi.paths && openapi.paths['/api/{api_name}']);
        if (!hasTxt2Img && hasGradioPredict) {
          openApiHint =
            ' Detected Gradio-style endpoints but no /sdapi/v1/txt2img. Start A1111/Forge with --api, or set LOCAL_SD_TXT2IMG_PATH to the correct generation route.';
        }
      }
    } catch {
      // Best-effort diagnostics only.
    }

    throw new Error(
      `Local SD txt2img endpoint not found at ${sdBaseUrl}. Tried: ${candidatePaths.join(', ')}.${openApiHint} ${lastError?.message ?? ''}`,
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Local SD request timed out after ${timeoutMs}ms. Use imageQualityProfile='fast' or increase LOCAL_SD_TIMEOUT_MS.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateLocalSdImage(
  prompt: string,
  checkpoint: string | undefined,
  qualityProfile: MealImageQualityProfile,
): Promise<string | null> {
  try {
    return await requestLocalSdImage(prompt, checkpoint, qualityProfile);
  } catch (firstError) {
    // Timeouts should not be retried immediately.
    if (firstError instanceof Error && firstError.message.includes('timed out')) {
      throw firstError;
    }

    // Retry once on transient local errors/timeouts.
    try {
      return await requestLocalSdImage(prompt, checkpoint, qualityProfile);
    } catch {
      throw firstError;
    }
  }
}

export async function generateMealImageWithProvider(options: GenerateMealImageOptions): Promise<string | null> {
  const ingredientNames = options.ingredients.map(item => item.displayName || item.name);
  const prompt = buildMealImagePrompt(options.mealName, ingredientNames);
  const effectiveProfile = resolveEffectiveProfile(options.qualityProfile, options.batchMealCount);

  if (options.provider === 'local-sd') {
    return generateLocalSdImage(prompt, options.checkpoint, effectiveProfile);
  }

  return generateAzureImage(prompt);
}
