import { Stack } from 'expo-router';

import { useColors } from '@/lib/ThemeContext';

export default function AuthLayout() {
  const c = useColors();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.canvas } }} />;
}
