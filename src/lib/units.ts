/**
 * Unit conversion utilities for imperial ↔ metric conversions
 */

// Weight conversions
export const lbsToKg = (lbs: number | null | undefined): number | null => {
  if (lbs === null || lbs === undefined) return null;
  return parseFloat((lbs * 0.453592).toFixed(1));
};

export const kgToLbs = (kg: number | null | undefined): number | null => {
  if (kg === null || kg === undefined) return null;
  return parseFloat((kg / 0.453592).toFixed(1));
};

// Height conversions
export const inchesToCm = (inches: number | null | undefined): number | null => {
  if (inches === null || inches === undefined) return null;
  return parseFloat((inches * 2.54).toFixed(1));
};

export const cmToInches = (cm: number | null | undefined): number | null => {
  if (cm === null || cm === undefined) return null;
  return parseFloat((cm / 2.54).toFixed(1));
};

// Feet + Inches to CM
export const feetInchesToCm = (feet: number, inches: number): number => {
  const totalInches = feet * 12 + inches;
  return parseFloat((totalInches * 2.54).toFixed(1));
};

// CM to Feet + Inches
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = parseFloat((totalInches % 12).toFixed(1));
  return { feet, inches };
};

// Format weight for display
export const formatWeight = (kg: number | null | undefined): string => {
  if (kg === null || kg === undefined) return 'N/A';
  return `${kg} kg`;
};

// Format height for display
export const formatHeight = (cm: number | null | undefined): string => {
  if (cm === null || cm === undefined) return 'N/A';
  const { feet, inches } = cmToFeetInches(cm);
  return `${cm} cm (${feet}'${inches}")`;
};
