import { Star } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { COLORS, FONTS } from '@/lib/theme';
import type { TrustTier } from '@/lib/mockData';

export function TrustBadge({ tier }: { tier: TrustTier }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingVertical: 5,
        paddingHorizontal: 9,
        borderRadius: 9,
      }}>
      <Star size={11} color={COLORS.ink} fill={COLORS.ink} strokeWidth={2.4} />
      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 10.5, color: COLORS.ink }}>{tier}</Text>
    </View>
  );
}
