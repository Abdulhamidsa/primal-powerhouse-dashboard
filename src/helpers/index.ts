const calculateAge = (birthDate?: Date) => {
  if (!birthDate) return 'N/A';
  const today = new Date();
  return today.getFullYear() - birthDate.getFullYear();
};

const calculateBMI = (height?: number, weight?: number) => {
  if (!height || !weight) return 'N/A';
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${remainingMinutes}min`;
};
export { calculateAge, calculateBMI, formatDuration };
