
import React, { JSX, useEffect, useState } from 'react'
import { useFonts } from "expo-font";
import { router, Stack } from 'expo-router';
import * as SplashScreen from "expo-splash-screen";
import { AuthState } from '@/types/auth';
import { Host } from "react-native-portalize";
import SplashScreenComponent from '@/components/customs/SplashScreen';
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    Roboto: require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
  });

  const [authState, setAuthState] = useState<AuthState>({
    isAuth: false,
    isReady: false,
  });

  const [splashDone, setSplashDone] = useState(false); // Track custom splash completion

  useEffect(() => {
    const prepare = async () => {
      try {
        // TODO: Replace with real auth check
        const userAuthenticated = true;

        // Wait for auth check
        setAuthState({ isAuth: userAuthenticated, isReady: true });
      } catch (e) {
        console.warn(e);
        setAuthState({ isAuth: false, isReady: true });
      }
    };

    prepare();
  }, []);

  // Handle custom splash completion
  const handleSplashComplete = () => {
    setSplashDone(true);
  };

  // Hide native splash when everything is ready
  useEffect(() => {
    if (loaded && authState.isReady && splashDone) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authState.isReady, splashDone]);

  // Navigate only when ready
  useEffect(() => {
    if (loaded && authState.isReady && splashDone) {
      if (authState.isAuth) {
        router.replace('/home');
      } else {
        router.replace('/get-started');
      }
    }
  }, [authState, loaded, splashDone]);

  // Wait for fonts & splash
  if (!loaded || !authState.isReady || !splashDone) {
    return <SplashScreenComponent onAnimationComplete={handleSplashComplete} />;
  }

  const AppContent = () => {
    return (
      <Host>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='get-started' options={{ headerShown: false }} />
        </Stack>
      </Host>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  )
}