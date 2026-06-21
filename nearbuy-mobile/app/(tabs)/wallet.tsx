import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS } from '@/lib/theme';

export default function Wallet() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas" style={{ paddingHorizontal: 20 }}>
      <StatusBar style="dark" />
      <Text style={{ fontFamily: FONTS.extrabold, fontSize: 22, color: COLORS.ink, marginTop: 8 }}>
        Wallet
      </Text>
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: FONTS.medium, fontSize: 13.5, color: COLORS.secondary }}>
          Balance & activity coming in Step 6.
        </Text>
      </View>
    </SafeAreaView>
  );
}
