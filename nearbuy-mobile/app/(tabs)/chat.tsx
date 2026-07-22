import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LISTING_TYPE_TO_MODE, useListings } from '@/components/ListingsContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiMessage, chatsApi, formatGhs, type PublicUser, usersApi } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';

const theme = MODES.shop;
const ON_TINT = '#111317';

interface Thread {
  listingId: number;
  otherUserId: number;
  last: ApiMessage;
  profile?: PublicUser;
}

export default function Chat() {
  const router = useRouter();
  const c = useColors();
  const { isDark } = useTheme();
  const { token, user } = useAuth();
  const { findListing } = useListings();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const messages = await chatsApi.mine(token);
      const latest = new Map<string, Thread>();
      for (const message of messages) {
        const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
        const key = `${message.listingId}:${otherUserId}`;
        if (!latest.has(key))
          latest.set(key, { listingId: message.listingId, otherUserId, last: message });
      }
      const next = Array.from(latest.values());
      const profiles = await Promise.all(
        next.map((thread) =>
          usersApi.publicProfile(token, thread.otherUserId).catch(() => undefined)
        )
      );
      setThreads(next.map((thread, index) => ({ ...thread, profile: profiles[index] })));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text
        style={{
          fontFamily: FONTS.extrabold,
          fontSize: 22,
          color: c.ink,
          letterSpacing: -0.5,
          marginTop: 8,
          paddingHorizontal: 20,
        }}>
        Messages
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 110 }}>
        {loading && threads.length === 0 ? <ActivityIndicator color={c.ink} /> : null}
        {!!error && <Text style={{ fontFamily: FONTS.semibold, color: c.danger }}>{error}</Text>}
        {!loading && !error && threads.length === 0 ? (
          <Text style={{ fontFamily: FONTS.medium, color: c.secondary }}>
            No conversations yet. Open a listing to message its seller.
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {threads.map((thread) => {
            const listing = findListing(thread.listingId);
            const name = thread.profile?.fullName || `Member #${thread.otherUserId}`;
            const initial = name
              .split(/\s+/)
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Pressable
                key={`${thread.listingId}:${thread.otherUserId}`}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: {
                      id: String(thread.otherUserId),
                      otherUserId: String(thread.otherUserId),
                      listingId: String(thread.listingId),
                      name,
                      initial,
                      listTitle: listing?.title || `Listing #${thread.listingId}`,
                      listSub: listing ? formatGhs(listing.price) : '',
                      listMode: listing ? LISTING_TYPE_TO_MODE[listing.type] : 'shop',
                    },
                  })
                }
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  backgroundColor: c.surface,
                  borderRadius: 16,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                  ...SHADOWS.row,
                })}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: theme.tagBg,
                    borderWidth: 1,
                    borderColor: theme.tagBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 16, color: ON_TINT }}>
                    {initial || 'N'}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: FONTS.extrabold,
                        fontSize: 14.5,
                        color: c.ink,
                      }}>
                      {name}
                    </Text>
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: c.muted }}>
                      {new Date(thread.last.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: 12.5,
                      color: c.secondary,
                      marginTop: 3,
                    }}>
                    {thread.last.content}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
