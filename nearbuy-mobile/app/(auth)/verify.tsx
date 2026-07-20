import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, ChevronLeft, Lock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtpInput } from '@/components/OtpInput';
import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES } from '@/lib/theme';

const theme = MODES.shop;
// Lock icon sits on a mode tint (light in both schemes) → stays dark.
const ON_TINT = '#111317';
const RESEND_SECONDS = 60;

export default function Verify() {
  const router = useRouter();
  const { pendingEmail, resendVerification, verifyOtp } = useAuth();
  const { showToast } = useToast();
  const col = useColors();
  const { isDark } = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCooldown();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const onVerify = async () => {
    if (code.length !== 6) return showToast('Enter the 6-digit code');
    setSubmitting(true);
    try {
      await verifyOtp(code);
      router.replace('/(tabs)/home');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not verify code');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendVerification();
      startCooldown();
      showToast('New code sent');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not resend code');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: col.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 6 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: col.chip,
          }}>
          <ChevronLeft size={17} color={col.ink} strokeWidth={2.6} />
        </Pressable>
      </View>

      <KeyboardSafeView>
        <ScrollView
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 40 }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 17,
              backgroundColor: theme.tagBg,
              marginBottom: 18,
            }}>
            <Lock size={24} color={ON_TINT} strokeWidth={2.1} />
          </View>

          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 26,
              letterSpacing: -0.8,
              color: col.ink,
            }}>
            Verify your email
          </Text>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 13.5,
              color: col.secondary,
              marginTop: 7,
            }}>
            Enter the 6-digit code we sent to{' '}
            <Text style={{ fontFamily: FONTS.bold, color: col.ink }}>
              {pendingEmail || email || 'your email address'}
            </Text>
          </Text>

          <View style={{ marginTop: 26 }}>
            <OtpInput value={code} onChange={setCode} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 }}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: col.secondary }}>
              Didn’t get the code?
            </Text>
            <Pressable onPress={onResend} disabled={cooldown > 0}>
              <Text
                style={{
                  fontFamily: FONTS.extrabold,
                  fontSize: 12.5,
                  color: cooldown > 0 ? col.muted : col.ink,
                }}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onVerify}
            disabled={submitting}
            style={({ pressed }) => ({
              marginTop: 28,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.accent,
              paddingVertical: 15,
              borderRadius: 15,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}>
            {submitting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <>
                <Text
                  style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
                  Verify & continue
                </Text>
                <Check size={16} color={theme.accentText} strokeWidth={2.8} />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardSafeView>
    </SafeAreaView>
  );
}
