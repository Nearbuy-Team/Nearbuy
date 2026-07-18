import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { Check, ShieldCheck, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LISTING_TYPE_TO_MODE, useListings } from '@/components/ListingsContext';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors } from '@/lib/ThemeContext';
import {
  type ApiListing,
  type ApiPaymentMethod,
  formatGhs,
  listingsApi,
  paymentMethodsApi,
  paymentsApi,
} from '@/lib/api';
import { FONTS, MODES, SHADOWS, type Mode } from '@/lib/theme';

// Icon/text on a mode tint (escrow banner) stays dark — the tint is light in both schemes.
const ON_TINT = '#111317';

type Step = 'review' | 'processing' | 'success';

const fmt = (n: number) =>
  'GHS ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { showToast } = useToast();
  const { token } = useAuth();
  const { findListing } = useListings();
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode: Mode }>();
  const listingId = Number(id);
  const [listing, setListing] = useState<ApiListing | undefined>(() => findListing(listingId));

  const mode = listing ? LISTING_TYPE_TO_MODE[listing.type] : ((modeParam || 'shop') as Mode);
  const theme = MODES[mode];

  const [step, setStep] = useState<Step>('review');
  const [orderRef, setOrderRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ApiPaymentMethod | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: number;
    reference: string;
  } | null>(null);

  useEffect(() => {
    if (listing || !token || !Number.isFinite(listingId)) return;
    listingsApi
      .get(token, listingId)
      .then(setListing)
      .catch((error) =>
        showToast(error instanceof Error ? error.message : 'Could not load listing')
      );
  }, [listing, listingId, showToast, token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      void paymentMethodsApi
        .all(token)
        .then((methods) =>
          setPaymentMethod(methods.find((method) => method.defaultMethod) ?? methods[0] ?? null)
        )
        .catch(() => setPaymentMethod(null));
    }, [token])
  );

  const amt = Number(listing?.price ?? 0);
  const fee = Math.max(2, Math.round(amt * 0.015 * 100) / 100);
  const total = amt + fee;
  const verb = mode === 'services' ? 'booking' : mode === 'rent' ? 'rental' : 'order';

  const close = () => router.back();

  const pay = async () => {
    if (!token || !listing) return showToast('Listing is still loading');
    setStep('processing');
    try {
      let paid;
      if (pendingPayment) {
        paid = await paymentsApi.verifyOrderPayment(
          token,
          pendingPayment.orderId,
          pendingPayment.reference
        );
      } else {
        const created = await paymentsApi.createOrder(token, listing.id);
        const initialized = await paymentsApi.initializeOrderPayment(token, created.id);
        if (initialized.provider === 'SANDBOX') {
          paid = await paymentsApi.payOrder(token, created.id);
        } else {
          if (!initialized.authorizationUrl || !initialized.reference)
            throw new Error('Paystack checkout is unavailable');
          setPendingPayment({ orderId: created.id, reference: initialized.reference });
          await WebBrowser.openBrowserAsync(initialized.authorizationUrl);
          paid = await paymentsApi.verifyOrderPayment(token, created.id, initialized.reference);
        }
      }
      setPendingPayment(null);
      setOrderRef(`NB-${paid.id}`);
      setStep('success');
    } catch (error) {
      setStep('review');
      showToast(error instanceof Error ? error.message : 'Payment could not be secured');
    }
  };

  const done = () => {
    router.back();
    showToast('Order placed · escrow held');
  };

  const messageSeller = () => {
    if (!listing) return;
    router.replace({
      pathname: '/chat/[id]',
      params: {
        id: String(listing.sellerId),
        otherUserId: String(listing.sellerId),
        listingId: String(listing.id),
        name: `Seller #${listing.sellerId}`,
        initial: 'S',
        listTitle: listing?.title ?? '',
        listSub: formatGhs(listing.price),
        listMode: mode,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(10,10,12,0.42)', justifyContent: 'flex-end' }}>
      <StatusBar style="light" />
      {/* tap scrim to dismiss (review only) */}
      {step === 'review' && <Pressable style={{ flex: 1 }} onPress={close} />}

      <Animated.View
        entering={SlideInDown.duration(300)}
        style={{
          backgroundColor: c.canvas,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '94%',
          overflow: 'hidden',
        }}>
        {/* grab handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: c.border }} />
        </View>

        {step === 'review' && (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 22,
                paddingTop: 8,
              }}>
              <Text
                style={{
                  fontFamily: FONTS.extrabold,
                  fontSize: 19,
                  color: c.ink,
                  letterSpacing: -0.4,
                }}>
                Confirm {verb}
              </Text>
              <Pressable
                onPress={close}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: c.track,
                }}>
                <X size={15} color={c.ink} strokeWidth={2.6} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18 }}>
              {/* listing summary */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  backgroundColor: c.surface,
                  borderRadius: 18,
                  padding: 14,
                  ...SHADOWS.card,
                }}>
                <View
                  style={{ width: 52, height: 52, borderRadius: 13, backgroundColor: c.imgBg }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: c.ink }}>
                    {listing?.title ?? 'Loading listing…'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.semibold,
                      fontSize: 12,
                      color: c.secondary,
                      marginTop: 2,
                    }}>
                    {listing ? formatGhs(listing.price) : ''}
                  </Text>
                </View>
              </View>

              {/* breakdown */}
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: 18,
                  padding: 16,
                  marginTop: 14,
                  ...SHADOWS.card,
                }}>
                <Row k="Item price" v={fmt(amt)} />
                <Row k="Service fee" v={fmt(fee)} />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 11,
                    borderTopWidth: 1,
                    borderTopColor: c.divider,
                  }}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                    Total
                  </Text>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: c.ink }}>
                    {fmt(total)}
                  </Text>
                </View>
              </View>

              {/* payment method */}
              <Text
                style={{
                  fontFamily: FONTS.extrabold,
                  fontSize: 12.5,
                  letterSpacing: 0.2,
                  color: c.secondary,
                  marginTop: 18,
                  marginBottom: 9,
                }}>
                PAYMENT METHOD
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: c.surface,
                  borderRadius: 16,
                  padding: 14,
                  ...SHADOWS.row,
                }}>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: '#FFCC00',
                  }}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 9, color: '#1A1A1A' }}>
                    {paymentMethod?.provider ?? 'MoMo'}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                    {paymentMethod
                      ? `${paymentMethod.provider} Mobile Money`
                      : 'Choose a payment method'}
                  </Text>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 11.5, color: c.muted }}>
                    {paymentMethod
                      ? `•••• ${paymentMethod.lastFour}`
                      : 'Paystack test checkout can also be used'}
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/payment-methods')}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, color: c.ink }}>
                    Change
                  </Text>
                </Pressable>
              </View>

              {/* escrow banner */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: theme.tagBg,
                  borderWidth: 1,
                  borderColor: theme.tagBorder,
                  borderRadius: 14,
                  padding: 13,
                  paddingHorizontal: 14,
                  marginTop: 16,
                }}>
                <ShieldCheck size={18} color={ON_TINT} strokeWidth={2.1} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: FONTS.semibold,
                    fontSize: 11.5,
                    color: ON_TINT,
                    lineHeight: 17,
                  }}>
                  Held in escrow until you confirm. Released to the seller only when you’re
                  satisfied.
                </Text>
              </View>
            </ScrollView>

            <View
              style={{
                paddingHorizontal: 22,
                paddingTop: 14,
                paddingBottom: Math.max(insets.bottom, 22),
              }}>
              <Pressable
                onPress={pay}
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
                <ShieldCheck size={17} color={theme.accentText} strokeWidth={2.3} />
                <Text
                  style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
                  {pendingPayment ? 'Check payment' : `Pay ${fmt(total)}`}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'processing' && (
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: 30,
              paddingTop: 50,
              paddingBottom: 60,
            }}>
            <ActivityIndicator size="large" color={c.ink} />
            <Text
              style={{ fontFamily: FONTS.extrabold, fontSize: 16, color: c.ink, marginTop: 22 }}>
              Securing your payment…
            </Text>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 12.5,
                color: c.secondary,
                marginTop: 6,
                textAlign: 'center',
              }}>
              Holding funds in escrow with MTN MoMo.
            </Text>
          </View>
        )}

        {step === 'success' && (
          <>
            <View style={{ alignItems: 'center', paddingHorizontal: 26, paddingTop: 30 }}>
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 76,
                  height: 76,
                  borderRadius: 25,
                  backgroundColor: theme.accent,
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 18 },
                  shadowOpacity: 0.7,
                  shadowRadius: 28,
                  elevation: 8,
                }}>
                <Check size={36} color={theme.accentText} strokeWidth={3} />
              </View>
              <Text
                style={{
                  fontFamily: FONTS.extrabold,
                  fontSize: 20,
                  color: c.ink,
                  letterSpacing: -0.4,
                  marginTop: 20,
                }}>
                Payment secured
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  color: c.secondary,
                  marginTop: 7,
                  textAlign: 'center',
                  lineHeight: 19,
                }}>
                Your funds are held safely in escrow and released to the seller once you confirm.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: c.surface,
                  borderRadius: 13,
                  paddingVertical: 11,
                  paddingHorizontal: 15,
                  marginTop: 20,
                  ...SHADOWS.row,
                }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 11.5, color: c.secondary }}>
                  Order ref
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.extrabold,
                    fontSize: 13,
                    color: c.ink,
                    letterSpacing: 0.4,
                  }}>
                  {orderRef}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 11,
                paddingHorizontal: 22,
                paddingTop: 24,
                paddingBottom: Math.max(insets.bottom, 22),
              }}>
              <Pressable
                onPress={messageSeller}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  paddingVertical: 14,
                  borderRadius: 14,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: c.ink }}>
                  Message seller
                </Text>
              </Pressable>
              <Pressable
                onPress={done}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  flex: 1,
                  backgroundColor: c.ink,
                  paddingVertical: 14,
                  borderRadius: 14,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: c.surface }}>
                  Done
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 11,
      }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 12.5, color: c.secondary }}>{k}</Text>
      <Text style={{ fontFamily: FONTS.bold, fontSize: 12.5, color: c.ink }}>{v}</Text>
    </View>
  );
}
