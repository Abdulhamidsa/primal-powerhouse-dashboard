export type AzureImageAvailabilityEnvironment = {
  NODE_ENV?: string;
  AZURE_OPENAI_IMAGE_GENERATION_ENABLED?: string;
  AZURE_OPENAI_IMAGE_DEPLOYMENT?: string;
};

export type AzureImageAvailabilityReason = 'available' | 'disabled' | 'missing-deployment';

export type AzureImageGenerationAvailability = {
  available: boolean;
  deployment: string | null;
  explicitlyEnabled: boolean;
  hasDeployment: boolean;
  isProduction: boolean;
  reason: AzureImageAvailabilityReason;
};

/**
 * The single source of truth for whether Azure image generation may make a
 * provider call. Production requires an explicit opt-in in addition to a
 * deployment name; non-production environments retain the existing behavior
 * when a deployment is configured.
 */
export function getAzureImageGenerationAvailability(
  environment: AzureImageAvailabilityEnvironment = process.env,
): AzureImageGenerationAvailability {
  const deployment = environment.AZURE_OPENAI_IMAGE_DEPLOYMENT?.trim() || null;
  const explicitlyEnabled = environment.AZURE_OPENAI_IMAGE_GENERATION_ENABLED?.trim().toLowerCase() === 'true';
  const isProduction = environment.NODE_ENV === 'production';
  const hasDeployment = Boolean(deployment);
  const available = hasDeployment && (!isProduction || explicitlyEnabled);

  return {
    available,
    deployment,
    explicitlyEnabled,
    hasDeployment,
    isProduction,
    reason: available ? 'available' : hasDeployment && isProduction && !explicitlyEnabled ? 'disabled' : 'missing-deployment',
  };
}
