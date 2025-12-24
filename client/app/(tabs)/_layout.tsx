import React, { useEffect } from 'react';
import { router, Tabs } from 'expo-router';
import CustomTabs from '@/components/customs/CustomTabs';
import { useAuth } from '@/Hooks/authHook.d';
import { useToast } from '@/Hooks/useToast.d';

export default function TabLayout() {
  const { auth } = useAuth();
  const { showAlert } = useToast();

  useEffect(() => {
    // If user is null, wait 10 minutes and redirect
    if (!auth.isAuth) {
      const timer = setTimeout(() => {
        // Still no user after 10 mins
        if (!auth?.isAuth) {
          showAlert({
            message: 'Session expired. Please log in again.',
            type: 'info',
          });
          router.replace('/get-started');
        }
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearTimeout(timer);
    }
  }, [auth, showAlert]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabs {...props} />}
      screenOptions={{
        headerShown: false,
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
