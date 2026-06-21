import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS } from '@/lib/theme';

export default function CreateListing() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <StatusBar style="dark" />
      {/* top bar */}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 14 }}>
        <Pressable
          onPress={() => router.back()}
          className="items-center justify-center rounded-xl bg-chip"
          style={{ width: 36, height: 36 }}>
          <X size={18} color={COLORS.ink} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ fontFamily: FONTS.extrabold, fontSize: 17, color: COLORS.ink }}>
          Create listing
        </Text>
      </View>

      <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13.5,
            color: COLORS.secondary,
            textAlign: 'center',
          }}>
          The full Create Listing flow is built in Step 8. The center “+” opens this modal.
        </Text>
      </View>
    </SafeAreaView>
  );
}
