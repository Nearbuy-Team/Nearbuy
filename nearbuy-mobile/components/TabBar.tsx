import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Home, MessageCircle, Plus, User, Wallet } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMode } from '@/components/ModeContext';
import { COLORS, FONTS, MODES } from '@/lib/theme';

type IconType = typeof Home;

// The four real tab routes, in display order. The center "+" FAB is injected
// between chat and wallet and is NOT a route — it opens the Create modal.
const TABS: { name: string; label: string; Icon: IconType }[] = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'chat', label: 'Chat', Icon: MessageCircle },
  { name: 'wallet', label: 'Wallet', Icon: Wallet },
  { name: 'profile', label: 'Profile', Icon: User },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { mode } = useMode();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const focusedName = state.routes[state.index]?.name;
  // Effective accent: mode accent on Home, locked brand green elsewhere.
  const onHome = focusedName === 'index';
  const accent = onHome ? MODES[mode].accent : MODES.shop.accent;
  const accentText = onHome ? MODES[mode].accentText : MODES.shop.accentText;

  const renderTab = (tab: (typeof TABS)[number]) => {
    const route = state.routes.find((r) => r.name === tab.name);
    const isFocused = focusedName === tab.name;
    const color = isFocused ? accent : COLORS.navInactive;

    const onPress = () => {
      if (!route) return;
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return (
      <Pressable key={tab.name} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <tab.Icon size={23} color={color} strokeWidth={2.2} />
        <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color }}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <BlurView
        intensity={24}
        tint="light"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(17,19,23,0.06)',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingTop: 9,
            paddingHorizontal: 14,
            paddingBottom: Math.max(insets.bottom, 24),
          }}>
          {renderTab(TABS[0])}
          {renderTab(TABS[1])}

          {/* center raised "+" FAB — no label, dead-center as the 3rd of 5 slots */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/create')}
              style={({ pressed }) => ({
                width: 56,
                height: 56,
                borderRadius: 19,
                marginTop: -4,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: accent,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                shadowColor: accent,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
                elevation: 6,
              })}>
              <Plus size={26} color={accentText} strokeWidth={2.8} />
            </Pressable>
          </View>

          {renderTab(TABS[2])}
          {renderTab(TABS[3])}
        </View>

        {/* iOS home-indicator pill */}
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            alignSelf: 'center',
            width: 130,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(17,19,23,0.85)',
          }}
        />
      </BlurView>
    </View>
  );
}
