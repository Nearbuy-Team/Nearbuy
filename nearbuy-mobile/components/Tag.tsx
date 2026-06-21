import { Text, View } from 'react-native';

import { useMode } from '@/components/ModeContext';
import { FONTS } from '@/lib/theme';

export function Tag({ label }: { label: string }) {
  const { theme } = useMode();

  return (
    <View
      style={{
        backgroundColor: theme.tagBg,
        borderWidth: 1,
        borderColor: theme.tagBorder,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 9,
      }}>
      <Text style={{ fontFamily: FONTS.bold, fontSize: 10.5, color: '#4A4D54' }}>{label}</Text>
    </View>
  );
}
