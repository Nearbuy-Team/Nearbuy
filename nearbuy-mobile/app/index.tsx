import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BrandMark } from '@/components/BrandMark';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES } from '@/lib/theme';

// Minimum time the designed splash stays up so the logo + progress bar are seen,
// even when the auth check resolves instantly.
const MIN_SPLASH_MS = 1550;

export default function Splash() {
  const { isLoading, token, seenOnboarding } = useAuth();
  const c = useColors();
  const { isDark } = useTheme();
  const [minElapsed, setMinElapsed] = useState(false);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: MIN_SPLASH_MS });
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  if (!isLoading && minElapsed) {
    if (token) return <Redirect href="/(tabs)/home" />;
    if (!seenOnboarding) return <Redirect href="/(auth)/onboarding" />;
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.canvas,
      }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ alignItems: 'center', gap: 18 }}>
        <BrandMark
          size={88}
          style={{
            shadowColor: MODES.shop.accent,
            shadowOffset: { width: 0, height: 22 },
            shadowOpacity: 0.4,
            shadowRadius: 30,
          }}
        />
        <View style={{ alignItems: 'center', gap: 7 }}>
          <Text
            style={{ fontFamily: FONTS.extrabold, fontSize: 31, letterSpacing: -1, color: c.ink }}>
            Nearbuy
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: c.secondary }}>
            Everything you need, right where you are.
          </Text>
        </View>
      </View>

      {/* progress bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 66,
          width: 120,
          height: 4,
          borderRadius: 3,
          backgroundColor: c.border,
          overflow: 'hidden',
        }}>
        <Animated.View
          style={[
            {
              height: '100%',
              width: '100%',
              borderRadius: 3,
              backgroundColor: c.ink,
              transformOrigin: 'left',
            },
            barStyle,
          ]}
        />
      </View>
    </View>
  );
}
