import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiNotification, notificationsApi } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';

const theme = MODES.shop;
const ON_TINT = '#111317';

export default function Notifications() {
  const c = useColors();
  const { isDark } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems(await notificationsApi.all(token));
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Could not load notifications'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const open = async (item: ApiNotification) => {
    if (token && !item.read) {
      try {
        const updated = await notificationsApi.markRead(token, item.id);
        setItems((current) => current.map((value) => (value.id === updated.id ? updated : value)));
      } catch {
        /* The destination remains usable if marking read fails. */
      }
    }
    if (item.route?.startsWith('/')) router.push(item.route as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Notifications" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={c.ink} /> : null}
        {error ? (
          <Text style={{ fontFamily: FONTS.semibold, color: c.danger }}>{error}</Text>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <Text style={{ fontFamily: FONTS.medium, color: c.secondary }}>
            No notifications yet.
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => void open(item)}
              style={{
                flexDirection: 'row',
                gap: 13,
                backgroundColor: c.surface,
                borderRadius: 16,
                paddingVertical: 13,
                paddingHorizontal: 14,
                alignItems: 'flex-start',
                ...SHADOWS.row,
              }}>
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: theme.tagBg,
                  borderWidth: 1,
                  borderColor: theme.tagBorder,
                }}>
                <Bell size={17} color={ON_TINT} strokeWidth={2.2} />
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
                    style={{ flex: 1, fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: c.muted }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 12.5,
                    color: c.secondary,
                    marginTop: 3,
                    lineHeight: 17,
                  }}>
                  {item.body}
                </Text>
              </View>
              {!item.read ? (
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: theme.accent,
                    marginTop: 4,
                  }}
                />
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
