import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { LISTING_TYPE_TO_MODE } from '@/components/ListingsContext';
import { useMode } from '@/components/ModeContext';
import { Tag } from '@/components/Tag';
import { TrustBadge } from '@/components/TrustBadge';
import { useColors } from '@/lib/ThemeContext';
import { type ApiListing, formatGhs, resolveApiUrl } from '@/lib/api';
import { FONTS, SHADOWS } from '@/lib/theme';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

export function ListingCard({ listing }: { listing: ApiListing }) {
  const { theme } = useMode();
  const c = useColors();
  const router = useRouter();
  const mode = LISTING_TYPE_TO_MODE[listing.type];
  const tags = [
    listing.type === 'GOOD' ? 'Item' : listing.type === 'SERVICE' ? 'Service' : 'Rental',
    `${listing.viewCount} views`,
    'Escrow protected',
  ];

  const openDetail = () =>
    router.push({ pathname: '/listing/[id]', params: { id: String(listing.id), mode } });
  const openCheckout = () =>
    router.push({ pathname: '/checkout', params: { id: String(listing.id), mode } });

  return (
    <View
      style={{ backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden', ...SHADOWS.card }}>
      {/* image placeholder area — tap opens Listing Detail */}
      <Pressable
        onPress={openDetail}
        style={{
          height: 152,
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
              fontSize: 10.5,
              color: '#B6B6B1',
              letterSpacing: 0.3,
              backgroundColor: 'rgba(255,255,255,0.6)',
              paddingVertical: 4,
              paddingHorizontal: 9,
              borderRadius: 7,
              overflow: 'hidden',
            }}>
            {listing.type.toLowerCase()} · {listing.title}
          </Text>
        )}

        {/* trust badge top-left */}
        <View style={{ position: 'absolute', top: 12, left: 12 }}>
          <TrustBadge tier="Silver" />
        </View>

        {/* price chip top-right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            position: 'absolute',
            top: 12,
            right: 12,
            gap: 4,
            backgroundColor: 'rgba(17,19,23,0.82)',
            paddingVertical: 6,
            paddingHorizontal: 11,
            borderRadius: 11,
          }}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 12.5, color: '#FFFFFF' }}>
            {formatGhs(listing.price)}
          </Text>
        </View>
      </Pressable>

      {/* body */}
      <View style={{ paddingTop: 15, paddingHorizontal: 16, paddingBottom: 16 }}>
        <Pressable onPress={openDetail}>
          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 15.5,
              color: c.ink,
              letterSpacing: -0.3,
            }}>
            {listing.title}
          </Text>
        </Pressable>
        <Text
          style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: c.secondary, marginTop: 4 }}>
          {listing.description || 'Listed near you'}
        </Text>

        {/* tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
          {tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>

        {/* CTA → Checkout */}
        <Pressable
          onPress={openCheckout}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 15,
            width: '100%',
            backgroundColor: theme.accent,
            paddingVertical: 13,
            borderRadius: 14,
            gap: 7,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}>
          <Text
            style={{
              fontFamily: FONTS.extrabold,
              fontSize: 14,
              color: theme.accentText,
              letterSpacing: 0.1,
            }}>
            {theme.cta}
          </Text>
          <ArrowRight size={15} color={theme.accentText} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}
