import { accentThemeOptions, accentThemes, composeTheme } from '@primal/theme';
import { CheckIcon, CaretDownIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export function AppearancePicker({ userId }: { userId?: string | null }) {
  const { mode, accentTheme, tokens, setMode, setAccentTheme } = useTheme(userId);
  const [open, setOpen] = useState(false);
  const selected = accentThemeOptions.find(option => option.id === accentTheme) ?? accentThemeOptions[0];
  const activeAccent = accentThemes[accentTheme];

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: tokens.text }]}>Mode</Text>
      <View style={[styles.segmented, { borderColor: tokens.border, backgroundColor: tokens.inputBackground }]}>
        {(['dark', 'light'] as const).map(option => {
          const selectedMode = mode === option;
          return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: selectedMode }} onPress={() => void setMode(option)} style={[styles.segment, selectedMode && { backgroundColor: tokens.accent }]}><Text style={[styles.segmentText, { color: selectedMode ? tokens.onAccent : tokens.textMuted }]}>{option === 'dark' ? 'Dark' : 'Light'}</Text></Pressable>;
        })}
      </View>

      <Text style={[styles.label, { color: tokens.text }]}>Accent</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={[styles.trigger, { backgroundColor: tokens.inputBackground, borderColor: tokens.inputBorder }]}>
        <View style={styles.swatches}>{[activeAccent.accent, activeAccent.accentHover, activeAccent.chartSecondary].map(color => <View key={color} style={[styles.swatch, { backgroundColor: color }]} />)}</View>
        <Text style={[styles.triggerText, { color: tokens.text }]}>{selected.label}</Text>
        <CaretDownIcon color={tokens.iconMuted} size={17} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: tokens.overlay }]} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: tokens.surfaceElevated, borderColor: tokens.border }]} onPress={event => event.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: tokens.borderStrong }]} />
            <Text style={[styles.sheetTitle, { color: tokens.text }]}>Choose an accent</Text>
            <View style={styles.grid}>
              {accentThemeOptions.map(option => {
                const preview = composeTheme(mode, option.id);
                const accent = accentThemes[option.id];
                const selectedAccent = accentTheme === option.id;
                return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: selectedAccent }} onPress={() => { void setAccentTheme(option.id); setOpen(false); }} style={[styles.option, { backgroundColor: preview.card, borderColor: selectedAccent ? preview.accent : preview.border }]}>
                  <View style={styles.optionTop}><View style={styles.swatches}>{[accent.accent, accent.chartSecondary].map(color => <View key={color} style={[styles.swatch, { backgroundColor: color }]} />)}</View>{selectedAccent ? <CheckIcon color={preview.accent} size={17} weight="bold" /> : null}</View>
                  <Text style={[styles.optionText, { color: preview.text }]}>{option.label}</Text>
                </Pressable>;
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 }, label: { fontSize: 14, fontWeight: '700', marginTop: 4 }, segmented: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 14 }, segment: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 9 }, segmentText: { fontSize: 14, fontWeight: '700' }, trigger: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, triggerText: { flex: 1, fontSize: 15, fontWeight: '600' }, swatches: { flexDirection: 'row', gap: 4 }, swatch: { width: 14, height: 14, borderRadius: 7 }, backdrop: { flex: 1, justifyContent: 'flex-end' }, sheet: { borderWidth: 1, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, gap: 14 }, handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 }, sheetTitle: { fontSize: 18, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, option: { width: '48%', borderWidth: 1, borderRadius: 14, padding: 12, gap: 9 }, optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionText: { fontSize: 14, fontWeight: '700' },
});
