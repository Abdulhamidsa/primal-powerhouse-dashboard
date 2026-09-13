import { expect, it } from 'vitest';
import { buildWeightChart } from './weightChart';

it('plots one recorded weight in the center and ignores missing weights', () => {
  const chart = buildWeightChart([
    { dayDate: '2026-09-10', weightKg: null, completionPercentage: 50, isComplete: false },
    { dayDate: '2026-09-11', weightKg: 80, completionPercentage: 100, isComplete: true },
  ], 320, 160);
  expect(chart?.points).toEqual([{ x: 160, y: 80, dayDate: '2026-09-11', weightKg: 80 }]);
});

it('places higher weights above lower weights and limits the chart to 14 entries', () => {
  const history = Array.from({ length: 16 }, (_, index) => ({
    dayDate: `2026-09-${String(index + 1).padStart(2, '0')}`,
    weightKg: 70 + index,
    completionPercentage: 100,
    isComplete: true,
  }));
  const chart = buildWeightChart(history, 320, 160)!;
  expect(chart.points).toHaveLength(14);
  expect(chart.points[0].x).toBe(18);
  expect(chart.points.at(-1)?.x).toBe(302);
  expect(chart.points.at(-1)!.y).toBeLessThan(chart.points[0].y);
});
