import { weeklyCheckInPayloadSchema } from '../schemas/checkins.schema';
import type {
  CheckInFeatureVisibility,
  WeeklyCheckInPayload,
  WeeklyDraft,
} from '../types/checkins.types';

const optionalText = (value: string) => value.trim() || null;

export function buildWeeklyCheckInPayload(
  draft: WeeklyDraft,
  visibility: CheckInFeatureVisibility,
): WeeklyCheckInPayload {
  return weeklyCheckInPayloadSchema.parse({
    weightKg: visibility.weightChartEnabled && draft.weightKg ? Number(draft.weightKg) : null,
    progressPhotoFrontUrl: visibility.progressPhotosEnabled
      ? optionalText(draft.progressPhotoFrontUrl)
      : null,
    progressPhotoSideUrl: visibility.progressPhotosEnabled
      ? optionalText(draft.progressPhotoSideUrl)
      : null,
    progressPhotoBackUrl: visibility.progressPhotosEnabled
      ? optionalText(draft.progressPhotoBackUrl)
      : null,
    strengthUpdate: optionalText(draft.strengthUpdate),
    blockerText: optionalText(draft.blockerText),
    notes: optionalText(draft.notes),
  });
}
