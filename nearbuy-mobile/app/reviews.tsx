import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Star } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiReview, reviewsApi } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';

const theme = MODES.shop;
const ON_TINT = '#111317';

function Stars({ rating }: { rating: number }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={13}
          color={value <= rating ? '#F5A623' : c.border}
          fill={value <= rating ? '#F5A623' : c.border}
          strokeWidth={0}
        />
      ))}
    </View>
  );
}

export default function Reviews() {
  const c = useColors();
  const { isDark } = useTheme();
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setReviews(await reviewsApi.mine(token));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [token]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Reviews & TrustScore" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            backgroundColor: c.surface,
            borderRadius: 20,
            padding: 18,
            marginBottom: 20,
            ...SHADOWS.card,
          }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: theme.tagBg,
              borderWidth: 1,
              borderColor: theme.tagBorder,
            }}>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 22, color: ON_TINT }}>
              {user?.trustScore ?? 0}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 16, color: c.ink }}>
              TrustScore {user?.trustScore ?? 0}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 12.5,
                color: c.secondary,
                marginTop: 3,
              }}>
              {reviews.length} verified order review{reviews.length === 1 ? '' : 's'}
            </Text>
            <View style={{ marginTop: 6 }}>
              <Stars rating={Math.round(average)} />
            </View>
          </View>
        </View>
        {loading ? <ActivityIndicator color={c.ink} /> : null}
        {error ? (
          <Text style={{ fontFamily: FONTS.semibold, color: c.danger }}>{error}</Text>
        ) : null}
        {!loading && !error && reviews.length === 0 ? (
          <Text style={{ fontFamily: FONTS.medium, color: c.secondary }}>
            No reviews yet. Reviews can only be left after a completed order.
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {reviews.map((review) => (
            <View
              key={review.id}
              style={{ backgroundColor: c.surface, borderRadius: 16, padding: 14, ...SHADOWS.row }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: theme.tagBg,
                    borderWidth: 1,
                    borderColor: theme.tagBorder,
                  }}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 12, color: ON_TINT }}>
                    B{review.reviewerId}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                    Verified buyer
                  </Text>
                  <View style={{ marginTop: 3 }}>
                    <Stars rating={review.rating} />
                  </View>
                </View>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: c.muted }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  color: c.secondary,
                  marginTop: 11,
                  lineHeight: 19,
                }}>
                {review.comment}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
