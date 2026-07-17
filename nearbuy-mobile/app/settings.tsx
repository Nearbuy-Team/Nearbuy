import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES, SHADOWS, type Palette } from '@/lib/theme';

const theme = MODES.shop;
const PREF_LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const;

export default function Settings() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark, preference, cyclePreference } = useTheme();

  const [pushOn, setPushOn] = useState(true);
  const [locationOn, setLocationOn] = useState(true);

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Settings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        <Section title="ACCOUNT" c={c}>
          <LinkRow c={c} label="Edit profile" onPress={() => showToast('Edit profile')} />
          <LinkRow c={c} label="Payment methods" onPress={() => router.push('/payment-methods')} last />
        </Section>

        <Section title="PREFERENCES" c={c}>
          <LinkRow c={c} label="Appearance" value={PREF_LABEL[preference]} onPress={cyclePreference} />
          <ToggleRow c={c} label="Push notifications" value={pushOn} onValueChange={setPushOn} />
          <ToggleRow c={c} label="Location services" value={locationOn} onValueChange={setLocationOn} />
          <LinkRow c={c} label="Language" value="English" onPress={() => showToast('Language')} last />
        </Section>

        <Section title="SUPPORT" c={c}>
          <LinkRow c={c} label="Help center" onPress={() => showToast('Help center')} />
          <LinkRow c={c} label="Terms & privacy" onPress={() => showToast('Terms & privacy')} />
          <LinkRow c={c} label="About Nearbuy" value="v1.0.0" onPress={() => showToast('About Nearbuy')} last />
        </Section>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: c.surface,
            paddingVertical: 15,
            borderRadius: 14,
            marginTop: 20,
            transform: [{ scale: pressed ? 0.99 : 1 }],
            ...SHADOWS.row,
          })}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: c.danger }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: Palette }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, letterSpacing: 0.4, color: c.secondary, marginBottom: 9 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', ...SHADOWS.row }}>
        {children}
      </View>
    </View>
  );
}

function RowShell({ children, last, c }: { children: React.ReactNode; last?: boolean; c: Palette }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center',
        gap: 12,
        paddingVertical: 15,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.divider,
      }}>
      {children}
    </View>
  );
}

function LinkRow({ label, value, onPress, last, c }: { label: string; value?: string; onPress: () => void; last?: boolean; c: Palette }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <RowShell last={last} c={c}>
        <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: c.ink }}>{label}</Text>
        {!!value && <Text style={{ fontFamily: FONTS.semibold, fontSize: 12.5, color: c.muted }}>{value}</Text>}
        <ChevronRight size={16} color={c.muted} strokeWidth={2.4} />
      </RowShell>
    </Pressable>
  );
}

function ToggleRow({ label, value, onValueChange, c }: { label: string; value: boolean; onValueChange: (v: boolean) => void; c: Palette }) {
  return (
    <RowShell c={c}>
      <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: c.ink }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.track, true: theme.accent }}
        thumbColor="#FFFFFF"
      />
    </RowShell>
  );
}
