import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DARK, LIGHT } from '@/lib/theme';

import { ListingsProvider } from '@/components/ListingsContext';
import { ModeProvider } from '@/components/ModeContext';
import { ToastProvider } from '@/components/ToastContext';
import { NotificationRegistrar } from '@/components/NotificationRegistrar';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider, useColors } from '@/lib/ThemeContext';

// Inside ThemeProvider so the navigator's transition background follows the
// active scheme (prevents a white flash between screens in dark mode).
function RootStack() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="listings" />
      <Stack.Screen name="listing/[id]" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen
        name="checkout"
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="category" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wallet/[action]" />
    </Stack>
  );
}

export default function Layout() {
  const system = useColorScheme();
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    // Pre-provider splash — best-effort match the OS scheme to avoid a flash.
    const bg = system === 'dark' ? DARK.canvas : LIGHT.canvas;
    return <View style={{ flex: 1, backgroundColor: bg }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ModeProvider>
            <ListingsProvider>
              <ToastProvider>
                <NotificationRegistrar />
                <RootStack />
              </ToastProvider>
            </ListingsProvider>
          </ModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
