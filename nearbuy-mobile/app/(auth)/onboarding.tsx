import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES, type Mode } from '@/lib/theme';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });
// Text on a mode tint (kicker) stays dark — the tint is light in both schemes.
const ON_TINT = '#111317';

interface Slide {
  mode: Mode;
  kicker: string;
  title: string;
  sub: string;
  img: string;
}

const SLIDES: Slide[] = [
  {
    mode: 'shop',
    kicker: 'SHOP',
    title: 'Buy from sellers near you',
    sub: 'Verified local sellers and escrow-protected payments — your money is held safely until you confirm.',
    img: 'illustration · shopping near you',
  },
  {
    mode: 'services',
    kicker: 'SERVICES',
    title: 'Book trusted local pros',
    sub: 'AC repair, tutoring, cleaning and more. Real-time slots with same-day availability.',
    img: 'illustration · local services',
  },
  {
    mode: 'rent',
    kicker: 'RENT',
    title: 'Rent by the hour or day',
    sub: 'Generators, sound systems, cameras. Deposits are auto-released on confirmed return.',
    img: 'illustration · equipment rentals',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const c = useColors();
  const { isDark } = useTheme();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index];
  const theme = MODES[slide.mode];
  const isLast = index === SLIDES.length - 1;

  const exitTo = async (path: '/(auth)/signup' | '/(auth)/login') => {
    await completeOnboarding();
    router.replace(path);
  };

  const onPrimary = () => {
    if (isLast) exitTo('/(auth)/signup');
    else setIndex((i) => i + 1);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* brand + skip */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 8,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BrandMark size={27} />
          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 16,
              letterSpacing: -0.4,
              color: c.ink,
            }}>
            Nearbuy
          </Text>
        </View>
        <Pressable onPress={() => exitTo('/(auth)/login')}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: c.secondary }}>Skip</Text>
        </Pressable>
      </View>

      {/* hero image */}
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <Animated.View
          key={`img-${index}`}
          entering={FadeIn.duration(320)}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            aspectRatio: 1,
            maxHeight: 318,
            borderRadius: 30,
            backgroundColor: theme.tagBg,
            borderWidth: 1,
            borderColor: theme.tagBorder,
          }}>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: '#93938E',
              backgroundColor: 'rgba(255,255,255,0.72)',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 9,
              overflow: 'hidden',
            }}>
            {slide.img}
          </Text>
        </Animated.View>
      </View>

      {/* bottom sheet */}
      <View
        style={{
          backgroundColor: c.surface,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          paddingHorizontal: 26,
          paddingTop: 26,
          paddingBottom: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.06,
          shadowRadius: 30,
          elevation: 8,
        }}>
        <Animated.View key={`copy-${index}`} entering={FadeIn.duration(320)}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 6,
              backgroundColor: theme.tagBg,
              borderWidth: 1,
              borderColor: theme.tagBorder,
              paddingVertical: 5,
              paddingHorizontal: 11,
              borderRadius: 9,
              marginBottom: 14,
            }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent }} />
            <Text
              style={{
                fontFamily: FONTS.extrabold,
                fontSize: 10.5,
                letterSpacing: 0.5,
                color: ON_TINT,
              }}>
              {slide.kicker}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 23,
              letterSpacing: -0.6,
              lineHeight: 28,
              color: c.ink,
            }}>
            {slide.title}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 13.5,
              color: c.secondary,
              marginTop: 9,
              lineHeight: 20,
            }}>
            {slide.sub}
          </Text>
        </Animated.View>

        {/* dots */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            marginTop: 22,
            marginBottom: 18,
          }}>
          {SLIDES.map((s, i) => (
            <View
              key={s.mode}
              style={{
                height: 7,
                borderRadius: 4,
                width: i === index ? 26 : 7,
                backgroundColor: i === index ? theme.accent : c.border,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={onPrimary}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.accent,
            paddingVertical: 15,
            borderRadius: 15,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
            {isLast ? 'Get started' : 'Next'}
          </Text>
          <ArrowRight size={16} color={theme.accentText} strokeWidth={2.8} />
        </Pressable>

        <Pressable onPress={() => exitTo('/(auth)/login')} style={{ paddingTop: 16 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 13,
              color: c.secondary,
              textAlign: 'center',
            }}>
            I already have an account · <Text style={{ color: c.ink }}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
