import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { C } from '@/lib/ui';

SplashScreen.preventAutoHideAsync();

function Root() {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: C.ink,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: C.ground },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="animal/[id]" options={{ title: '' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Conversa' }} />
        <Stack.Screen name="entrar" options={{ title: 'Entrar', presentation: 'modal' }} />
        <Stack.Screen name="criar-conta" options={{ title: 'Criar conta', presentation: 'modal' }} />
        <Stack.Screen name="completar-perfil" options={{ title: 'Completar perfil' }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
