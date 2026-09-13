import { useConnection } from '@/features/resources/hooks/useConnection';
import { useTheme } from '@/features/theme/hooks/useTheme';
import type { PropsWithChildren, RefObject } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export const colors = {
  background: '#0d0d0d',
  surface: '#141414',
  border: '#262626',
  text: '#f5f5f5',
  muted: '#9ca3af',
  accent: '#b86a4e',
};

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollRef?: RefObject<ScrollView | null>;
}>;

export function Screen({ title, subtitle, children, refreshing = false, onRefresh, scrollRef }: ScreenProps) {
  const { colors: themeColors } = useTheme();
  const { offline } = useConnection();
  return (
    <KeyboardAvoidingView style={[styles.fill, { backgroundColor: themeColors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.accent} /> : undefined}
      >
        {offline ? <Text accessibilityRole="alert" style={styles.error}>Offline · saved data is available; connect to submit changes.</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({ children }: PropsWithChildren) {
  const { colors: themeColors } = useTheme();
  return <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>{children}</View>;
}

export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Copy({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={muted ? styles.muted : styles.text}>{children}</Text>;
}

export function Button({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: secondary ? themeColors.border : themeColors.accent }, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.buttonText, { color: secondary ? themeColors.text : themeColors.onAccent }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChange, secure = false, numeric = false, multiline = false }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; numeric?: boolean; multiline?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        autoCapitalize="none"
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && { minHeight: 100 }]}
      />
    </View>
  );
}

export function Status({ loading, error, notice, cachedAt }: { loading?: boolean; error?: unknown; notice?: string; cachedAt?: string | null }) {
  return (
    <>
      {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading" /> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error instanceof Error ? error.message : String(error)}</Text> : null}
      {notice ? <Copy>{notice}</Copy> : null}
      {cachedAt ? <Copy muted>Saved data · {new Date(cachedAt).toLocaleString()}</Copy> : null}
    </>
  );
}

export function Choices({ label, options, value, onChange, disabled = false }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <View style={styles.row}>
        {options.map(option => (
          <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: value === option, disabled }} disabled={disabled} onPress={() => onChange(option)} style={[styles.chip, value === option && { backgroundColor: themeColors.accent }, disabled && { opacity: 0.45 }]}>
            <Text style={styles.text}>{option.replaceAll('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  page: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 29, fontWeight: '700' },
  card: { padding: 20, borderRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 14 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  text: { color: colors.text, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  button: { backgroundColor: colors.accent, minHeight: 48, borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, minHeight: 48, padding: 12, color: colors.text, fontSize: 16 },
  error: { color: '#ffaaaa', fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 12, borderRadius: 16, backgroundColor: colors.border, minHeight: 44 },
});
