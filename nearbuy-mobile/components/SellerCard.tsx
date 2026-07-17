import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useColors } from '@/lib/ThemeContext';
import { FONTS, SHADOWS, type ModeTheme } from '@/lib/theme';

// Text/icons on a mode tint (theme.tagBg) stay dark — the tint is light in both schemes.
const ON_TINT = '#111317';

interface SellerCardProps {
  seller: { name: string; initial: string; trustScore: number };
  theme: ModeTheme;
  onMessage: () => void;
}

export function SellerCard({ seller, theme, onMessage }: SellerCardProps) {
  const c = useColors();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center',  gap: 13, backgroundColor: c.surface, borderRadius: 18, padding: 14, ...SHADOWS.card }}>
      <View
        style={{ alignItems: 'center', justifyContent: 'center', 
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: theme.tagBg,
          borderWidth: 1,
          borderColor: theme.tagBorder,
        }}>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 16, color: ON_TINT }}>{seller.initial}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONTS.extrabold, fontSize: 14.5, color: c.ink }}>
          {seller.name}
        </Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', 
            gap: 4,
            marginTop: 3,
            backgroundColor: theme.tagBg,
            borderWidth: 1,
            borderColor: theme.tagBorder,
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 8,
          }}>
          <Check size={10} color={ON_TINT} strokeWidth={2.8} />
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 10, color: ON_TINT }}>
            Verified · TrustScore {seller.trustScore}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onMessage}
        style={({ pressed }) => ({
          backgroundColor: c.chip,
          paddingVertical: 9,
          paddingHorizontal: 13,
          borderRadius: 11,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 12, color: c.ink }}>Message</Text>
      </Pressable>
    </View>
  );
}
