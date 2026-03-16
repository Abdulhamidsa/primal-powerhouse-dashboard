import type { ReactNode } from 'react';
import { AddMealSection } from './AddMealSection';

interface MealImageSectionProps {
  children: ReactNode;
  uploadError: string;
}

export function MealImageSection({ children, uploadError }: MealImageSectionProps) {
  return (
    <AddMealSection title="Meal Image" description="Upload an image that will be shown on the meal card.">
      <div>
        {children}
        {uploadError && <p className="mt-2 text-sm text-red-400">{uploadError}</p>}
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Image will be uploaded to Cloudinary when you create the meal.
        </p>
      </div>
    </AddMealSection>
  );
}
