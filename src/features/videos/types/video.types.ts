export type VideoCoachOption = {
  id: string;
  name: string | null;
  email: string | null;
};

export type VideoCoachOptionsResponse = {
  coaches: VideoCoachOption[];
};
