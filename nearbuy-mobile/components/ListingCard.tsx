import { ArrowRight } from 'lucide-react-native';
import { Platform, Pressable, Text, View } from 'react-native';

import { useMode } from '@/components/ModeContext';
import { Tag } from '@/components/Tag';
import { TrustBadge } from '@/components/TrustBadge';
import { useToast } from '@/components/ToastContext';
import { COLORS, FONTS, SHADOWS } from '@/lib/theme';
import type { Listing } from '@/lib/mockData';

const MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

export function ListingCard({ listing }: { listing: Listing }) {
  const { theme } = useMode();
  const { showToast } = useToast();

  return (
    <View
      className="bg-surface"
      style={{ borderRadius: 22, overflow: 'hidden', ...SHADOWS.card }}>
      {/* image placeholder area */}
      <View style={{ height: 152, backgroundColor: '#EDEDEA', alignItems: 'center', justifyContent: 'center' }}>
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
          {listing.imgLabel}
        </Text>

        {/* trust badge top-left */}
        <View style={{ position: 'absolute', top: 12, left: 12 }}>
          <TrustBadge tier={listing.trust} />
        </View>

        {/* price chip top-right */}
        <View
          className="flex-row items-center"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            gap: 4,
            backgroundColor: 'rgba(17,19,23,0.82)',
            paddingVertical: 6,
            paddingHorizontal: 11,
            borderRadius: 11,
          }}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 12.5, color: '#FFFFFF' }}>{listing.price}</Text>
          {listing.unit !== '' && (
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 10.5, color: 'rgba(255,255,255,0.65)' }}>
              {listing.unit}
            </Text>
          )}
        </View>
      </View>

      {/* body */}
      <View style={{ paddingTop: 15, paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15.5, color: COLORS.ink, letterSpacing: -0.3 }}>
          {listing.title}
        </Text>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: COLORS.secondary, marginTop: 4 }}>
          {listing.meta}
        </Text>

        {/* tags */}
        <View className="flex-row flex-wrap" style={{ gap: 7, marginTop: 12 }}>
          {listing.tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => showToast(`${theme.toast} · ${listing.title}`)}
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
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: theme.accentText, letterSpacing: 0.1 }}>
            {theme.cta}
          </Text>
          <ArrowRight size={15} color={theme.accentText} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}
