import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';
import { PROFILE_ROWS } from '@/lib/mockData';

// Profile is not a header tab → accent locks to brand green.
const theme = MODES.shop;
// Text on a mode tint (theme.tagBg) stays dark — the tint is light in both schemes.
const ON_TINT = '#111317';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark } = useTheme();

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Each menu row opens its own page.
  const actionFor = (label: string): (() => void) => {
    switch (label) {
      case 'My orders & bookings':
        return () => router.push('/orders');
      case 'My listings':
        return () => router.push('/listings');
      case 'Reviews & TrustScore':
        return () => router.push('/reviews');
      case 'Payment methods':
        return () => router.push('/payment-methods');
      case 'Settings':
        return () => router.push('/settings');
      default:
        return () => showToast(label);
    }
  };

  const rows = [
    ...PROFILE_ROWS.map((r) => ({ glyph: r.glyph, label: r.label, onTap: actionFor(r.label) })),
    { glyph: '🚪', label: 'Log out', onTap: onLogout },
  ];
  const initials =
    user?.name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NB';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 110 }}>
        {/* header card */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center',
            gap: 15,
            backgroundColor: c.surface,
            borderRadius: 22,
            padding: 18,
            marginBottom: 20,
            ...SHADOWS.card,
          }}>
          <View
            style={{ alignItems: 'center', justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: 20,
              backgroundColor: theme.tagBg,
              borderWidth: 1,
              borderColor: theme.tagBorder,
            }}>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 22, color: ON_TINT }}>{initials}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: FONTS.extrabold, fontSize: 18, color: c.ink, letterSpacing: -0.4 }}>
              {user?.name || 'Nearbuy member'}
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: c.secondary, marginTop: 2 }}>
              {user?.email || 'Signed in'} · Member since {memberSince}
            </Text>

            {/* verified pill */}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
                gap: 4,
                marginTop: 8,
                backgroundColor: theme.tagBg,
                borderWidth: 1,
                borderColor: theme.tagBorder,
                paddingVertical: 4,
                paddingHorizontal: 9,
                borderRadius: 8,
              }}>
              <Check size={11} color={ON_TINT} strokeWidth={2.6} />
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 10.5, color: ON_TINT }}>
                {user?.idVerified ? 'Verified' : 'Unverified'} · TrustScore {user?.trustScore ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* menu rows */}
        <View style={{ gap: 12 }}>
          {rows.map((row) => (
            <Pressable
              key={row.label}
              onPress={row.onTap}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                backgroundColor: c.surface,
                borderRadius: 14,
                padding: 14,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                ...SHADOWS.row,
              })}>
              <View
                style={{ alignItems: 'center', justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: theme.tagBg,
                  borderWidth: 1,
                  borderColor: theme.tagBorder,
                }}>
                <Text style={{ fontSize: 15 }}>{row.glyph}</Text>
              </View>
              <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: c.ink }}>
                {row.label}
              </Text>
              <ChevronRight size={16} color={c.muted} strokeWidth={2.4} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
