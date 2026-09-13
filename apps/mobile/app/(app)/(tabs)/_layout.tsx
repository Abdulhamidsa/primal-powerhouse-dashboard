import { useTheme, useRestoreTheme } from '@/features/theme/hooks/useTheme';
import { Tabs, Link } from 'expo-router';
import { Text, View } from 'react-native';
export default function TabLayout() {
  const { colors } = useTheme();
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarActiveTintColor: colors.accent, headerRight: () => <View style={{ flexDirection: 'row', gap: 16, paddingRight: 16 }}><Link href="/chat" style={{ color: colors.text, padding: 10 }}>Chat</Link><Link href="/profile" style={{ color: colors.text, padding: 10 }}>Profile</Link></View> }}>{[['index','Today','◉'],['plan','Plan','≡'],['check-ins','Check-ins','✓'],['training','Train','↗'],['shopping','Shop','▤']].map(([name,title,icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>{icon}</Text> }} />)}</Tabs>;
}
