// 'use client';

// import React, { useState } from 'react';
// // import { ChefHatIcon as ChefHat, ImageIcon as ImageIcon, StackIcon as Layers3, ArrowsClockwiseIcon as RefreshCw, FloppyDiskIcon as Save } from '@phosphor-icons/react/ssr';
// import useMealGenerator from '@/features/meals/hooks/useMealGenerator';
// import type {
//   MealType,
// //   GeneratedMeal,
// //   MatchedIngredient,
//   MealImageProvider,
//   MealImageQualityProfile,
// } from '@/types/meal';
// import useGeneratedIngredientTotals from '@/features/meals/hooks/useGeneratedIngredientTotals';
// // import GeneratedIngredientsSummary from '@/features/meals/components/GeneratedIngredientsSummary';
// import useSaveGeneratedMealTemplate from '@/features/meals/hooks/useSaveGeneratedMealTemplate';

// interface MealGeneratorPanelProps {
//   onTemplateSaved?: () => void;
// }

// export default function MealGeneratorPanel({ onTemplateSaved }: MealGeneratorPanelProps) {
// //   const [calories, setCalories] = useState<number>(500);
// //   const [protein, setProtein] = useState<number>(30);
// //   const [mealCount, setMealCount] = useState<number>(10);
// //   const [type, setType] = useState<MealType>('dinner');
// //   const [generateImages, setGenerateImages] = useState(false);
// //   const [imageProvider, setImageProvider] = useState<MealImageProvider>('azure');
// //   const [imageQualityProfile, setImageQualityProfile] = useState<MealImageQualityProfile>('balanced');
// //   const [imageCheckpoint, setImageCheckpoint] = useState('');
// //   const [saveNotice, setSaveNotice] = useState('');

// //   const { generate, loading, error, results, reset } = useMealGenerator();
// //   const { saveMeal, getMealStatus, getMealError } = useSaveGeneratedMealTemplate();
// //   const ingredientTotals = useGeneratedIngredientTotals(results);

// //   const onSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     try {
// //       await generate({
// //         calories,
// //         protein,
// //         type,
// //         mealCount,
// //         generateImages,
// //         imageProvider,
// //         imageQualityProfile,
// //         imageCheckpoint: imageCheckpoint.trim() || undefined,
// //       });
// //     } catch {
// //       // handled in hook
// //     }
// //   };

// //   const onSaveTemplate = async (meal: GeneratedMeal, index: number) => {
// //     const firstAttempt = await saveMeal(meal, index, false);

// //     if (firstAttempt.success) {
// //       setSaveNotice(`Saved '${meal.name}' to All Meals templates.`);
// //       onTemplateSaved?.();
// //       return;
// //     }

// //     if (firstAttempt.duplicate) {
// //       const shouldOverwrite = window.confirm(
// //         `A template named '${meal.name}' already exists for this meal type. Save another one anyway?`,
// //       );

// //       if (!shouldOverwrite) {
// //         return;
// //       }

// //       const secondAttempt = await saveMeal(meal, index, true);
// //       if (secondAttempt.success) {
// //         setSaveNotice(`Saved '${meal.name}' to All Meals templates.`);
// //         onTemplateSaved?.();
// //       }
// //     }
// //   };

//   return (
//     <section className="card-base overflow-hidden">
//       {/* <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-3 sm:px-5">
//         <div className="flex items-center gap-2 text-[var(--color-text)]">
//           <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5">
//             <ChefHat aria-hidden="true" focusable="false" className="h-4 w-4 text-[var(--color-accent)]" />
//           </div>
//           <div>
//             <h3 className="text-sm font-semibold">AI Meal Generator</h3>
//             <p className="text-xs text-[var(--color-text-muted)]">Creative templates from DB-safe ingredients only</p>
//           </div>
//         </div>
//       </div> */}
//       {/*
//       <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7 sm:p-5">
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">Calories target</label>
//           <input
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             type="number"
//             value={calories}
//             onChange={e => setCalories(Number(e.target.value))}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">Protein target (g)</label>
//           <input
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             type="number"
//             value={protein}
//             onChange={e => setProtein(Number(e.target.value))}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">Meal type</label>
//           <select
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             value={type}
//             onChange={e => setType(e.target.value as MealType)}
//           >
//             <option value="breakfast">Breakfast</option>
//             <option value="lunch">Lunch</option>
//             <option value="dinner">Dinner</option>
//             <option value="snack">Snack</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">Meals to generate</label>
//           <input
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             type="number"
//             min={1}
//             max={10}
//             value={mealCount}
//             onChange={e => setMealCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
//           />
//         </div>
//         <div className="flex flex-col gap-2">
//           <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
//             <input
//               className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-accent)]"
//               type="checkbox"
//               checked={generateImages}
//               onChange={e => setGenerateImages(e.target.checked)}
//             />
//             <ImageIcon aria-hidden="true" focusable="false" className="h-4 w-4 text-[var(--color-text-muted)]" />
//             <span>Generate images</span>
//           </label>
//           <div className="flex items-center gap-2">
//             <button
//               type="submit"
//               className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
//               disabled={loading}
//             >
//               <RefreshCw aria-hidden="true" focusable="false" className="h-4 w-4" />
//               {loading ? 'Generating...' : 'Generate'}
//             </button>
//             <button
//               type="button"
//               className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
//               onClick={reset}
//             >
//               <RefreshCw aria-hidden="true" focusable="false" className="h-4 w-4" />
//               Reset
//             </button>
//           </div>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">Image provider</label>
//           <select
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             value={imageProvider}
//             onChange={e => setImageProvider(e.target.value as MealImageProvider)}
//             disabled={!generateImages}
//           >
//             <option value="azure">Azure</option>
//             {process.env.NODE_ENV === 'development' && <option value="local-sd">Local Stable Diffusion</option>}
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">Image quality</label>
//           <select
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             value={imageQualityProfile}
//             onChange={e => setImageQualityProfile(e.target.value as MealImageQualityProfile)}
//             disabled={!generateImages}
//           >
//             <option value="fast">Fast</option>
//             <option value="balanced">Balanced</option>
//             <option value="high">High</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-[var(--color-text-muted)]">SD checkpoint (optional)</label>
//           <input
//             className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
//             type="text"
//             placeholder="realisticVisionV60B1_v51HyperVAE"
//             value={imageCheckpoint}
//             onChange={e => setImageCheckpoint(e.target.value)}
//             disabled={!generateImages || imageProvider !== 'local-sd'}
//           />
//         </div>
//       </form> */}

//       {/* {error && (
//         <div className="mx-4 mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:mx-5">
//           {error}
//         </div>
//       )}

//       {saveNotice && (
//         <div className="mx-4 mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 sm:mx-5">
//           {saveNotice}
//         </div>
//       )}

//       {results && (
//         <div className="border-t border-[var(--color-border)] p-4 sm:p-5">
//           <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
//             <Layers3 aria-hidden="true" focusable="false" className="h-4 w-4 text-[var(--color-accent)]" />
//             Generated Meals
//           </h4>
//           {results.length === 0 && (
//             <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
//               No DB-only meals matched this request. Regenerate to try a new candidate set.
//             </div>
//           )}
//           <ul className="mt-3 space-y-3">
//             {results.map((m: GeneratedMeal, idx: number) => (
//               <li
//                 key={idx}
//                 className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3 transition-colors hover:bg-[var(--color-surface)]"
//               >
//                 <div className="font-medium text-[var(--color-text)]">
//                   {m.name} — {m.macros.calories} kcal
//                 </div>
//                 <div className="mt-1 text-sm text-[var(--color-text-muted)]">Ingredients:</div>
//                 <ul className="mt-1 text-sm text-[var(--color-text)]">
//                   {m.ingredients.map((ing: MatchedIngredient, i: number) => (
//                     <li key={i}>
//                       {ing.displayName ?? ing.name} — {ing.grams} g
//                     </li>
//                   ))}
//                 </ul>
//                 <div className="mt-3 flex items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={() => onSaveTemplate(m, idx)}
//                     disabled={getMealStatus(m, idx) === 'saving' || getMealStatus(m, idx) === 'saved'}
//                     className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-60"
//                   >
//                     <Save aria-hidden="true" focusable="false" className="h-3.5 w-3.5" />
//                     {getMealStatus(m, idx) === 'saving' && 'Saving...'}
//                     {getMealStatus(m, idx) === 'saved' && 'Saved'}
//                     {(getMealStatus(m, idx) === 'idle' || getMealStatus(m, idx) === 'error') && 'Save Template'}
//                   </button>
//                   {getMealError(m, idx) && <span className="text-xs text-red-300">{getMealError(m, idx)}</span>}
//                 </div>
//               </li>
//             ))}
//           </ul>
//           <GeneratedIngredientsSummary totals={ingredientTotals} />
//         </div>
//       )} */}
//     </section>
//   );
// }
