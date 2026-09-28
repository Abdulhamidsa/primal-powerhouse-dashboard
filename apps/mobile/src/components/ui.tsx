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
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollRef?: RefObject<ScrollView | null>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onContentSizeChange?: (contentWidth: number, contentHeight: number) => void;
  scrollEventThrottle?: number;
}>;

export function Screen({
  title,
  subtitle,
  children,
  refreshing = false,
  onRefresh,
  scrollRef,
  onScroll,
  onScrollBeginDrag,
  onContentSizeChange,
  scrollEventThrottle,
}: ScreenProps) {
  const { tokens } = useTheme();
  const { offline } = useConnection();
  return (
    <KeyboardAvoidingView style={[styles.fill, { backgroundColor: tokens.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} /> : undefined}
      >
        {offline ? <Text accessibilityRole="alert" style={[styles.error, { color: tokens.warning }]}>Offline · saved data is available; connect to submit changes.</Text> : null}
        <Text accessibilityRole="header" style={[styles.title, { color: tokens.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.muted, { color: tokens.textMuted }]}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({ children }: PropsWithChildren) {
  const { tokens } = useTheme();
  return <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.border }]}>{children}</View>;
}

export function Label({ children }: PropsWithChildren) {
  const { tokens } = useTheme();
  return <Text style={[styles.label, { color: tokens.textMuted }]}>{children}</Text>;
}

export function Copy({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  const { tokens } = useTheme();
  return <Text style={[muted ? styles.muted : styles.text, { color: muted ? tokens.textMuted : tokens.text }]}>{children}</Text>;
}

export function Button({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: secondary ? tokens.surfaceElevated : tokens.accent, borderColor: secondary ? tokens.border : tokens.accent }, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.buttonText, { color: secondary ? tokens.text : tokens.onAccent }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChange, secure = false, numeric = false, multiline = false }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; numeric?: boolean; multiline?: boolean }) {
  const { tokens } = useTheme();
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
        placeholderTextColor={tokens.placeholder}
        style={[styles.input, { backgroundColor: tokens.inputBackground, borderColor: tokens.inputBorder, color: tokens.text }, multiline && { minHeight: 100 }]}
      />
    </View>
  );
}

export function Status({ loading, error, notice, cachedAt }: { loading?: boolean; error?: unknown; notice?: string; cachedAt?: string | null }) {
  const { tokens } = useTheme();
  return (
    <>
      {loading ? <ActivityIndicator color={tokens.accent} accessibilityLabel="Loading" /> : null}
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: tokens.error }]}>{error instanceof Error ? error.message : String(error)}</Text> : null}
      {notice ? <Copy>{notice}</Copy> : null}
      {cachedAt ? <Copy muted>Saved data · {new Date(cachedAt).toLocaleString()}</Copy> : null}
    </>
  );
}

export function Choices({ label, options, value, onChange, disabled = false }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <View style={styles.row}>
        {options.map(option => (
          <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: value === option, disabled }} disabled={disabled} onPress={() => onChange(option)} style={[styles.chip, { backgroundColor: value === option ? tokens.accentMuted : tokens.surfaceElevated }, value === option && { borderColor: tokens.accent }, disabled && { opacity: 0.45 }]}>
            <Text style={[styles.text, { color: value === option ? tokens.accent : tokens.text }]}>{option.replaceAll('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { fontSize: 29, fontWeight: '700' },
  card: { padding: 20, borderRadius: 28, borderWidth: 1, gap: 14 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  text: { fontSize: 16, lineHeight: 24 },
  muted: { fontSize: 14, lineHeight: 21 },
  button: { minHeight: 48, borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 48, padding: 12, fontSize: 16 },
  error: { fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 12, borderRadius: 16, borderWidth: 1, minHeight: 44 },
});
