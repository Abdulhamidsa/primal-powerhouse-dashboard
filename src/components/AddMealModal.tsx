// components/modals/AddMealModal.tsx
'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { getInitialMealFormData, useCreateMeal } from '@/hooks/useCreateMeal';
import { AddMealFormData } from '@/app/admin/(app)/meals/schemas/meal.schema';
import { AddMealModalHeader } from '@/app/admin/(app)/meals/modals/AddMealModalHeader';
import { BasicInformationSection } from '@/app/admin/(app)/meals/modals/BasicInformationSection';
import { NutritionInformationSection } from '@/app/admin/(app)/meals/modals/NutritionInformationSection';
import { PreparationDetailsSection } from '@/app/admin/(app)/meals/modals/PreparationDetailsSection';
import { DynamicFieldSection } from '@/app/admin/(app)/meals/modals/DynamicFieldSection';
import { MealImageSection } from '@/app/admin/(app)/meals/modals/MealImageSection';
import { AddMealModalFooter } from '@/app/admin/(app)/meals/modals/AddMealModalFooter';

interface AddMealModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onMealAddedAction: () => void;
}

type ArrayField = 'ingredients' | 'instructions' | 'tags';

export default function AddMealModal({ isOpen, onCloseAction, onMealAddedAction }: AddMealModalProps) {
  const [formData, setFormData] = useState<AddMealFormData>(getInitialMealFormData);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');

  const { loading, errors, createMeal, clearFieldError, clearErrors } = useCreateMeal();

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData(getInitialMealFormData());
    setSelectedImageFile(null);
    setUploadError('');
    clearErrors();
  };

  const handleClose = () => {
    onCloseAction();
    resetForm();
  };

  const handleInputChange = (field: keyof AddMealFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleArrayChange = (field: ArrayField, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));

    clearFieldError(field);
  };

  const addArrayItem = (field: ArrayField) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: ArrayField, index: number) => {
    if (formData[field].length <= 1) return;

    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleImageSelect = (file: File | null) => {
    setSelectedImageFile(file);
    setUploadError('');
  };

  const handleImageError = (error: string) => {
    setUploadError(error);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const success = await createMeal(formData, selectedImageFile);

    if (!success) return;

    onMealAddedAction();
    onCloseAction();
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content w-full max-w-5xl rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <AddMealModalHeader handleClose={handleClose} />

          <form onSubmit={handleSubmit} className="space-y-8 p-6">
            {errors.general && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errors.general}
              </div>
            )}

            <BasicInformationSection formData={formData} errors={errors} handleInputChange={handleInputChange} />

            <NutritionInformationSection formData={formData} errors={errors} handleInputChange={handleInputChange} />

            <PreparationDetailsSection formData={formData} errors={errors} handleInputChange={handleInputChange} />

            <DynamicFieldSection
              title="Ingredients *"
              description="Add each ingredient on its own row."
              buttonText="Add Ingredient"
              field="ingredients"
              values={formData.ingredients}
              error={errors.ingredients}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              handleArrayChange={handleArrayChange}
              placeholder="e.g., 6 oz chicken breast"
            />

            <DynamicFieldSection
              title="Instructions *"
              description="Break the meal down into clear steps."
              buttonText="Add Step"
              field="instructions"
              values={formData.instructions}
              error={errors.instructions}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              handleArrayChange={handleArrayChange}
              placeholder="e.g., Season chicken with salt and pepper"
              showIndex
            />

            <DynamicFieldSection
              title="Tags"
              description="Optional labels to organize the meal."
              buttonText="Add Tag"
              field="tags"
              values={formData.tags}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              handleArrayChange={handleArrayChange}
              placeholder="e.g., high-protein, gluten-free"
            />

            <MealImageSection uploadError={uploadError}>
              <ImageUpload onFileSelectAction={handleImageSelect} onError={handleImageError} disabled={loading} />
            </MealImageSection>

            <AddMealModalFooter loading={loading} handleClose={handleClose} />
          </form>
        </div>
      </div>
    </div>
  );
}
