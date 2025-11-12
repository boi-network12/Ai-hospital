// src/app/_layout.tsx
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Host } from 'react-native-portalize';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreenComponent from '@/components/customs/SplashScreen';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/Hooks/authHook.d';
import { AlertProvider } from '@/context/AlertContext';
import { UserProvider } from '@/context/UserContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { auth } = useAuth();
  const [loaded] = useFonts({
    Roboto: require('../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('../assets/fonts/Roboto-Medium.ttf'),
    'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
  });

  const [splashDone, setSplashDone] = React.useState(false);

  // Hide native splash when everything is ready
  useEffect(() => {
    if (loaded && auth.isReady && splashDone) {
      SplashScreen.hideAsync();
    }
  }, [loaded, auth.isReady, splashDone]);

  // Navigate based on auth state
  useEffect(() => {
    if (loaded && auth.isReady && splashDone) {
      if (auth.isAuth) {
        router.replace('/home');
      } else {
        router.replace('/get-started');
      }
    }
  }, [auth.isAuth, auth.isReady, loaded, splashDone]);

  // Show custom splash until ready
  if (!loaded || !auth.isReady || !splashDone) {
    return <SplashScreenComponent onAnimationComplete={() => setSplashDone(true)} />;
  }

  return (
    <Host>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="get-started" />
      </Stack>
    </Host>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <AuthProvider>
          <UserProvider>
            <RootLayoutContent />
          </UserProvider>
        </AuthProvider>
      </AlertProvider>
    </GestureHandlerRootView>
  );
}