export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  videoUrl: string;
  muscleGroups?: string;
}

export interface TrainingVideoAssignment {
  id: string;
  assignedDate: string;
  scheduledTime?: string;
  isCompleted: boolean;
  video: TrainingVideo;
}

export interface TrainingCoachInfo {
  name: string;
  email: string;
}

export interface TrainingCoachResponse {
  coach: TrainingCoachInfo;
}
