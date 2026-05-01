import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.surface,
        },
        tabBarLabelStyle: {
          color: Colors.textSecondary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'List',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Ionicons name="bookmark-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
