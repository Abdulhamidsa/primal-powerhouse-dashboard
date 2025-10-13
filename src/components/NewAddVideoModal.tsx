'use client';

import { useState, useEffect } from 'react';
import {
  Video,
  VideoCategory,
  DifficultyLevel,
  VideoFormData,
  VIDEO_CATEGORIES,
  DIFFICULTY_LEVELS,
} from '@/types/video';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Tag, Award, Dumbbell, Activity, Play, Plus, X, Info, VideoIcon } from 'lucide-react';
import Image from 'next/image';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAdded: (video: Video) => void;
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

export default function NewAddVideoModal({ isOpen, onClose, onVideoAdded }: AddVideoModalProps) {
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

  // This function has been moved inside the useEffect

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

  const handleInputChange = (field: keyof VideoFormData, value: string | number | string[] | boolean) => {
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
        onVideoAdded(newVideo);
        onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Add New Training Video
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
              Step {currentStep} of 3:{' '}
              {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Details' : 'Training Data'}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1 transition-all duration-300"
                style={{
                  width: `${(currentStep / 3) * 100}%`,
                  background: 'var(--color-accent)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Step 1: Basic Information & Video Preview */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <VideoIcon className="w-4 h-4" />
                        Video Title *
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      placeholder="e.g., 10-Minute Morning Cardio Blast"
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Video URL *
                      </div>
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={e => handleInputChange('videoUrl', e.target.value)}
                      placeholder="YouTube, Vimeo, or direct video URL"
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                    {formData.videoUrl && !previewType && (
                      <p className="text-sm mt-2 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                        <Info className="w-4 h-4" />
                        URL format not recognized. Supported: YouTube, Vimeo, MP4/WebM/OGG
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Image src="/file.svg" className="w-4 h-4" alt="Thumbnail" width={16} height={16} />
                        Thumbnail URL
                      </div>
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnailUrl}
                      onChange={e => handleInputChange('thumbnailUrl', e.target.value)}
                      placeholder="Auto-detected for YouTube videos"
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                  </div>
                </div>

                {/* Video Preview */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Video Preview
                    </div>
                  </label>
                  <div
                    className="relative aspect-video rounded-lg overflow-hidden"
                    style={{
                      background: 'var(--color-bg-alt)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
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
                      </>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center h-full"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Play className="w-12 h-12 mb-2 opacity-30" />
                        <p className="text-sm font-medium">Enter a video URL to see preview</p>
                      </div>
                    )}
                  </div>
                  {previewType && (
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      Source:{' '}
                      {previewType === 'youtube' ? 'YouTube' : previewType === 'vimeo' ? 'Vimeo' : 'Direct Video'}
                    </div>
                  )}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Description *
                      </div>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this workout involves, its benefits, and what clients can expect..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Category
                        </div>
                      </label>
                      <select
                        value={formData.category}
                        onChange={e => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                        style={{
                          background: 'var(--color-bg-alt)',
                          color: 'var(--color-text)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        {VIDEO_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Difficulty
                        </div>
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={e => handleInputChange('difficulty', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                        style={{
                          background: 'var(--color-bg-alt)',
                          color: 'var(--color-text)',
                          borderColor: 'var(--color-border)',
                        }}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration (minutes) *
                      </div>
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={e => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 15"
                      min="1"
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags (comma-separated)
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={handleTagsChange}
                      placeholder="e.g., HIIT, fat burn, no equipment"
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                      style={{
                        background: 'var(--color-bg-alt)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      Instructions
                    </label>
                    {formData.instructions &&
                      formData.instructions.map((instruction, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={instruction}
                            onChange={e => handleArrayInputChange('instructions', index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                            style={{
                              background: 'var(--color-bg-alt)',
                              color: 'var(--color-text)',
                              borderColor: 'var(--color-border)',
                            }}
                          />
                          <button
                            onClick={() => removeArrayItem('instructions', index)}
                            className="p-2 rounded-lg"
                            style={{ color: 'var(--color-accent)' }}
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => addArrayItem('instructions')}
                      className="text-sm font-medium flex items-center gap-2 mt-2 px-3 py-1 rounded-lg"
                      style={{
                        background: 'var(--color-accent-muted)',
                        color: 'var(--color-accent)',
                      }}
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                      Add Instruction
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      Tips
                    </label>
                    {formData.tips &&
                      formData.tips.map((tip, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tip}
                            onChange={e => handleArrayInputChange('tips', index, e.target.value)}
                            placeholder={`Tip ${index + 1}`}
                            className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
                            style={{
                              background: 'var(--color-bg-alt)',
                              color: 'var(--color-text)',
                              borderColor: 'var(--color-border)',
                            }}
                          />
                          <button
                            onClick={() => removeArrayItem('tips', index)}
                            className="p-2 rounded-lg"
                            style={{ color: 'var(--color-accent)' }}
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => addArrayItem('tips')}
                      className="text-sm font-medium flex items-center gap-2 mt-2 px-3 py-1 rounded-lg"
                      style={{
                        background: 'var(--color-accent-muted)',
                        color: 'var(--color-accent)',
                      }}
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5" />
                      Equipment Required *
                    </div>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {EQUIPMENT_OPTIONS.map(equipment => (
                      <label
                        key={equipment}
                        className={`cursor-pointer p-3 rounded-lg border transition-colors flex items-center`}
                        style={{
                          background:
                            formData.equipment && formData.equipment.includes(equipment)
                              ? 'var(--color-accent-muted)'
                              : 'var(--color-bg-alt)',
                          borderColor:
                            formData.equipment && formData.equipment.includes(equipment)
                              ? 'var(--color-accent)'
                              : 'var(--color-border)',
                          color:
                            formData.equipment && formData.equipment.includes(equipment)
                              ? 'var(--color-accent)'
                              : 'var(--color-text)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.equipment ? formData.equipment.includes(equipment) : false}
                          onChange={() => handleEquipmentToggle(equipment)}
                          className="sr-only"
                        />
                        <span className="text-sm">{equipment}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Muscle Groups Targeted *
                    </div>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {MUSCLE_GROUPS.map(muscle => (
                      <label
                        key={muscle}
                        className={`cursor-pointer p-3 rounded-lg border transition-colors flex items-center`}
                        style={{
                          background:
                            formData.muscleGroups && formData.muscleGroups.includes(muscle)
                              ? 'var(--color-accent-muted)'
                              : 'var(--color-bg-alt)',
                          borderColor:
                            formData.muscleGroups && formData.muscleGroups.includes(muscle)
                              ? 'var(--color-accent)'
                              : 'var(--color-border)',
                          color:
                            formData.muscleGroups && formData.muscleGroups.includes(muscle)
                              ? 'var(--color-accent)'
                              : 'var(--color-text)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.muscleGroups ? formData.muscleGroups.includes(muscle) : false}
                          onChange={() => handleMuscleGroupToggle(muscle)}
                          className="sr-only"
                        />
                        <span className="text-sm">{muscle}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border rounded-lg"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)',
                }}
                type="button"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border rounded-lg"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text-muted)',
                borderColor: 'var(--color-border)',
              }}
              type="button"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="px-6 py-3 rounded-lg disabled:opacity-50"
                style={{
                  background: isStepValid(currentStep) ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                  color: isStepValid(currentStep) ? 'var(--color-text)' : 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)',
                  border: !isStepValid(currentStep) ? '1px solid var(--color-border)' : 'none',
                }}
                type="button"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid(3) || isSubmitting}
                className="px-6 py-3 rounded-lg disabled:opacity-50"
                style={{
                  background: isStepValid(3) && !isSubmitting ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                  color: isStepValid(3) && !isSubmitting ? 'var(--color-text)' : 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)',
                  border: !isStepValid(3) || isSubmitting ? '1px solid var(--color-border)' : 'none',
                }}
                type="button"
              >
                {isSubmitting ? 'Adding Video...' : 'Add Video'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
