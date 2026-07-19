import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from '@/components/AuthInput';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES } from '@/lib/theme';

const theme = MODES.shop; // auth screens use the brand green accent
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Signup() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter your full name';
    if (!isEmail(email)) e.email = 'Enter a valid email address';
    if (phone.replace(/\D/g, '').length < 9) e.phone = 'Enter a valid phone number';
    if (password.length < 10) e.password = 'Use at least 10 characters';
    setErr(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      await register({ name, email, phone, password });
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 6 }}>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: c.chip,
          }}>
          <ChevronLeft size={17} color={c.ink} strokeWidth={2.6} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 10, paddingBottom: 40 }}>
        <Text
          style={{ fontFamily: FONTS.extrabold, fontSize: 26, letterSpacing: -0.8, color: c.ink }}>
          Create account
        </Text>
        <Text
          style={{ fontFamily: FONTS.medium, fontSize: 13.5, color: c.secondary, marginTop: 7 }}>
          Join Nearbuy to shop, book and rent near you.
        </Text>

        <View style={{ marginTop: 24, gap: 16 }}>
          <AuthInput
            label="FULL NAME"
            value={name}
            onChangeText={setName}
            error={err.name}
            placeholder="e.g. Ama Boateng"
            autoCapitalize="words"
          />
          <AuthInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            error={err.email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthInput
            label="PHONE"
            value={phone}
            onChangeText={setPhone}
            error={err.phone}
            placeholder="+233 24 000 0000"
            keyboardType="phone-pad"
          />
          <AuthInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            error={err.password}
            placeholder="At least 10 characters"
            secureTextEntry
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          style={({ pressed }) => ({
            marginTop: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accent,
            paddingVertical: 15,
            borderRadius: 15,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}>
          {submitting ? (
            <ActivityIndicator color={theme.accentText} />
          ) : (
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
              Create account
            </Text>
          )}
        </Pressable>

        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 11,
            color: c.muted,
            textAlign: 'center',
            marginTop: 14,
            lineHeight: 16,
          }}>
          By continuing you agree to Nearbuy’s Terms & Privacy Policy.
        </Text>

        <Pressable onPress={() => router.replace('/(auth)/login')} style={{ paddingTop: 16 }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 13,
              color: c.secondary,
              textAlign: 'center',
            }}>
            Already have an account? <Text style={{ color: c.ink }}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
