import { StatusBar } from 'expo-status-bar';
import { SearchX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { ListingCard } from '@/components/ListingCard';
import { MODE_TO_LISTING_TYPE, useListings } from '@/components/ListingsContext';
import { useMode } from '@/components/ModeContext';
import { PromoStrip } from '@/components/PromoStrip';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

export default function Home() {
  const { mode, theme } = useMode();
  const c = useColors();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const { listings, isLoading, error, refresh } = useListings();

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const cards = useMemo(() => {
    const all = listings.filter((listing) => listing.type === MODE_TO_LISTING_TYPE[mode]);
    if (!q) return all;
    return all.filter((listing) =>
      [listing.title, listing.description || '', listing.type]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [listings, mode, q]);

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: c.surface }}>
        <AppHeader query={query} onQueryChange={setQuery} />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />}
        contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 110 }}>
        {!searching && <PromoStrip />}

        {/* section header */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',  marginBottom: 14 }}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 17, color: c.ink, letterSpacing: -0.4 }}>
            {searching ? 'Results' : 'Popular near you'}
          </Text>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 12.5, color: c.muted }}>
            {searching ? `${cards.length} found` : 'See all'}
          </Text>
        </View>

        {!!error && (
          <Text style={{ fontFamily: FONTS.semibold, color: c.danger, marginBottom: 12 }}>{error}</Text>
        )}

        {isLoading && listings.length === 0 ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 48 }} />
        ) : cards.length > 0 ? (
          <View style={{ gap: 16 }}>
            {cards.map((listing, i) => (
              // Keying by mode remounts the cards when the mode switches, so each
              // one re-runs its entrance — a staggered rise-in on every mode swap.
              // Filtering within a mode keeps the same keys, so search doesn't animate.
              <Animated.View
                key={`${mode}-${listing.id}`}
                entering={FadeInDown.duration(320).delay(i * 55)}>
                <ListingCard listing={listing} />
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View key={`empty-${q}`} entering={FadeIn.duration(240)} style={{ alignItems: 'center',  paddingTop: 48, gap: 14 }}>
            <View
              style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 16,  width: 64, height: 64, backgroundColor: theme.tagBg, borderWidth: 1, borderColor: theme.tagBorder }}>
              <SearchX size={28} color={c.secondary} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15.5, color: c.ink, letterSpacing: -0.3 }}>
              No matches for “{query.trim()}”
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: c.secondary, textAlign: 'center' }}>
              Try a different keyword or switch modes.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
