import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Lock, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/MessageBubble';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiMessage, chatsApi } from '@/lib/api';
import { FONTS, MODES, type Mode } from '@/lib/theme';

const theme = MODES.shop;
const ON_TINT = '#111317';

export default function Conversation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    otherUserId?: string;
    listingId?: string;
    name?: string;
    initial?: string;
    listTitle?: string;
    listSub?: string;
    listMode?: Mode;
  }>();
  const otherUserId = Number(params.otherUserId ?? params.id);
  const listingId = Number(params.listingId);
  const name = params.name || `Member #${otherUserId}`;
  const initial = params.initial || name[0]?.toUpperCase() || 'N';

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token || !Number.isFinite(listingId) || !Number.isFinite(otherUserId)) {
      setLoading(false);
      return;
    }
    let active = true;
    chatsApi
      .conversation(token, listingId, otherUserId)
      .then((loaded) => active && setMessages(loaded))
      .catch(
        (error) =>
          active &&
          showToast(error instanceof Error ? error.message : 'Could not load conversation')
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [listingId, otherUserId, showToast, token]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !token || sending) return;
    if (!Number.isFinite(listingId) || !Number.isFinite(otherUserId))
      return showToast('Conversation details are missing');
    setSending(true);
    try {
      const sent = await chatsApi.send(token, { listingId, receiverId: otherUserId, content });
      setMessages((current) => [...current, sent]);
      setDraft('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Message could not be sent');
    } finally {
      setSending(false);
    }
  };

  const openListing = () => {
    if (!Number.isFinite(listingId)) return;
    router.push({
      pathname: '/listing/[id]',
      params: { id: String(listingId), mode: params.listMode || 'shop' },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: c.surface }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: c.hairline,
          }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: c.chip,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}>
            <ChevronLeft size={17} color={c.ink} strokeWidth={2.6} />
          </Pressable>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: theme.tagBg,
              borderWidth: 1,
              borderColor: theme.tagBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: ON_TINT }}>
              {initial}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: c.ink }}>
              {name}
            </Text>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: c.success }}>
              Nearbuy member
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: c.chip,
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}>
        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: c.imgBg }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: FONTS.extrabold, fontSize: 12, color: c.ink }}>
            {params.listTitle || `Listing #${listingId}`}
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 11, color: c.secondary }}>
            {params.listSub || ''}
          </Text>
        </View>
        <Pressable
          onPress={openListing}
          style={{
            backgroundColor: c.surface,
            paddingVertical: 7,
            paddingHorizontal: 11,
            borderRadius: 9,
          }}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 11, color: c.ink }}>View</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 16, gap: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              gap: 6,
              backgroundColor: c.hairline,
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 12,
              marginBottom: 4,
            }}>
            <Lock size={12} color={c.secondary} strokeWidth={2.2} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 10.5, color: c.secondary }}>
              Keep payments in Nearbuy · never share OTP codes
            </Text>
          </View>
          {loading ? <ActivityIndicator color={c.ink} /> : null}
          {!loading && messages.length === 0 ? (
            <Text style={{ fontFamily: FONTS.medium, color: c.secondary, textAlign: 'center' }}>
              Start the conversation.
            </Text>
          ) : null}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                mine: message.senderId === user?.id,
                text: message.content,
                time: new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }}
            />
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surface,
            gap: 9,
            paddingHorizontal: 14,
            paddingTop: 11,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopWidth: 1,
            borderTopColor: c.hairline,
          }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={c.muted}
            onSubmitEditing={() => void send()}
            returnKeyType="send"
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: c.chip,
              borderRadius: 13,
              paddingVertical: 12,
              paddingHorizontal: 14,
              fontFamily: FONTS.medium,
              fontSize: 13.5,
              color: c.ink,
            }}
          />
          <Pressable
            onPress={() => void send()}
            disabled={sending}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: theme.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}>
            {sending ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Send size={19} color={theme.accentText} strokeWidth={2.4} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
