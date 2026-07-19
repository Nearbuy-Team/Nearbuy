import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiWalletTransaction, formatGhs, paymentsApi } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';

const theme = MODES.shop;

export default function Wallet() {
  const router = useRouter();
  const c = useColors();
  const { isDark } = useTheme();
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<ApiWalletTransaction[]>([]);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [balanceResult, transactionResult] = await Promise.all([
        paymentsApi.walletBalance(token),
        paymentsApi.walletTransactions(token),
      ]);
      setBalance(Number(balanceResult.balance));
      setSandboxMode(balanceResult.sandboxMode);
      setTransactions(transactionResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load wallet');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 22, color: c.ink, letterSpacing: -0.5, marginTop: 8, paddingHorizontal: 20 }}>{sandboxMode ? 'Demo wallet' : 'Payouts'}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 110 }}>
        <LinearGradient colors={[c.promoFrom, c.promoTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }} style={{ borderRadius: 22, padding: 20, overflow: 'hidden', marginBottom: 20 }}>
          <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: theme.accent, opacity: 0.2 }} />
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 }}>{sandboxMode ? 'Demo balance' : 'Recorded net payouts'}</Text>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 30, color: '#FFFFFF', letterSpacing: -1, marginTop: 5 }}>{formatGhs(balance)}</Text>
          {sandboxMode ? (
            <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}>
              <Pressable onPress={() => router.push('/wallet/top-up')} style={({ pressed }) => ({ flex: 1, alignItems: 'center', backgroundColor: theme.accent, paddingVertical: 11, borderRadius: 13, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13, color: theme.accentText }}>Top up demo</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/wallet/withdraw')} style={({ pressed }) => ({ flex: 1, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 11, borderRadius: 13, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13, color: '#FFFFFF' }}>Withdraw demo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => router.push('/payment-methods')} style={({ pressed }) => ({ alignItems: 'center', backgroundColor: theme.accent, paddingVertical: 11, borderRadius: 13, marginTop: 16, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13, color: theme.accentText }}>Manage payout method</Text>
            </Pressable>
          )}
        </LinearGradient>

        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink, marginBottom: 12 }}>Payment activity</Text>
        {loading ? <ActivityIndicator color={c.ink} /> : null}
        {!!error && <Text style={{ fontFamily: FONTS.semibold, color: c.danger }}>{error}</Text>}
        {!loading && !error && transactions.length === 0 ? <Text style={{ fontFamily: FONTS.medium, color: c.secondary }}>No payment activity yet.</Text> : null}
        <View style={{ gap: 12 }}>
          {transactions.map((transaction) => {
            const incoming = transaction.type === 'CREDIT' || transaction.type === 'ESCROW_RELEASE' || transaction.type === 'REFUND';
            const Arrow = incoming ? ArrowDownLeft : ArrowUpRight;
            return (
              <View key={transaction.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, ...SHADOWS.row }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center' }}>
                  <Arrow size={17} color={c.ink} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: FONTS.bold, fontSize: 13.5, color: c.ink }}>{transaction.description}</Text>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 11.5, color: c.muted, marginTop: 1 }}>{new Date(transaction.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: incoming ? c.success : c.ink }}>{incoming ? '+' : '−'} {formatGhs(transaction.amount)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
