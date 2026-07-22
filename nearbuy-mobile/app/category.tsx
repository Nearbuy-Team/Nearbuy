import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';
import { ScrollView, Text, View, Pressable } from 'react-native';

import { useListings } from '@/components/ListingsContext';
import { SubHeader } from '@/components/SubHeader';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';
import { CATEGORIES } from '@/lib/mockData';

const theme = MODES.shop;

export default function Category() {
  const router = useRouter();
  const { draftCategory, setDraftCategory } = useListings();
  const cols = useColors();
  const { isDark } = useTheme();

  const pick = (c: string) => {
    setDraftCategory(c);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: cols.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Choose category" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: cols.surface,
            borderRadius: 16,
            overflow: 'hidden',
            ...SHADOWS.row,
          }}>
          {CATEGORIES.map((c, i) => {
            const selected = c === draftCategory;
            return (
              <Pressable
                key={c}
                onPress={() => pick(c)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 15,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < CATEGORIES.length - 1 ? 1 : 0,
                  borderBottomColor: cols.divider,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: cols.ink }}>
                  {c}
                </Text>
                {selected && <Check size={18} color={theme.accent} strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
