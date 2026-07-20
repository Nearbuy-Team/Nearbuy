import { useRouter } from 'expo-router';
import { Bell, MapPin, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ModeSelector } from '@/components/ModeSelector';
import { useMode } from '@/components/ModeContext';
import { BrandMark } from '@/components/BrandMark';
import { SearchBar } from '@/components/SearchBar';
import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

interface AppHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function AppHeader({ query, onQueryChange }: AppHeaderProps) {
  const { theme } = useMode();
  const c = useColors();
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: c.surface,
        paddingTop: 4,
        paddingHorizontal: 20,
        paddingBottom: 16,
        // bottom hairline
        borderBottomWidth: 1,
        borderBottomColor: c.hairline,
      }}>
      {/* brand row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <BrandMark size={28} />
            <Text
              style={{
                fontFamily: FONTS.extrabold,
                fontSize: 22,
                letterSpacing: -0.6,
                color: c.ink,
              }}>
              Nearbuy
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 1 }}>
            <MapPin size={11} color={c.secondaryAlt} strokeWidth={2.4} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 11.5, color: c.secondaryAlt }}>
              East Legon · 5 km radius
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          {/* + Sell pill */}
          <Pressable
            onPress={() => router.push('/create')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderRadius: 13,
              backgroundColor: theme.accent,
              paddingVertical: 9,
              paddingHorizontal: 13,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}>
            <Plus size={14} color={theme.accentText} strokeWidth={3} />
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13, color: theme.accentText }}>
              Sell
            </Text>
          </Pressable>

          {/* bell button */}
          <Pressable
            onPress={() => router.push('/notifications')}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              backgroundColor: c.chip,
              width: 42,
              height: 42,
            }}>
            <Bell size={20} color={c.ink} strokeWidth={2} />
            <View
              style={{
                position: 'absolute',
                top: 9,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.accent,
                borderWidth: 2,
                borderColor: c.chip,
              }}
            />
          </Pressable>
        </View>
      </View>

      <ModeSelector />
      <SearchBar placeholder={theme.searchHint} query={query} onQueryChange={onQueryChange} />
    </View>
  );
}
