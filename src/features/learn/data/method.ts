import type { MethodStage } from '@/features/learn/types/learn.types';

export const METHOD_STAGES: MethodStage[] = [
  {
    id: 'foundation', number: '01', label: 'Foundation',
    statement: 'Build the base before you chase the result.',
    detail: 'Set a repeatable standard for training, food, sleep, and the days that do not go perfectly.',
  },
  {
    id: 'train', number: '02', label: 'Train',
    statement: 'Create a signal worth adapting to.',
    detail: 'Progressive, technically sound training gives the body a clear reason to become stronger.',
  },
  {
    id: 'fuel', number: '03', label: 'Fuel',
    statement: 'Supply the work and the rebuild.',
    detail: 'Energy and nutrients support output in the session and repair after it.',
  },
  {
    id: 'recover', number: '04', label: 'Recover',
    statement: 'Make space for adaptation.',
    detail: 'Sleep, lower stress, and planned rest turn training stress into usable progress.',
  },
  {
    id: 'track', number: '05', label: 'Track',
    statement: 'Replace assumptions with evidence.',
    detail: 'Consistent observations reveal whether the plan is creating the result it promised.',
  },
  {
    id: 'adapt', number: '06', label: 'Adapt',
    statement: 'Change the plan before you get stuck.',
    detail: 'Review the evidence, adjust the smallest useful lever, and begin the loop again.',
  },
];
