import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/ToastContext';
import { COLORS, FONTS, MODES, SHADOWS } from '@/lib/theme';
import { CHAT_THREADS } from '@/lib/mockData';

// Chat is not a header tab → accent locks to brand green.
const theme = MODES.shop;

export default function Chat() {
  const { showToast } = useToast();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <Text
        style={{
          fontFamily: FONTS.extrabold,
          fontSize: 22,
          color: COLORS.ink,
          letterSpacing: -0.5,
          marginTop: 8,
          paddingHorizontal: 20,
        }}>
        Messages
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 110 }}>
        <View style={{ gap: 12 }}>
          {CHAT_THREADS.map((thread) => (
            <Pressable
              key={thread.name}
              onPress={() => showToast(`Opening chat · ${thread.name}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                paddingVertical: 13,
                paddingHorizontal: 14,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                ...SHADOWS.row,
              })}>
              {/* avatar tile */}
              <View
                className="items-center justify-center"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: theme.tagBg,
                  borderWidth: 1,
                  borderColor: theme.tagBorder,
                }}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 16, color: COLORS.ink }}>
                  {thread.initial}
                </Text>
                {thread.unread && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -3,
                      width: 13,
                      height: 13,
                      borderRadius: 7,
                      backgroundColor: theme.accent,
                      borderWidth: 2,
                      borderColor: COLORS.surface,
                    }}
                  />
                )}
              </View>

              {/* name + last message */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, fontFamily: FONTS.extrabold, fontSize: 14.5, color: COLORS.ink }}>
                    {thread.name}
                  </Text>
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.muted }}>
                    {thread.time}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: FONTS.medium, fontSize: 12.5, color: COLORS.secondary, marginTop: 3 }}>
                  {thread.last}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
