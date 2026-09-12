import { useTheme, useRestoreTheme } from '@/features/theme/hooks/useTheme';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNativeLifecycle } from '@/features/chat/hooks/useNativeLifecycle';
export default function AppLayout() {
  const { colors } = useTheme();
  const { session } = useAuth();
  useNativeLifecycle();
  if (!session) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="chat" options={{ title: 'Coach chat' }} /><Stack.Screen name="profile" options={{ title: 'Profile' }} /><Stack.Screen name="privacy" options={{ title: 'Privacy & data' }} /><Stack.Screen name="session/[id]" options={{ title: 'Workout session' }} /><Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} /><Stack.Screen name="video/[id]" options={{ title: 'Video details' }} /></Stack>;
}
