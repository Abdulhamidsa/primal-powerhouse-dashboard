import type { FaqEntry } from '@/features/learn/types/learn.types';

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'protein', question: 'How much protein should I eat?',
    answer: 'Your target depends on body size, goal, and total intake. The practical priority is reaching your assigned target consistently and spreading useful servings across the day.',
    handbookPageId: 'fuel-macros', handbookLabel: 'Fuel · The plate has jobs',
  },
  {
    id: 'overnight-weight', question: 'Why did my weight increase overnight?',
    answer: 'A single jump is usually water, stored carbohydrate, sodium, food volume, stress, or normal hormonal variation. Record it and judge the multi-day trend instead.',
    handbookPageId: 'track-fluctuations', handbookLabel: 'Track · Signal versus noise',
  },
  {
    id: 'swap-exercises', question: 'Can I swap exercises?',
    answer: 'Yes when pain, equipment, or poor fit makes a movement unproductive. Keep the same training purpose and progression target instead of swapping only for novelty.',
    handbookPageId: 'train-overload', handbookLabel: 'Train · Earn the next step',
  },
  {
    id: 'miss-workout', question: 'What happens if I miss a workout?',
    answer: 'Nothing needs to be punished or doubled. Continue with the next sensible session, protect the weekly structure, and look for a pattern only if misses become frequent.',
    handbookPageId: 'foundation-consistency', handbookLabel: 'Foundation · Consistency',
  },
  {
    id: 'supplements', question: 'Do I need supplements?',
    answer: 'Most progress comes from training, food, sleep, and adherence. Supplements may fill a specific gap, but they should not be used to disguise an inconsistent foundation.',
  },
  {
    id: 'sore', question: 'Should I train when I’m sore?',
    answer: 'Mild soreness can improve as you warm up. Change course when pain is sharp, movement is altered, or fatigue prevents stable technique.',
    handbookPageId: 'recover-fatigue', handbookLabel: 'Recover · Read the signals',
  },
  {
    id: 'sleep', question: 'How much sleep do I need?',
    answer: 'Most adults perform best with roughly seven to nine hours. Consistent timing and sleep quality matter alongside the total duration.',
    handbookPageId: 'recover-sleep', handbookLabel: 'Recover · Protect the night',
  },
  {
    id: 'outside-plan', question: 'What if I eat outside my meal plan?',
    answer: 'One flexible meal does not erase the week. Make a reasonable choice, enjoy it without compensation, and return to your normal rhythm at the next meal.',
    handbookPageId: 'fuel-hydration', handbookLabel: 'Fuel · Daily rhythm',
  },
  {
    id: 'progress-speed', question: 'How quickly should I expect progress?',
    answer: 'Strength, skill, energy, measurements, and appearance change on different timelines. Review several weeks of evidence rather than demanding proof from every day.',
    handbookPageId: 'foundation-progress', handbookLabel: 'Foundation · The long view',
  },
];
