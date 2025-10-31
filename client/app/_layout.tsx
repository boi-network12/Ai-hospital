
import React, { JSX, useEffect, useState } from 'react'
import { useFonts } from "expo-font";
import { router, Stack } from 'expo-router';
import * as SplashScreen from "expo-splash-screen";
import { AuthState } from '@/types/auth';
import { Host } from "react-native-portalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    Roboto: require("../assets/fonts/Roboto-Regular.ttf")
  });

  const [authState, setAuthState] = useState<AuthState>({
    isAuth: false,
    isReady: false,
  });

  useEffect(() => {
    const prepare = async () => {
      try {
        // simple app startup delay or auth check can go here
        await new Promise(resolve => setTimeout(resolve, 10000));

        // TODO: Replace with real auth check logic (Async Storage  or API)
        const userAuthenticated = true;
        setAuthState({ isAuth: userAuthenticated, isReady: true })
      } catch (e) {
        console.warn(e);
        setAuthState({ isAuth: false, isReady: true });
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [])

  useEffect(() => {
    if (authState.isReady) {
      if (authState.isAuth) router.replace("/home");
      else router.replace("/get-started");
    }
  }, [authState]);

  // Wait for fonts & splash
  if (!loaded || !authState.isReady) return null;

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