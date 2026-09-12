import { useTheme, useRestoreTheme } from '@/features/theme/hooks/useTheme';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SWRConfig } from 'swr';
import { useAuth, useRestoreAuth } from '@/features/auth/hooks/useAuth';
import { Status } from '@/components/ui';
export default function RootLayout() {
  const { colors } = useTheme();
  useRestoreTheme(); useRestoreAuth(); const auth = useAuth();
  return <SafeAreaProvider><SWRConfig key={auth.session?.user.id ?? 'signed-out'} value={{ provider: () => new Map(), dedupingInterval: 5000, shouldRetryOnError: false }}>{auth.ready ? <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(app)" options={{ headerShown: false }} /><Stack.Screen name="login" options={{ headerShown: false }} /></Stack> : <Status loading />}</SWRConfig></SafeAreaProvider>;
}
