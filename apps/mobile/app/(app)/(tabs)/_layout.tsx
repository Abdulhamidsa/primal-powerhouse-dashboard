import { Link, Tabs } from 'expo-router';
import {
  BarbellIcon,
  CalendarCheckIcon,
  ClipboardTextIcon,
  HouseIcon,
  ShoppingBagIcon,
} from 'phosphor-react-native';
import { View } from 'react-native';
import { useTheme } from '@/features/theme/hooks/useTheme';

const tabs = [
  { name: 'index', title: 'Today', icon: HouseIcon },
  { name: 'plan', title: 'Plan', icon: CalendarCheckIcon },
  { name: 'check-ins', title: 'Check-ins', icon: ClipboardTextIcon },
  { name: 'training', title: 'Train', icon: BarbellIcon },
  { name: 'shopping', title: 'Shop', icon: ShoppingBagIcon },
] as const;

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, paddingRight: 16 }}>
            <Link href="/chat" style={{ color: colors.text, padding: 10 }}>
              Chat
            </Link>
            <Link href="/profile" style={{ color: colors.text, padding: 10 }}>
              Profile
            </Link>
          </View>
        ),
      }}
    >
      {tabs.map(({ name, title, icon: TabIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} size={24} weight={focused ? 'fill' : 'regular'} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
