export interface Video {
  id: string;
  title: string;
  description?: string;
  category: VideoCategory;
  difficulty: DifficultyLevel;
  duration: number; // duration in seconds
  videoUrl: string;
  thumbnailUrl?: string;
  equipment?: string[];
  muscleGroups?: string[];
  tags?: string[];
  instructions?: string[];
  tips?: string[];
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  coachId: string;
}

export interface VideoAssignment {
  id: string;
  assignedDate: Date;
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  progress: number; // 0.0 to 100.0 percentage
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  videoId: string;
  video?: Video;
}

export interface VideoFormData {
  title: string;
  description?: string;
  category: VideoCategory;
  difficulty: DifficultyLevel;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string;
  equipment?: string[];
  muscleGroups?: string[];
  tags?: string[];
  instructions?: string[];
  tips?: string[];
  isPublic?: boolean;
}

export interface VideoFilters {
  category?: VideoCategory;
  difficulty?: DifficultyLevel;
  muscleGroups?: string[];
  equipment?: string[];
  tags?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
}

export enum VideoCategory {
  STRENGTH_TRAINING = 'STRENGTH_TRAINING',
  CARDIO = 'CARDIO',
  MOBILITY = 'MOBILITY',
  FUNCTIONAL = 'FUNCTIONAL',
  YOGA = 'YOGA',
  PILATES = 'PILATES',
  WARM_UP = 'WARM_UP',
  COOL_DOWN = 'COOL_DOWN',
  REHABILITATION = 'REHABILITATION',
  SPORTS_SPECIFIC = 'SPORTS_SPECIFIC',
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export const VIDEO_CATEGORIES = [
  { value: VideoCategory.STRENGTH_TRAINING, label: 'Strength Training' },
  { value: VideoCategory.CARDIO, label: 'Cardio' },
  { value: VideoCategory.MOBILITY, label: 'Mobility' },
  { value: VideoCategory.FUNCTIONAL, label: 'Functional' },
  { value: VideoCategory.YOGA, label: 'Yoga' },
  { value: VideoCategory.PILATES, label: 'Pilates' },
  { value: VideoCategory.WARM_UP, label: 'Warm Up' },
  { value: VideoCategory.COOL_DOWN, label: 'Cool Down' },
  { value: VideoCategory.REHABILITATION, label: 'Rehabilitation' },
  { value: VideoCategory.SPORTS_SPECIFIC, label: 'Sports Specific' },
];

export const DIFFICULTY_LEVELS = [
  { value: DifficultyLevel.BEGINNER, label: 'Beginner', color: 'bg-green-100 text-green-800' },
  {
    value: DifficultyLevel.INTERMEDIATE,
    label: 'Intermediate',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: DifficultyLevel.ADVANCED, label: 'Advanced', color: 'bg-orange-100 text-orange-800' },
  { value: DifficultyLevel.EXPERT, label: 'Expert', color: 'bg-red-100 text-red-800' },
];

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Biceps',
  'Triceps',
  'Legs',
  'Quadriceps',
  'Hamstrings',
  'Calves',
  'Glutes',
  'Core',
  'Abs',
  'Lower Back',
  'Full Body',
  'Cardio',
];

export const EQUIPMENT_OPTIONS = [
  'None',
  'Dumbbells',
  'Barbell',
  'Resistance Bands',
  'Kettlebell',
  'Pull-up Bar',
  'Bench',
  'Cable Machine',
  'Smith Machine',
  'Yoga Mat',
  'Exercise Ball',
  'Foam Roller',
  'Medicine Ball',
  'TRX',
  'Battle Ropes',
  'Rowing Machine',
  'Treadmill',
  'Bike',
];
