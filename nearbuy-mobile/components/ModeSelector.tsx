import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useMode } from '@/components/ModeContext';
import { COLORS, FONTS, MODES, type Mode } from '@/lib/theme';

const ORDER: Mode[] = ['shop', 'services', 'rent'];
const LABELS: Record<Mode, string> = { shop: 'SHOP', services: 'SERVICES', rent: 'RENT' };
const TRACK_PADDING = 5;

export function ModeSelector() {
  const { mode, setMode, theme } = useMode();
  const index = ORDER.indexOf(mode);

  // We measure the track's width once it lays out, so we can compute how far
  // the pill must slide. (Reanimated animates pixels, not CSS percentages.)
  const [trackWidth, setTrackWidth] = useState(0);
  const pillWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / 3 : 0;

  // A "shared value" is a number that lives on the animation thread so the pill
  // can move at 60fps without going through React. We spring it to its target.
  const translateX = useSharedValue(0);
  useEffect(() => {
    translateX.value = withSpring(index * pillWidth, {
      damping: 15,
      stiffness: 180,
      mass: 1,
    });
  }, [index, pillWidth, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className="relative flex-row rounded-2xl bg-track"
      style={{ padding: TRACK_PADDING }}>
      {/* sliding pill — absolutely positioned, slides under the active label */}
      {pillWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: TRACK_PADDING,
              left: TRACK_PADDING,
              bottom: TRACK_PADDING,
              width: pillWidth,
              borderRadius: 12,
              backgroundColor: theme.accent,
              ...SHADOW,
            },
            pillStyle,
          ]}
        />
      )}

      {ORDER.map((m) => {
        const active = m === mode;
        return (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            className="flex-1 items-center"
            style={{ paddingVertical: 11 }}>
            <Text
              style={{
                fontFamily: FONTS.extrabold,
                fontSize: 12.5,
                letterSpacing: 0.6,
                color: active ? MODES[m].accentText : COLORS.segInactive,
              }}>
              {LABELS[m]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SHADOW = {
  shadowColor: '#111317',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 3,
};
