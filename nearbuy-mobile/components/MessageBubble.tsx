import { Text, View } from 'react-native';

import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

export function MessageBubble({
  message,
}: {
  message: { mine: boolean; text: string; time: string };
}) {
  const mine = message.mine;
  const c = useColors();

  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
      <View
        style={{
          // Mine = inverted "ink" bubble; theirs = surface card. Both flip in dark.
          backgroundColor: mine ? c.ink : c.surface,
          paddingVertical: 10,
          paddingHorizontal: 13,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: mine ? 16 : 5,
          borderBottomRightRadius: mine ? 5 : 16,
          shadowColor: '#111317',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 1,
        }}>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13.5,
            lineHeight: 19,
            color: mine ? c.surface : c.ink,
          }}>
          {message.text}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FONTS.semibold,
          fontSize: 9.5,
          color: c.muted,
          marginTop: 4,
          alignSelf: mine ? 'flex-end' : 'flex-start',
        }}>
        {message.time}
      </Text>
    </View>
  );
}
