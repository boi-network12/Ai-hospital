import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabs from '@/components/customs/CustomTabs';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabs {...props} />}
      screenOptions={{
        headerShown: false, // globally hide header
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="discovery/index"
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ headerShown: false }}
      />
    </Tabs>
  );
}
