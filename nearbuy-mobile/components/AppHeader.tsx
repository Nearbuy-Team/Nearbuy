import { Bell, Home, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ModeSelector } from '@/components/ModeSelector';
import { useMode } from '@/components/ModeContext';
import { SearchBar } from '@/components/SearchBar';
import { useToast } from '@/components/ToastContext';
import { COLORS, FONTS } from '@/lib/theme';

interface AppHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function AppHeader({ query, onQueryChange }: AppHeaderProps) {
  const { theme } = useMode();
  const { showToast } = useToast();

  return (
    <View
      className="bg-surface"
      style={{
        paddingTop: 4,
        paddingHorizontal: 20,
        paddingBottom: 16,
        // bottom hairline
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(17,19,23,0.05)',
      }}>
      {/* brand row */}
      <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
        <View style={{ gap: 2 }}>
          <View className="flex-row items-center" style={{ gap: 9 }}>
            <View
              className="items-center justify-center"
              style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: theme.accent }}>
              <Home size={14} color={theme.accentText} strokeWidth={2.4} />
            </View>
            <Text
              style={{ fontFamily: FONTS.extrabold, fontSize: 22, letterSpacing: -0.6, color: COLORS.ink }}>
              Nearbuy
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 5, paddingLeft: 1 }}>
            <MapPin size={11} color={COLORS.secondaryAlt} strokeWidth={2.4} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 11.5, color: COLORS.secondaryAlt }}>
              East Legon · 5 km radius
            </Text>
          </View>
        </View>

        {/* bell button */}
        <Pressable
          onPress={() => showToast('No new notifications')}
          className="items-center justify-center rounded-2xl bg-chip"
          style={{ width: 42, height: 42 }}>
          <Bell size={20} color="#3A3D44" strokeWidth={2} />
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
              borderColor: COLORS.chip,
            }}
          />
        </Pressable>
      </View>

      <ModeSelector />
      <SearchBar placeholder={theme.searchHint} query={query} onQueryChange={onQueryChange} />
    </View>
  );
}
