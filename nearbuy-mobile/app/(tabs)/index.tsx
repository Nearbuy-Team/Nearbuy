import { StatusBar } from 'expo-status-bar';
import { SearchX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { ListingCard } from '@/components/ListingCard';
import { useMode } from '@/components/ModeContext';
import { PromoStrip } from '@/components/PromoStrip';
import { COLORS, FONTS } from '@/lib/theme';
import { LISTINGS } from '@/lib/mockData';

export default function Home() {
  const { mode, theme } = useMode();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const cards = useMemo(() => {
    const all = LISTINGS[mode];
    if (!q) return all;
    return all.filter((listing) =>
      [listing.title, listing.meta, ...listing.tags]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [mode, q]);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.surface }}>
        <AppHeader query={query} onQueryChange={setQuery} />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 110 }}>
        {!searching && <PromoStrip />}

        {/* section header */}
        <View className="flex-row items-baseline justify-between" style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 17, color: COLORS.ink, letterSpacing: -0.4 }}>
            {searching ? 'Results' : 'Popular near you'}
          </Text>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 12.5, color: COLORS.muted }}>
            {searching ? `${cards.length} found` : 'See all'}
          </Text>
        </View>

        {cards.length > 0 ? (
          <View style={{ gap: 16 }}>
            {cards.map((listing) => (
              <ListingCard key={listing.title} listing={listing} />
            ))}
          </View>
        ) : (
          <View className="items-center" style={{ paddingTop: 48, gap: 14 }}>
            <View
              className="items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, backgroundColor: theme.tagBg, borderWidth: 1, borderColor: theme.tagBorder }}>
              <SearchX size={28} color={COLORS.secondary} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15.5, color: COLORS.ink, letterSpacing: -0.3 }}>
              No matches for “{query.trim()}”
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: COLORS.secondary, textAlign: 'center' }}>
              Try a different keyword or switch modes.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
