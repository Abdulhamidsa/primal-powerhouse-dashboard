import type { Insights, WeightChartModel } from '../types/checkins.types';

export function buildWeightChart(history: Insights['history'], width: number, height = 160): WeightChartModel | null {
  const source = history
    .filter((item): item is typeof item & { weightKg: number } => Number.isFinite(item.weightKg))
    .slice(-14);
  if (!source.length) return null;

  const observedMin = Math.min(...source.map(item => item.weightKg));
  const observedMax = Math.max(...source.map(item => item.weightKg));
  const minWeight = observedMin === observedMax ? observedMin - 1 : observedMin;
  const maxWeight = observedMin === observedMax ? observedMax + 1 : observedMax;
  const horizontalPadding = 18;
  const verticalPadding = 22;
  const chartWidth = Math.max(1, width - horizontalPadding * 2);
  const chartHeight = Math.max(1, height - verticalPadding * 2);

  return {
    width,
    height,
    minWeight: observedMin,
    maxWeight: observedMax,
    points: source.map((item, index) => ({
      x: source.length === 1 ? width / 2 : horizontalPadding + (index / (source.length - 1)) * chartWidth,
      y: verticalPadding + ((maxWeight - item.weightKg) / (maxWeight - minWeight)) * chartHeight,
      dayDate: item.dayDate,
      weightKg: item.weightKg,
    })),
  };
}
