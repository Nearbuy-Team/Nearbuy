import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from '@/components/AuthInput';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES } from '@/lib/theme';

const theme = MODES.shop;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type Step = 'email' | 'code' | 'reset' | 'done';

const COPY: Record<Step, { title: string; sub: string; primary: string }> = {
  email: { title: 'Reset password', sub: "Enter your email and we'll send you a reset code.", primary: 'Send code' },
  code: { title: 'Check your email', sub: 'Enter the 6-digit code we just sent you.', primary: 'Verify code' },
  reset: { title: 'New password', sub: 'Choose a strong new password for your account.', primary: 'Update password' },
  done: { title: 'All set', sub: '', primary: 'Back to login' },
};

export default function Forgot() {
  const router = useRouter();
  const { requestPasswordReset, resetPassword } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark } = useTheme();
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const copy = COPY[step];

  const onBack = () => {
    if (step === 'email' || step === 'done') router.replace('/(auth)/login');
    else if (step === 'code') setStep('email');
    else setStep('code');
  };

  const onPrimary = async () => {
    try {
      if (step === 'email') {
        if (!isEmail(email)) return setErr({ email: 'Enter a valid email address' });
        setSubmitting(true);
        await requestPasswordReset(email.trim().toLowerCase());
        setErr({});
        setStep('code');
      } else if (step === 'code') {
        if (code.length !== 6) return setErr({ code: 'Enter the 6-digit reset code' });
        setErr({});
        setStep('reset');
      } else if (step === 'reset') {
        if (pw.length < 6) return setErr({ pw: 'Use at least 6 characters' });
        if (pw !== pw2) return setErr({ pw: 'Passwords do not match' });
        setSubmitting(true);
        await resetPassword(email.trim().toLowerCase(), code, pw);
        setErr({});
        setStep('done');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 6 }}>
        <Pressable
          onPress={onBack}
          style={{ alignItems: 'center', justifyContent: 'center',  width: 36, height: 36, borderRadius: 11, backgroundColor: c.chip }}>
          <ChevronLeft size={17} color={c.ink} strokeWidth={2.6} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 14, paddingBottom: 40 }}>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 26, letterSpacing: -0.8, color: c.ink }}>
          {copy.title}
        </Text>
        {!!copy.sub && (
          <Text style={{ fontFamily: FONTS.medium, fontSize: 13.5, color: c.secondary, marginTop: 7, lineHeight: 20 }}>
            {copy.sub}
          </Text>
        )}

        {step === 'email' && (
          <View style={{ marginTop: 24 }}>
            <AuthInput
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              error={err.email}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        {step === 'code' && (
          <View style={{ marginTop: 24 }}>
            <AuthInput
              label="RESET CODE"
              value={code}
              onChangeText={setCode}
              error={err.code}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              style={{ letterSpacing: 4, fontFamily: FONTS.extrabold }}
            />
          </View>
        )}

        {step === 'reset' && (
          <View style={{ marginTop: 24, gap: 16 }}>
            <AuthInput
              label="NEW PASSWORD"
              value={pw}
              onChangeText={setPw}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <AuthInput
              label="CONFIRM PASSWORD"
              value={pw2}
              onChangeText={setPw2}
              error={err.pw}
              placeholder="Re-enter password"
              secureTextEntry
            />
          </View>
        )}

        {step === 'done' && (
          <View style={{ alignItems: 'center',  paddingVertical: 36 }}>
            <View
              style={{ alignItems: 'center', justifyContent: 'center', 
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: theme.accent,
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.7,
                shadowRadius: 22,
                elevation: 8,
              }}>
              <Check size={34} color={theme.accentText} strokeWidth={3} />
            </View>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 18, color: c.ink, marginTop: 18 }}>
              Password updated
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: c.secondary, marginTop: 6, textAlign: 'center' }}>
              You can now log in with your new password.
            </Text>
          </View>
        )}

        <Pressable
          onPress={onPrimary}
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
              {copy.primary}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
