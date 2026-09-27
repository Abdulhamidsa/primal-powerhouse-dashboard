export type PasswordStrength = 'Weak' | 'Good' | 'Strong';

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  const lengthScore = password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0;
  const diversityScore = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(pattern => pattern.test(password)).length;
  const hasRepeatedPattern = /(.)\1{2,}|(123|abc|qwe|password|letmein|welcome)/i.test(password);
  const score = lengthScore + diversityScore - (hasRepeatedPattern ? 1 : 0);
  if (score >= 5) return 'Strong';
  if (score >= 2) return 'Good';
  return 'Weak';
}
