const calculateAge = (birthDate?: Date) => {
  if (!birthDate) return 'N/A';
  const today = new Date();
  return today.getFullYear() - birthDate.getFullYear();
};

const calculateBMI = (height?: number, weight?: number) => {
  if (!height || !weight) return 'N/A';

  // Ensure values are numbers and valid
  const h = Number(height);
  const w = Number(weight);

  if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return 'N/A';

  // Height should be in cm (typically 140-220)
  // If height seems wrong, return N/A
  if (h < 100 || h > 250) return 'N/A';

  // Weight should be in kg (typically 40-200)
  if (w < 30 || w > 300) return 'N/A';

  const heightInMeters = h / 100;
  const bmi = w / (heightInMeters * heightInMeters);

  // BMI should be between 10 and 60 (normal range is 18.5-24.9)
  if (bmi < 10 || bmi > 60) return 'N/A';

  return bmi.toFixed(1);
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${remainingMinutes}min`;
};
export { calculateAge, calculateBMI, formatDuration };
