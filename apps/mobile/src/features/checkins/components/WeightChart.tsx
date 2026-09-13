import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/features/theme/hooks/useTheme';
import type { WeightChartModel } from '../types/checkins.types';

export function WeightChart({ model }: { model: WeightChartModel }) {
  const { colors } = useTheme();
  const first = model.points[0];
  const last = model.points.at(-1)!;
  return (
    <Svg accessibilityLabel={`Weight chart from ${first.weightKg} to ${last.weightKg} kilograms`} width="100%" height={model.height} viewBox={`0 0 ${model.width} ${model.height}`}>
      <Line x1="18" y1={model.height - 22} x2={model.width - 18} y2={model.height - 22} stroke={colors.border} strokeWidth="1" />
      <Polyline points={model.points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke={colors.accent} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {model.points.map(point => <Circle key={point.dayDate} cx={point.x} cy={point.y} r="4" fill={colors.accent} />)}
      <SvgText x="18" y={model.height - 5} fontSize="10" fill={colors.muted}>{first.dayDate.slice(5)}</SvgText>
      <SvgText x={model.width - 18} y={model.height - 5} textAnchor="end" fontSize="10" fill={colors.muted}>{last.dayDate.slice(5)}</SvgText>
      <SvgText x="18" y="12" fontSize="10" fill={colors.muted}>{model.maxWeight.toFixed(1)} kg</SvgText>
      <SvgText x="18" y={model.height - 28} fontSize="10" fill={colors.muted}>{model.minWeight.toFixed(1)} kg</SvgText>
    </Svg>
  );
}
