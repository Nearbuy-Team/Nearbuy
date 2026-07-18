import { Check } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useMode } from '@/components/ModeContext';
import { useTheme } from '@/lib/ThemeContext';
import { FONTS, SHADOWS } from '@/lib/theme';

/**
 * Pinned confirmation pill. Rendered by ToastProvider above everything else,
 * sitting just above where the bottom tab bar will live (Step 4).
 */
export function Toast({ message }: { message: string }) {
  const { theme } = useMode();
  const { isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14).stiffness(180)}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 98,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: isDark ? '#2C2E35' : '#15171C',
        borderRadius: 15,
        paddingVertical: 13,
        paddingHorizontal: 16,
        ...SHADOWS.toast,
      }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.accent,
        }}>
        <Check size={14} color={theme.accentText} strokeWidth={3} />
      </View>
      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF', letterSpacing: -0.1 }}>
        {message}
      </Text>
    </Animated.View>
  );
}
