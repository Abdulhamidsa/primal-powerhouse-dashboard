import { themeOptions, themes } from '@primal/theme';
import { CheckIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export function ThemePicker({ userId }: { userId?: string | null }) {
  const { themeId, select } = useTheme(userId);

  return (
    <View style={styles.grid}>
      {themeOptions.map(option => {
        const tokens = themes[option.id];
        const selected = option.id === themeId;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => void select(option.id)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: tokens.card, borderColor: selected ? tokens.accent : tokens.border, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <View style={styles.heading}>
              <Text style={[styles.name, { color: tokens.text }]}>{option.label}</Text>
              {selected ? <CheckIcon color={tokens.accent} size={18} weight="bold" /> : null}
            </View>
            <Text numberOfLines={2} style={[styles.description, { color: tokens.textMuted }]}>{option.description}</Text>
            <View style={[styles.preview, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
              <View style={[styles.previewSurface, { backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }]}>
                <View style={[styles.line, { backgroundColor: tokens.text, width: '70%' }]} />
                <View style={[styles.line, { backgroundColor: tokens.textMuted, width: '48%' }]} />
                <View style={[styles.accent, { backgroundColor: tokens.accent }]} />
              </View>
            </View>
            {option.isDefault ? <Text style={[styles.default, { color: tokens.accent }]}>Default</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', minHeight: 176, borderWidth: 1, borderRadius: 18, padding: 12, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  description: { fontSize: 11, lineHeight: 15, minHeight: 30 },
  preview: { height: 66, borderWidth: 1, borderRadius: 10, padding: 7 },
  previewSurface: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 7, justifyContent: 'center', gap: 5 },
  line: { height: 4, borderRadius: 3 },
  accent: { width: '38%', height: 10, borderRadius: 5, marginTop: 3 },
  default: { fontSize: 11, fontWeight: '600' },
});
