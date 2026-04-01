import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 22 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2d6a4f',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e8f5e9',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ focused }) => <Icon symbol={focused ? '💚' : '🫀'} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <Icon symbol={focused ? '📖' : '📓'} />,
        }}
      />
      <Tabs.Screen
        name="informations"
        options={{
          title: 'Infos',
          tabBarIcon: ({ focused }) => <Icon symbol={focused ? '💡' : '📄'} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <Icon symbol={focused ? '👤' : '🧑'} />,
        }}
      />
    </Tabs>
  );
}
