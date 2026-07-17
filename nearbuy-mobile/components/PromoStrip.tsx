import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useMode } from '@/components/ModeContext';
import { useToast } from '@/components/ToastContext';
import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

export function PromoStrip() {
  const { mode, theme } = useMode();
  const { showToast } = useToast();
  const c = useColors();

  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

  return (
    <LinearGradient
      colors={[c.promoFrom, c.promoTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.4 }}
      style={{
        borderRadius: 20,
        padding: 16,
        paddingHorizontal: 18,
        marginBottom: 22,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
      {/* decorative accent circle, top-right */}
      <View
        style={{
          position: 'absolute',
          right: -28,
          top: -28,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: theme.accent,
          opacity: 0.18,
        }}
      />

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: '#FFFFFF', letterSpacing: -0.2 }}>
          {theme.promoTitle}
        </Text>
        <Text
          style={{ fontFamily: FONTS.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
          {theme.promoSub}
        </Text>
      </View>

      <Pressable
        onPress={() => showToast('Exploring ' + modeLabel)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: theme.accent,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 11,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, color: theme.accentText }}>Explore</Text>
        <ChevronRight size={12} color={theme.accentText} strokeWidth={3} />
      </Pressable>
    </LinearGradient>
  );
}
