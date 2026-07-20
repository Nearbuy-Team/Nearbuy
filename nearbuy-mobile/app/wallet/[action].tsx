import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { paymentsApi } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';
import { PAYMENT_METHODS } from '@/lib/mockData';

const theme = MODES.shop;
const QUICK = ['50', '100', '200', '500'];

export default function WalletAction() {
  const router = useRouter();
  const { showToast } = useToast();
  const { token } = useAuth();
  const c = useColors();
  const { isDark } = useTheme();
  const { action } = useLocalSearchParams<{ action: string }>();

  const isWithdraw = action === 'withdraw';
  const title = isWithdraw ? 'Withdraw' : 'Top up';
  const method = PAYMENT_METHODS[0];

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    const value = Number(amount.replace(/[^\d.]/g, ''));
    if (!token) return showToast('Log in to use your wallet');
    if (!Number.isFinite(value) || value <= 0) return showToast('Enter a valid amount');
    setSubmitting(true);
    try {
      if (isWithdraw) await paymentsApi.withdraw(token, value);
      else await paymentsApi.topUp(token, value);
      showToast(isWithdraw ? 'Withdrawal recorded' : 'Top-up recorded');
      router.back();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Wallet request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title={title} />

      <KeyboardSafeView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 12.5,
              letterSpacing: 0.2,
              color: c.secondary,
              marginBottom: 9,
            }}>
            AMOUNT (GHS)
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: c.surface,
              borderRadius: 14,
              paddingHorizontal: 14,
              ...SHADOWS.row,
            }}>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 18, color: c.muted }}>GHS</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={c.muted}
              keyboardType="numbers-and-punctuation"
              style={{
                flex: 1,
                paddingVertical: 16,
                fontFamily: FONTS.extrabold,
                fontSize: 22,
                color: c.ink,
              }}
            />
          </View>

          {/* quick amounts */}
          <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
            {QUICK.map((q) => {
              const selected = amount === q;
              return (
                <Pressable
                  key={q}
                  onPress={() => setAmount(q)}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: selected ? theme.accent : c.surface,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    ...SHADOWS.row,
                  })}>
                  <Text
                    style={{
                      fontFamily: FONTS.extrabold,
                      fontSize: 13,
                      color: selected ? theme.accentText : c.ink,
                    }}>
                    {q}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 12.5,
              letterSpacing: 0.2,
              color: c.secondary,
              marginTop: 22,
              marginBottom: 9,
            }}>
            {isWithdraw ? 'WITHDRAW TO' : 'PAY WITH'}
          </Text>
          <Pressable
            onPress={() => router.push('/payment-methods')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: c.surface,
              borderRadius: 16,
              padding: 14,
              opacity: pressed ? 0.7 : 1,
              ...SHADOWS.row,
            })}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: method.tint,
              }}>
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 9, color: '#1A1A1A' }}>
                {method.brand}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                {method.label}
              </Text>
              <Text
                style={{ fontFamily: FONTS.medium, fontSize: 11.5, color: c.muted, marginTop: 1 }}>
                {method.sub}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, color: c.ink }}>
              Change
            </Text>
          </Pressable>

          <Pressable
            onPress={confirm}
            disabled={submitting}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: theme.accent,
              paddingVertical: 15,
              borderRadius: 15,
              marginTop: 26,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}>
            {submitting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
                {isWithdraw ? 'Request withdrawal' : 'Add money'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardSafeView>
    </View>
  );
}
