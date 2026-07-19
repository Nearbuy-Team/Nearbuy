import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  ChevronLeft,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LISTING_TYPE_TO_MODE, useListings } from '@/components/ListingsContext';
import { SellerCard } from '@/components/SellerCard';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors } from '@/lib/ThemeContext';
import {
  type ApiListing,
  formatGhs,
  listingsApi,
  resolveApiUrl,
  type PublicUser,
  usersApi,
} from '@/lib/api';
import { FONTS, MODES, SHADOWS, type Mode } from '@/lib/theme';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });
const ON_MEDIA = '#111317';
const ON_TINT = '#4A4D54';

export default function ListingDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { showToast } = useToast();
  const { token, user } = useAuth();
  const { findListing } = useListings();
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode?: Mode }>();
  const listingId = Number(id);
  const [listing, setListing] = useState<ApiListing | undefined>(() => findListing(listingId));
  const [sellerProfile, setSellerProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(!listing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !Number.isFinite(listingId)) return;
    let active = true;
    setLoading(true);
    listingsApi
      .get(token, listingId)
      .then(async (loaded) => {
        if (!active) return;
        setListing(loaded);
        try {
          const seller = await usersApi.publicProfile(token, loaded.sellerId);
          if (active) setSellerProfile(seller);
        } catch {
          // The listing remains usable if the public seller card cannot be loaded.
        }
      })
      .catch((requestError) => {
        if (active)
          setError(requestError instanceof Error ? requestError.message : 'Listing not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listingId, token]);

  const mode = listing ? LISTING_TYPE_TO_MODE[listing.type] : ((modeParam || 'shop') as Mode);
  const theme = MODES[mode];
  const seller = useMemo(() => {
    const name = sellerProfile?.fullName || `Seller #${listing?.sellerId ?? ''}`;
    const initial = name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return { name, initial: initial || 'S', trustScore: sellerProfile?.trustScore ?? 0 };
  }, [listing?.sellerId, sellerProfile]);

  const specs = listing
    ? [
        {
          k: 'Type',
          v:
            listing.type === 'GOOD'
              ? 'Item for sale'
              : listing.type === 'SERVICE'
                ? 'Service'
                : 'Rental',
        },
        { k: 'Status', v: listing.status[0] + listing.status.slice(1).toLowerCase() },
        { k: 'Views', v: String(listing.viewCount) },
        { k: 'Chats', v: String(listing.chatCount) },
      ]
    : [];
  const tags = listing
    ? [
        listing.type === 'GOOD' ? 'Shop' : listing.type === 'SERVICE' ? 'Services' : 'Rent',
        'Verified account',
        'Protected payment',
      ]
    : [];

  const openConversation = () => {
    if (!listing) return;
    if (user?.id === listing.sellerId) return showToast('This is your listing');
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: String(listing.sellerId),
        otherUserId: String(listing.sellerId),
        listingId: String(listing.id),
        name: seller.name,
        initial: seller.initial,
        listTitle: listing.title,
        listSub: formatGhs(listing.price),
        listMode: mode,
      },
    });
  };

  const openCheckout = () => {
    if (!listing) return;
    if (user?.id === listing.sellerId) return showToast('You cannot order your own listing');
    router.push({ pathname: '/checkout', params: { id: String(listing.id), mode } });
  };

  if (loading && !listing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.canvas,
        }}>
        <ActivityIndicator color={c.ink} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.canvas,
          padding: 24,
        }}>
        <Text style={{ fontFamily: FONTS.medium, color: c.secondary, textAlign: 'center' }}>
          {error || 'Listing not found.'}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: FONTS.extrabold, color: c.ink }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}>
        <View
          style={{
            height: 300,
            backgroundColor: c.imgBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {listing.imageUrls?.[0] ? (
            <Image
              source={{ uri: resolveApiUrl(listing.imageUrls[0]) }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Text
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: '#B6B6B1',
                backgroundColor: 'rgba(255,255,255,0.6)',
                paddingVertical: 5,
                paddingHorizontal: 11,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
              {listing.type.toLowerCase()} · {listing.title}
            </Text>
          )}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 52,
              left: 18,
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              ...SHADOWS.row,
            }}>
            <ChevronLeft size={18} color={ON_MEDIA} strokeWidth={2.6} />
          </Pressable>
          <Pressable
            onPress={() => showToast('Saved to favourites')}
            style={{
              position: 'absolute',
              top: 52,
              right: 18,
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              ...SHADOWS.row,
            }}>
            <Heart size={18} color={ON_MEDIA} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View
          style={{
            marginTop: -22,
            backgroundColor: c.canvas,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            paddingHorizontal: 20,
            paddingTop: 22,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.hairline,
                paddingVertical: 5,
                paddingHorizontal: 9,
                borderRadius: 9,
              }}>
              <Star size={11} color={c.ink} fill={c.ink} strokeWidth={2.4} />
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 10.5, color: c.ink }}>
                TrustScore {seller.trustScore}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color={c.muted} strokeWidth={2.4} />
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: c.secondary }}>
                Near you
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'flex-start',
            }}>
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.extrabold,
                fontSize: 21,
                color: c.ink,
                letterSpacing: -0.5,
                lineHeight: 26,
              }}>
              {listing.title}
            </Text>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 20, color: c.ink }}>
              {formatGhs(listing.price)}
            </Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <SellerCard seller={seller} theme={theme} onMessage={openConversation} />
          </View>

          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 13.5,
              color: c.ink,
              marginTop: 22,
              marginBottom: 11,
            }}>
            Details
          </Text>
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: 16,
              overflow: 'hidden',
              ...SHADOWS.row,
            }}>
            {specs.map((spec, index) => (
              <View
                key={spec.k}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 13,
                  paddingHorizontal: 15,
                  borderBottomWidth: index < specs.length - 1 ? 1 : 0,
                  borderBottomColor: c.divider,
                }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 12.5, color: c.secondary }}>
                  {spec.k}
                </Text>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 12.5, color: c.ink }}>
                  {spec.v}
                </Text>
              </View>
            ))}
          </View>

          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 13.5,
              color: c.ink,
              marginTop: 22,
              marginBottom: 10,
            }}>
            Description
          </Text>
          <Text
            style={{ fontFamily: FONTS.medium, fontSize: 13, color: c.secondary, lineHeight: 21 }}>
            {listing.description || 'No description was provided.'}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: theme.tagBg,
                  borderWidth: 1,
                  borderColor: theme.tagBorder,
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                  borderRadius: 9,
                }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 10.5, color: ON_TINT }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: c.surface,
              borderRadius: 14,
              padding: 13,
              paddingHorizontal: 14,
              marginTop: 18,
              ...SHADOWS.row,
            }}>
            <ShieldCheck size={18} color={c.ink} strokeWidth={2.1} />
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.semibold,
                fontSize: 11.5,
                color: c.secondary,
                lineHeight: 17,
              }}>
              Pay through Nearbuy. Seller payout starts only after the buyer confirms receipt.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: c.surface,
          gap: 11,
          paddingHorizontal: 18,
          paddingTop: 13,
          paddingBottom: Math.max(insets.bottom, 14),
          borderTopWidth: 1,
          borderTopColor: c.hairline,
        }}>
        <Pressable
          onPress={openConversation}
          style={({ pressed }) => ({
            width: 56,
            borderWidth: 1.5,
            borderColor: c.border,
            backgroundColor: c.surface,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}>
          <MessageCircle size={22} color={c.ink} strokeWidth={2.1} />
        </Pressable>
        <Pressable
          onPress={openCheckout}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.accent,
            borderRadius: 15,
            paddingVertical: 15,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
            {theme.cta}
          </Text>
          <ArrowRight size={16} color={theme.accentText} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}
