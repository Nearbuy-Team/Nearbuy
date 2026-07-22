import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

interface SubHeaderProps {
  title: string;
  right?: ReactNode;
}

// Shared white top bar with a back chevron — used by the secondary stack pages
// (Notifications, Orders, Reviews, Payment methods, Settings, Category, etc.).
export function SubHeader({ title, right }: SubHeaderProps) {
  const router = useRouter();
  const c = useColors();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: c.surface }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.hairline,
        }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: c.chip,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          })}>
          <ChevronLeft size={17} color={c.ink} strokeWidth={2.6} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.extrabold,
            fontSize: 17,
            color: c.ink,
            letterSpacing: -0.4,
          }}>
          {title}
        </Text>
        {right}
      </View>
    </SafeAreaView>
  );
}
