import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useListings } from '@/components/ListingsContext';
import { SubHeader } from '@/components/SubHeader';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiOrder, formatGhs, type OrderStatus, paymentsApi, reviewsApi } from '@/lib/api';
import { FONTS, SHADOWS, type Palette } from '@/lib/theme';

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Pending payment',
  PAID: 'In escrow',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusColor = (status: OrderStatus, c: Palette): string =>
  ({ PENDING: c.muted, PAID: '#B7791F', COMPLETED: c.success, CANCELLED: c.muted })[status];

export default function Orders() {
  const c = useColors();
  const { isDark } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { findListing } = useListings();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [sales, setSales] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewedOrders, setReviewedOrders] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [purchases, sold] = await Promise.all([
        paymentsApi.orders(token),
        paymentsApi.sales(token),
      ]);
      setOrders(purchases);
      setSales(sold);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const complete = async (order: ApiOrder) => {
    if (!token) return;
    try {
      const updated = await paymentsApi.completeOrder(token, order.id);
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast('Order completed · escrow released');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not complete order');
    }
  };

  const submitReview = async (order: ApiOrder) => {
    if (!token) return;
    try {
      await reviewsApi.create(token, order.id, rating, comment);
      setReviewedOrders((current) => new Set(current).add(order.id));
      setReviewing(null);
      setComment('');
      setRating(5);
      showToast('Review posted');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not post review');
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Orders & bookings" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={c.ink} /> : null}
        {!!error && <Text style={{ fontFamily: FONTS.semibold, color: c.danger }}>{error}</Text>}
        {!loading && !error && orders.length === 0 && sales.length === 0 ? (
          <Text style={{ fontFamily: FONTS.medium, color: c.secondary }}>
            You have no orders yet.
          </Text>
        ) : null}
        {orders.length > 0 ? (
          <Text style={{ fontFamily: FONTS.extrabold, color: c.ink, marginBottom: 10 }}>
            Purchases
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {orders.map((order) => {
            const listing = findListing(order.listingId);
            const color = statusColor(order.status, c);
            return (
              <View
                key={order.id}
                style={{
                  backgroundColor: c.surface,
                  borderRadius: 16,
                  padding: 14,
                  ...SHADOWS.row,
                }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View
                    style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: c.imgBg }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          fontFamily: FONTS.extrabold,
                          fontSize: 14,
                          color: c.ink,
                        }}>
                        {listing?.title || `Listing #${order.listingId}`}
                      </Text>
                      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                        {formatGhs(order.amount)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: 12,
                        color: c.secondary,
                        marginTop: 3,
                      }}>
                      Order NB-{order.id} · {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        gap: 5,
                        marginTop: 8,
                      }}>
                      <View
                        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
                      />
                      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11, color }}>
                        {statusLabel[order.status]}
                      </Text>
                    </View>
                    {order.status === 'PAID' ? (
                      <Pressable
                        onPress={() => void complete(order)}
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: c.ink,
                          borderRadius: 9,
                          paddingVertical: 7,
                          paddingHorizontal: 10,
                          marginTop: 10,
                        }}>
                        <Text
                          style={{ fontFamily: FONTS.extrabold, fontSize: 11, color: c.surface }}>
                          Confirm received
                        </Text>
                      </Pressable>
                    ) : null}
                    {order.status === 'COMPLETED' && !reviewedOrders.has(order.id) ? (
                      <Pressable
                        onPress={() => setReviewing(reviewing === order.id ? null : order.id)}
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: c.chip,
                          borderRadius: 9,
                          paddingVertical: 7,
                          paddingHorizontal: 10,
                          marginTop: 10,
                        }}>
                        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11, color: c.ink }}>
                          Leave a review
                        </Text>
                      </Pressable>
                    ) : null}
                    {reviewing === order.id ? (
                      <View style={{ marginTop: 10, gap: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Pressable key={value} onPress={() => setRating(value)}>
                              <Text
                                style={{
                                  fontSize: 22,
                                  color: value <= rating ? '#F5A623' : c.border,
                                }}>
                                ★
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <TextInput
                          value={comment}
                          onChangeText={setComment}
                          placeholder="How was your experience?"
                          placeholderTextColor={c.muted}
                          multiline
                          style={{
                            backgroundColor: c.chip,
                            borderRadius: 10,
                            padding: 10,
                            color: c.ink,
                            fontFamily: FONTS.medium,
                            minHeight: 64,
                          }}
                        />
                        <Pressable
                          onPress={() => void submitReview(order)}
                          style={{
                            alignSelf: 'flex-start',
                            backgroundColor: c.ink,
                            borderRadius: 9,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                          }}>
                          <Text
                            style={{ fontFamily: FONTS.extrabold, fontSize: 11, color: c.surface }}>
                            Post review
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        {sales.length > 0 ? (
          <Text
            style={{ fontFamily: FONTS.extrabold, color: c.ink, marginTop: 22, marginBottom: 10 }}>
            Sales
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {sales.map((order) => {
            const listing = findListing(order.listingId);
            const color = statusColor(order.status, c);
            return (
              <View
                key={`sale-${order.id}`}
                style={{
                  backgroundColor: c.surface,
                  borderRadius: 16,
                  padding: 14,
                  ...SHADOWS.row,
                }}>
                <Text style={{ fontFamily: FONTS.extrabold, color: c.ink }}>
                  {listing?.title || `Listing #${order.listingId}`}
                </Text>
                <Text style={{ fontFamily: FONTS.medium, color: c.secondary, marginTop: 3 }}>
                  {formatGhs(order.amount)} · Order NB-{order.id}
                </Text>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11, color, marginTop: 8 }}>
                  {statusLabel[order.status]}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
