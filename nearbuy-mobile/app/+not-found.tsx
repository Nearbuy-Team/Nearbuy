import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

export default function NotFoundScreen() {
  const c = useColors();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.canvas,
        padding: 24,
      }}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 18, color: c.ink }}>
        This screen doesn&apos;t exist.
      </Text>
      <Link href="/" style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: '#2E78B7' }}>
          Go to home screen
        </Text>
      </Link>
    </View>
  );
}
