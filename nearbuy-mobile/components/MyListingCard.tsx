import { Eye, MessageCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { LISTING_TYPE_TO_MODE } from '@/components/ListingsContext';
import { useColors } from '@/lib/ThemeContext';
import { type ApiListing, formatGhs } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';

// Text on a mode tint (typeTheme.tagBg) stays dark — the tint is light in both schemes.
const ON_TINT = '#111317';

const TYPE_LABEL = {
  shop: 'Shop',
  services: 'Services',
  rent: 'Rent',
};

interface MyListingCardProps {
  listing: ApiListing;
  onToggle: () => void;
  onEdit: () => void;
}

export function MyListingCard({ listing, onToggle, onEdit }: MyListingCardProps) {
  const mode = LISTING_TYPE_TO_MODE[listing.type];
  const typeTheme = MODES[mode];
  const active = listing.status === 'ACTIVE';
  const c = useColors();
  const statusColor = active ? c.success : c.muted;

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: 18,
        padding: 14,
        ...SHADOWS.card,
      }}>
      <View style={{ flexDirection: 'row',  gap: 12, alignItems: 'flex-start' }}>
        {/* thumbnail */}
        <View style={{ width: 52, height: 52, borderRadius: 13, backgroundColor: c.imgBg }} />

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center',  gap: 7 }}>
            {/* type badge */}
            <Text
              style={{
                fontFamily: FONTS.extrabold,
                fontSize: 9.5,
                letterSpacing: 0.4,
                color: ON_TINT,
                paddingVertical: 3,
                paddingHorizontal: 7,
                borderRadius: 7,
                overflow: 'hidden',
                backgroundColor: typeTheme.tagBg,
                borderWidth: 1,
                borderColor: typeTheme.tagBorder,
              }}>
              {TYPE_LABEL[mode]}
            </Text>
            {/* status */}
            <View style={{ flexDirection: 'row', alignItems: 'center',  gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
              <Text style={{ fontFamily: FONTS.extrabold, fontSize: 10, color: statusColor }}>
                {listing.status[0] + listing.status.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={{ fontFamily: FONTS.extrabold, fontSize: 14.5, color: c.ink, letterSpacing: -0.3, marginTop: 6 }}>
            {listing.title}
          </Text>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: c.secondary, marginTop: 2 }}>
            {formatGhs(listing.price)}
          </Text>
        </View>
      </View>

      {/* footer: stats + actions */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center',  gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.divider }}>
        <View style={{ flexDirection: 'row', alignItems: 'center',  gap: 5 }}>
          <Eye size={13} color={c.muted} strokeWidth={2.2} />
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 11.5, color: c.secondary }}>
            {listing.viewCount} views
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center',  gap: 5 }}>
          <MessageCircle size={13} color={c.muted} strokeWidth={2.2} />
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 11.5, color: c.secondary }}>
            {listing.chatCount} chats
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={onToggle}
          style={({ pressed }) => ({
            backgroundColor: c.chip,
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 10,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, color: c.ink }}>
            {active ? 'Pause' : 'Activate'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => ({
            backgroundColor: c.ink,
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 10,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11.5, color: c.surface }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
