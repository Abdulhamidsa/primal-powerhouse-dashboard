import type { HandbookChapter, HandbookPage } from '@/features/learn/types/learn.types';

export const HANDBOOK_CHAPTERS: HandbookChapter[] = [
  { id: 'foundation', number: '01', label: 'Foundation', firstPageId: 'foundation-open' },
  { id: 'train', number: '02', label: 'Train', firstPageId: 'train-open' },
  { id: 'fuel', number: '03', label: 'Fuel', firstPageId: 'fuel-open' },
  { id: 'recover', number: '04', label: 'Recover', firstPageId: 'recover-open' },
  { id: 'track', number: '05', label: 'Track', firstPageId: 'track-open' },
  { id: 'adapt', number: '06', label: 'Adapt', firstPageId: 'adapt-open' },
];

export const HANDBOOK_PAGES: HandbookPage[] = [
  {
    id: 'contents', chapter: 'contents', chapterLabel: 'Contents', variant: 'contents',
    eyebrow: 'Volume 01', title: 'Contents', deck: 'Six connected practices. One repeatable system.',
  },
  {
    id: 'foundation-open', chapter: 'foundation', chapterNumber: '01', chapterLabel: 'Foundation', variant: 'chapter',
    eyebrow: 'Begin here', title: 'Build the base before you chase the result.',
    deck: 'Progress becomes predictable when the fundamentals become non-negotiable.',
  },
  {
    id: 'foundation-progress', chapter: 'foundation', chapterNumber: '01', chapterLabel: 'Foundation', variant: 'stat',
    eyebrow: 'The long view', title: 'Measure the trend, not the mood.', stat: '1%', statLabel: 'better decisions, repeated',
    body: ['A useful goal gives direction. A useful process tells you what to do today.', 'Judge progress across weeks, not isolated mornings. Strength, energy, habits, and measurements tell a fuller story together.'],
    note: 'Expectation: visible change is rarely linear. Your response should be.',
  },
  {
    id: 'foundation-consistency', chapter: 'foundation', chapterNumber: '01', chapterLabel: 'Foundation', variant: 'principle',
    eyebrow: 'Principle 01', title: 'Consistency wins quietly.', quote: 'The plan only works when real life can hold it.',
    body: ['The best week is not the hardest week. It is the week you can repeat without needing to recover from the plan itself.', 'Build a minimum standard for difficult days: one planned meal, one honest set, one early night. Keep the chain alive.'],
  },
  {
    id: 'train-open', chapter: 'train', chapterNumber: '02', chapterLabel: 'Train', variant: 'chapter',
    eyebrow: 'Create the signal', title: 'Build strength with intent.', deck: 'Training is a measured stimulus—not a contest to become as tired as possible.',
  },
  {
    id: 'train-overload', chapter: 'train', chapterNumber: '02', chapterLabel: 'Train', variant: 'diagram',
    eyebrow: 'Progressive overload', title: 'Earn the next step.', deck: 'Progress can be more load, more clean reps, better control, or the same work at lower effort.',
    items: [
      { title: 'Repeat', detail: 'Own the current movement and range.' },
      { title: 'Prove', detail: 'Reach the top of the rep target with control.' },
      { title: 'Progress', detail: 'Add the smallest useful challenge.' },
      { title: 'Record', detail: 'Keep evidence for the next session.' },
    ],
    note: 'Technique is the gate. Load passes through only when the rep still looks intentional.',
  },
  {
    id: 'train-intensity', chapter: 'train', chapterNumber: '02', chapterLabel: 'Train', variant: 'checklist',
    eyebrow: 'Effort, volume, technique', title: 'Hard enough. Clean enough. Repeatable enough.',
    items: [
      { title: 'RIR 2', detail: 'Finish most working sets with roughly two strong reps available.' },
      { title: 'Stable reps', detail: 'Keep setup, range, and tempo recognisable from first rep to last.' },
      { title: 'Useful volume', detail: 'Add sets only when they improve the signal, not merely the fatigue.' },
      { title: 'Progress slowly', detail: 'Change one variable at a time so you know what worked.' },
    ],
  },
  {
    id: 'fuel-open', chapter: 'fuel', chapterNumber: '03', chapterLabel: 'Fuel', variant: 'chapter',
    eyebrow: 'Supply the work', title: 'Eat for the direction you chose.', deck: 'Nutrition turns intention into available energy, recovery, and tissue.',
  },
  {
    id: 'fuel-macros', chapter: 'fuel', chapterNumber: '03', chapterLabel: 'Fuel', variant: 'diagram',
    eyebrow: 'The plate has jobs', title: 'Calories set direction. Macros shape the journey.',
    items: [
      { title: 'Protein', detail: 'Supports repair, muscle retention, and fullness.' },
      { title: 'Carbohydrate', detail: 'Powers hard training and restores performance.' },
      { title: 'Fat', detail: 'Supports health, hormones, and satisfying meals.' },
      { title: 'Calories', detail: 'Determine whether body mass trends up, down, or holds.' },
    ],
    note: 'A repeatable target beats a perfect target followed twice.',
  },
  {
    id: 'fuel-hydration', chapter: 'fuel', chapterNumber: '03', chapterLabel: 'Fuel', variant: 'checklist',
    eyebrow: 'Daily rhythm', title: 'Make good fueling boringly reliable.',
    items: [
      { title: 'Anchor meals', detail: 'Use familiar meals at predictable times.' },
      { title: 'Protein first', detail: 'Give every main meal a clear protein source.' },
      { title: 'Hydrate early', detail: 'Do not wait for training to begin catching up.' },
      { title: 'Plan flexibility', detail: 'Leave room for social meals without abandoning the day.' },
    ],
  },
  {
    id: 'recover-open', chapter: 'recover', chapterNumber: '04', chapterLabel: 'Recover', variant: 'chapter',
    eyebrow: 'Allow the change', title: 'You do not grow while training.', deck: 'The session creates a reason to adapt. Recovery gives your body permission.',
  },
  {
    id: 'recover-sleep', chapter: 'recover', chapterNumber: '04', chapterLabel: 'Recover', variant: 'stat',
    eyebrow: 'The multiplier', title: 'Protect the night.', stat: '7–9', statLabel: 'hours is the useful target range',
    body: ['Sleep supports performance, appetite regulation, learning, and repair. It makes every other decision easier to execute.', 'Prioritise a consistent wake time, a darker room, and a short repeatable wind-down before chasing elaborate sleep hacks.'],
  },
  {
    id: 'recover-fatigue', chapter: 'recover', chapterNumber: '04', chapterLabel: 'Recover', variant: 'article',
    eyebrow: 'Read the signals', title: 'Soreness is information—not a score.',
    body: ['Local soreness can be normal after a new stimulus. Sharp pain, worsening movement, or fatigue that changes your technique deserves a different response.', 'Rest days are part of the program. Light movement, food, hydration, and lower stress often outperform forcing another hard session.'],
    note: 'When performance, motivation, sleep, and soreness all decline together, reduce the demand before adding more discipline.',
  },
  {
    id: 'track-open', chapter: 'track', chapterNumber: '05', chapterLabel: 'Track', variant: 'chapter',
    eyebrow: 'Collect evidence', title: 'What gets observed can be adjusted.', deck: 'Tracking is not judgment. It is how the plan learns what your body is doing.',
  },
  {
    id: 'track-evidence', chapter: 'track', chapterNumber: '05', chapterLabel: 'Track', variant: 'checklist',
    eyebrow: 'Four lenses', title: 'Never let one number tell the whole story.',
    items: [
      { title: 'Bodyweight', detail: 'Use frequent readings to reveal a weekly trend.' },
      { title: 'Photos', detail: 'Match light, distance, pose, and time of day.' },
      { title: 'Measurements', detail: 'Repeat the same landmarks and conditions.' },
      { title: 'Performance', detail: 'Track strength, reps, technique, and recovery.' },
    ],
  },
  {
    id: 'track-fluctuations', chapter: 'track', chapterNumber: '05', chapterLabel: 'Track', variant: 'principle',
    eyebrow: 'Signal versus noise', title: 'One weigh-in is weather.', quote: 'The weekly trend is climate.',
    body: ['Carbohydrate, sodium, hydration, digestion, stress, and menstrual cycles can shift scale weight quickly without representing fat gain.', 'Record the number. Refuse the story. Let enough data accumulate before changing the plan.'],
  },
  {
    id: 'adapt-open', chapter: 'adapt', chapterNumber: '06', chapterLabel: 'Adapt', variant: 'chapter',
    eyebrow: 'Close the loop', title: 'The plan is allowed to change.', deck: 'Adjustment is not failure. It is the final skill that makes progress sustainable.',
  },
  {
    id: 'adapt-review', chapter: 'adapt', chapterNumber: '06', chapterLabel: 'Adapt', variant: 'article',
    eyebrow: 'Review → adjust → repeat', title: 'Change the smallest thing that solves the problem.',
    body: ['A plateau is a prompt to review adherence, recovery, performance, and trend length—not permission to rebuild everything overnight.', 'After a bad week, return to the baseline before compensating. If the evidence is consistent, adjust one lever, define what should happen, and review again.'],
    note: 'The durable athlete is not perfect. They are quick to return, honest in review, and patient with evidence.',
  },
];
