import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useListings } from '@/components/ListingsContext';
import { MyListingCard } from '@/components/MyListingCard';
import { useToast } from '@/components/ToastContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES } from '@/lib/theme';

// My Listings locks the accent to brand green.
const theme = MODES.shop;

export default function Listings() {
  const router = useRouter();
  const { myListings, removeListing, setListingStatus } = useListings();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* top bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: c.surface }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center',
            gap: 12,
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: c.hairline,
          }}>
          <Pressable
            onPress={() => router.back()}
            style={{ alignItems: 'center', justifyContent: 'center',  width: 36, height: 36, borderRadius: 11, backgroundColor: c.chip }}>
            <ChevronLeft size={17} color={c.ink} strokeWidth={2.6} />
          </Pressable>
          <Text style={{ flex: 1, fontFamily: FONTS.extrabold, fontSize: 17, color: c.ink, letterSpacing: -0.4 }}>
            My listings
          </Text>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 12.5, color: c.muted }}>
            {myListings.filter((listing) => listing.status === 'ACTIVE').length} active
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        <Pressable
          onPress={() => router.push('/create')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            backgroundColor: theme.accent,
            paddingVertical: 14,
            borderRadius: 14,
            marginBottom: 18,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}>
          <Plus size={16} color={theme.accentText} strokeWidth={3} />
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: theme.accentText }}>New listing</Text>
        </Pressable>

        <View style={{ gap: 12 }}>
          {myListings.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              onToggle={() => {
                void setListingStatus(listing, listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')
                  .then(() => showToast(listing.status === 'ACTIVE' ? 'Listing paused' : 'Listing reactivated'))
                  .catch((error) =>
                    showToast(error instanceof Error ? error.message : 'Could not update listing')
                  );
              }}
              onEdit={() =>
                Alert.alert('Delete listing?', listing.title, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      void removeListing(listing)
                        .then(() => showToast('Listing deleted'))
                        .catch((error) =>
                          showToast(error instanceof Error ? error.message : 'Could not delete listing')
                        );
                    },
                  },
                ])
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
