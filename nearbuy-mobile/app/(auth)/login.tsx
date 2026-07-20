import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from '@/components/AuthInput';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { ApiError } from '@/lib/api';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES } from '@/lib/theme';

const theme = MODES.shop;

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark } = useTheme();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const e: Record<string, string> = {};
    if (!id.trim()) e.id = 'Enter your email or phone';
    if (!password) e.password = 'Enter your password';
    setErr(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      await login(id, password);
      showToast('Welcome back');
      router.replace('/(tabs)/home');
    } catch (error) {
      const verificationRequired =
        error instanceof ApiError &&
        error.status === 401 &&
        error.message.toLowerCase().includes('verify your account');

      if (verificationRequired && id.includes('@')) {
        showToast('Enter the code sent to your email');
        router.replace({
          pathname: '/(auth)/verify',
          params: { email: id.trim().toLowerCase() },
        });
        return;
      }
      if (verificationRequired) {
        showToast('Log in with your email address to verify your account');
        return;
      }
      showToast(error instanceof Error ? error.message : 'Could not log in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 24, paddingBottom: 40 }}>
        <View
          style={{ alignItems: 'center', justifyContent: 'center',  width: 44, height: 44, borderRadius: 14, backgroundColor: theme.accent, marginBottom: 22 }}>
          <Home size={22} color={theme.accentText} strokeWidth={2.3} />
        </View>

        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 26, letterSpacing: -0.8, color: c.ink }}>
          Welcome back
        </Text>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 13.5, color: c.secondary, marginTop: 7 }}>
          Log in to continue to Nearbuy.
        </Text>

        <View style={{ marginTop: 24, gap: 16 }}>
          <AuthInput
            label="EMAIL OR PHONE"
            value={id}
            onChangeText={setId}
            error={err.id}
            placeholder="you@example.com"
            autoCapitalize="none"
          />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',  marginBottom: 8 }}>
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, letterSpacing: 0.4, color: c.secondary }}>
                PASSWORD
              </Text>
              <Pressable onPress={() => router.push('/(auth)/forgot')}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, color: c.ink }}>Forgot?</Text>
              </Pressable>
            </View>
            <AuthInput
              label=""
              value={password}
              onChangeText={setPassword}
              error={err.password}
              placeholder="Your password"
              secureTextEntry
            />
          </View>
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
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>Log in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/signup')} style={{ paddingTop: 16 }}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: c.secondary, textAlign: 'center' }}>
            New to Nearbuy? <Text style={{ color: c.ink }}>Create account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
