'use client';


import { CaretLeftIcon, CaretRightIcon, CheckIcon, CircleNotchIcon, PlusIcon, TrashIcon, VideoCameraIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import {
  Video,
  VideoCategory,
  DifficultyLevel,
  VideoFormData,
  VIDEO_CATEGORIES,
  DIFFICULTY_LEVELS,
} from '@/types/video';

interface AddVideoModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onVideoAddedAction: (video: Video) => void;
}

const INITIAL_FORM_DATA: VideoFormData = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  duration: 0,
  category: VideoCategory.STRENGTH_TRAINING,
  difficulty: DifficultyLevel.BEGINNER,
  equipment: [],
  muscleGroups: [],
  tags: [],
  instructions: [''],
  tips: [''],
  isPublic: true,
};

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Glutes',
  'Abs',
  'Core',
  'Calves',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
];

const EQUIPMENT_OPTIONS = [
  'Bodyweight',
  'Dumbbells',
  'Barbell',
  'Kettlebell',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
  'Machine',
  'Cable',
  'TRX',
  'Medicine Ball',
  'Yoga Mat',
];

const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const extractVimeoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export default function AddVideoModal({ isOpen, onCloseAction, onVideoAddedAction }: AddVideoModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VideoFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState<'youtube' | 'vimeo' | 'direct' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData(INITIAL_FORM_DATA);
      setPreviewUrl('');
      setPreviewType(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const detectVideoType = (url: string) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
          setPreviewUrl(`https://www.youtube.com/embed/${videoId}`);
          setPreviewType('youtube');
          if (!formData.thumbnailUrl) {
            setFormData(prev => ({
              ...prev,
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            }));
          }
        }
      } else if (url.includes('vimeo.com')) {
        const videoId = extractVimeoId(url);
        if (videoId) {
          setPreviewUrl(`https://player.vimeo.com/video/${videoId}`);
          setPreviewType('vimeo');
        }
      } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
        setPreviewUrl(url);
        setPreviewType('direct');
      } else {
        setPreviewUrl('');
        setPreviewType(null);
      }
    };

    if (formData.videoUrl) {
      detectVideoType(formData.videoUrl);
    } else {
      setPreviewUrl('');
      setPreviewType(null);
    }
  }, [formData.videoUrl, formData.thumbnailUrl]);

  const handleInputChange = (field: keyof VideoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: keyof VideoFormData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: keyof VideoFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ''],
    }));
  };

  const removeArrayItem = (field: keyof VideoFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleEquipmentToggle = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment:
        prev.equipment && prev.equipment.includes(equipment)
          ? prev.equipment.filter(e => e !== equipment)
          : [...(prev.equipment || []), equipment],
    }));
  };

  const handleMuscleGroupToggle = (muscle: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups:
        prev.muscleGroups && prev.muscleGroups.includes(muscle)
          ? prev.muscleGroups.filter(m => m !== muscle)
          : [...(prev.muscleGroups || []), muscle],
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(formData.title && formData.videoUrl);
      case 2:
        return Boolean(formData.description && formData.duration > 0);
      case 3:
        return Boolean(
          formData.equipment &&
            formData.equipment.length > 0 &&
            formData.muscleGroups &&
            formData.muscleGroups.length > 0
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid(3)) return;

    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...formData,
        instructions: formData.instructions ? formData.instructions.filter(i => i.trim() !== '') : [],
        tips: formData.tips ? formData.tips.filter(t => t.trim() !== '') : [],
        viewCount: 0,
        coachId: 'cmeejzitq00007kswt2jrt8hl', // Use the ID of the user we created
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        const newVideo = await response.json();
        onVideoAddedAction(newVideo);
        onCloseAction();
      } else {
        const errorData = await response.json();
        console.error('Failed to add video:', errorData);
        alert(`Failed to add video: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding video:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add New Training Video</h2>
              <p className="text-blue-100 mt-1">Step {currentStep} of 3</p>
            </div>
            <button
              onClick={onCloseAction}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
            >
              <XIcon className="w-6 h-6" aria-hidden="true" focusable="false" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={currentStep >= 1 ? 'text-white font-semibold' : 'text-blue-200'}>Basic Info</span>
              <span className={currentStep >= 2 ? 'text-white font-semibold' : 'text-blue-200'}>Details</span>
              <span className={currentStep >= 3 ? 'text-white font-semibold' : 'text-blue-200'}>Training Data</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Information & Video Preview */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"> Video Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      placeholder="e.g., 10-Minute Morning Cardio Blast"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"> Video URL *</label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={e => handleInputChange('videoUrl', e.target.value)}
                      placeholder="YouTube, Vimeo, or direct video URL"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {formData.videoUrl && !previewType && (
                      <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                        <WarningIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                        URL format not recognized. Supported: YouTube, Vimeo, MP4/WebM/OGG
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"> Thumbnail URL</label>
                    <input
                      type="url"
                      value={formData.thumbnailUrl}
                      onChange={e => handleInputChange('thumbnailUrl', e.target.value)}
                      placeholder="Auto-detected for YouTube videos"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Video Preview */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <VideoCameraIcon className="w-5 h-5 text-blue-500" aria-hidden="true" focusable="false" />
                      Video Preview
                    </h3>
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
                      {previewUrl ? (
                        <>
                          {previewType === 'youtube' && (
                            <iframe
                              src={previewUrl}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                          {previewType === 'vimeo' && (
                            <iframe
                              src={previewUrl}
                              className="w-full h-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                          {previewType === 'direct' && (
                            <video src={previewUrl} controls className="w-full h-full object-cover" />
                          )}
                          <div className="absolute top-3 right-3">
                            <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                              {previewType === 'youtube' && ' YouTube'}
                              {previewType === 'vimeo' && ' Vimeo'}
                              {previewType === 'direct' && ' Direct'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <VideoCameraIcon className="w-16 h-16 mb-3 text-gray-400" aria-hidden="true" focusable="false" />
                          <p className="text-sm font-medium">Video Preview</p>
                          <p className="text-xs text-gray-400 mt-1">Enter a video URL to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this workout involves, its benefits, and what clients can expect..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2"> Category</label>
                      <select
                        value={formData.category}
                        onChange={e => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {VIDEO_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2"> Difficulty</label>
                      <select
                        value={formData.difficulty}
                        onChange={e => handleInputChange('difficulty', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {DIFFICULTY_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">⏱️ Duration (minutes) *</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={e => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 15"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"> Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleTagsChange}
                      placeholder="e.g., HIIT, fat burn, no equipment"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3"> Instructions</label>
                    {formData.instructions &&
                      formData.instructions.map((instruction, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={instruction}
                            onChange={e => handleArrayInputChange('instructions', index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                          <button
                            onClick={() => removeArrayItem('instructions', index)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                            type="button"
                          >
                            <TrashIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => addArrayItem('instructions')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 mt-2"
                      type="button"
                    >
                      <PlusIcon className="h-4 w-4" aria-hidden="true" />
                      Add Instruction
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3"> Tips</label>
                    {formData.tips &&
                      formData.tips.map((tip, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tip}
                            onChange={e => handleArrayInputChange('tips', index, e.target.value)}
                            placeholder={`Tip ${index + 1}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                          <button
                            onClick={() => removeArrayItem('tips', index)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                            type="button"
                          >
                            <TrashIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => addArrayItem('tips')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 mt-2"
                      type="button"
                    >
                      <PlusIcon className="h-4 w-4" aria-hidden="true" />
                      Add Tip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Training Data */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                     Equipment Required *
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {EQUIPMENT_OPTIONS.map(equipment => (
                      <label
                        key={equipment}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all text-sm font-medium text-center ${
                          formData.equipment && formData.equipment.includes(equipment)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.equipment ? formData.equipment.includes(equipment) : false}
                          onChange={() => handleEquipmentToggle(equipment)}
                          className="sr-only"
                        />
                        {equipment}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                     Muscle Groups Targeted *
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {MUSCLE_GROUPS.map(muscle => (
                      <label
                        key={muscle}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all text-sm font-medium text-center ${
                          formData.muscleGroups && formData.muscleGroups.includes(muscle)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.muscleGroups ? formData.muscleGroups.includes(muscle) : false}
                          onChange={() => handleMuscleGroupToggle(muscle)}
                          className="sr-only"
                        />
                        {muscle}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 font-medium"
                  type="button"
                >
                  <CaretLeftIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCloseAction}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
                type="button"
              >
                Cancel
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    isStepValid(currentStep)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  type="button"
                >
                  Next
                  <CaretRightIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid(3) || isSubmitting}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    isStepValid(3) && !isSubmitting
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <CircleNotchIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Adding Video...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                      Add Video
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
