import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { Check, ChevronRight, ImagePlus, Tag as TagIcon, MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MODE_TO_LISTING_TYPE, useListings } from '@/components/ListingsContext';
import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { listingsApi } from '@/lib/api';
import { FONTS, MODES, type Mode, type Palette } from '@/lib/theme';

// Icon on a mode tint (photo box) stays dark — the tint is light in both schemes.
const ON_TINT = '#111317';
const TRACK_PADDING = 5;
const TYPE_ORDER: Mode[] = ['shop', 'services', 'rent'];
const TYPE_BTN_LABEL: Record<Mode, string> = { shop: 'ITEM', services: 'SERVICE', rent: 'RENTAL' };
const TYPE_META: Record<Mode, { label: string; titlePh: string; pricePh: string }> = {
  shop: { label: 'Item for sale', titlePh: 'e.g. iPhone 13 Pro', pricePh: '4,200' },
  services: {
    label: 'Service offered',
    titlePh: 'e.g. AC Repair Technician',
    pricePh: '120 per visit',
  },
  rent: { label: 'Item for rent', titlePh: 'e.g. 25kVA Generator', pricePh: '450 per day' },
};

const FieldLabel = ({ children, style }: { children: string; style?: object }) => {
  const c = useColors();
  return (
    <Text
      style={[
        { fontFamily: FONTS.extrabold, fontSize: 12.5, letterSpacing: 0.2, color: c.secondary },
        style,
      ]}>
      {children}
    </Text>
  );
};

// Inline segmented control — themes the modal accent locally, independent of the
// global mode. (Same animated-pill technique as ModeSelector.)
function TypeSelector({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const c = useColors();
  const index = TYPE_ORDER.indexOf(value);
  const [trackWidth, setTrackWidth] = useState(0);
  const pillWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / 3 : 0;

  const translateX = useSharedValue(0);
  useEffect(() => {
    translateX.value = withSpring(index * pillWidth, { damping: 15, stiffness: 180, mass: 1 });
  }, [index, pillWidth, translateX]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={{
        position: 'relative',
        flexDirection: 'row',
        borderRadius: 16,
        backgroundColor: c.track,
        padding: TRACK_PADDING,
      }}>
      {pillWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: TRACK_PADDING,
              left: TRACK_PADDING,
              bottom: TRACK_PADDING,
              width: pillWidth,
              borderRadius: 12,
              backgroundColor: MODES[value].accent,
              shadowColor: '#111317',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 3,
            },
            pillStyle,
          ]}
        />
      )}
      {TYPE_ORDER.map((m) => {
        const active = m === value;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 11 }}>
            <Text
              style={{
                fontFamily: FONTS.extrabold,
                fontSize: 12,
                letterSpacing: 0.4,
                color: active ? MODES[m].accentText : c.segInactive,
              }}>
              {TYPE_BTN_LABEL[m]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const inputStyle = (c: Palette) =>
  ({
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: c.ink,
    shadowColor: '#111317',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  }) as const;

export default function CreateListing() {
  const router = useRouter();
  const { createListing, draftCategory, setDraftCategory } = useListings();
  const { token } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark } = useTheme();
  const INPUT_STYLE = inputStyle(c);

  const [createType, setCreateType] = useState<Mode>('shop');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [posting, setPosting] = useState(false);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const theme = MODES[createType];
  const meta = TYPE_META[createType];

  const pickPhotos = async () => {
    if (photos.length >= 8) return showToast('A listing can have at most 8 photos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8 - photos.length,
      quality: 0.85,
    });
    if (result.canceled) return;
    setPhotos((current) => {
      const known = new Set(current.map((photo) => photo.uri));
      return [...current, ...result.assets.filter((photo) => !known.has(photo.uri))].slice(0, 8);
    });
  };

  const onPost = async () => {
    const numericPrice = Number(price.replace(/[^\d.]/g, ''));
    if (!title.trim()) return showToast('Enter a listing title');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0)
      return showToast('Enter a valid price');

    setPosting(true);
    try {
      if (!token) throw new Error('Log in to post a listing');
      const uploaded = await Promise.all(
        photos.map((photo) => listingsApi.uploadImage(token, photo))
      );
      await createListing({
        title: title.trim(),
        description: [desc.trim(), draftCategory && `Category: ${draftCategory}`]
          .filter(Boolean)
          .join('\n'),
        type: MODE_TO_LISTING_TYPE[createType],
        price: numericPrice,
        imageUrls: uploaded.map((image) => image.url),
      });
      setTitle('');
      setPrice('');
      setDesc('');
      setDraftCategory('');
      setPhotos([]);
      showToast('Listing posted');
      router.replace('/listings');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not post listing');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          gap: 12,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.hairline,
        }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: c.chip,
          }}>
          <X size={16} color={c.ink} strokeWidth={2.6} />
        </Pressable>
        <Text
          style={{ fontFamily: FONTS.extrabold, fontSize: 17, color: c.ink, letterSpacing: -0.4 }}>
          Create listing
        </Text>
      </View>

      <KeyboardSafeView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 }}>
          {/* type selector */}
          <FieldLabel style={{ marginBottom: 9 }}>WHAT ARE YOU POSTING?</FieldLabel>
          <TypeSelector value={createType} onChange={setCreateType} />
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: c.muted, marginTop: 8 }}>
            {meta.label}
          </Text>

          {/* photos */}
          <FieldLabel style={{ marginTop: 20, marginBottom: 9 }}>PHOTOS</FieldLabel>
          <Pressable
            onPress={() => void pickPhotos()}
            style={{
              alignItems: 'center',
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: c.border,
              backgroundColor: c.chip,
              borderRadius: 18,
              paddingVertical: 26,
              gap: 8,
            }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.tagBg,
                borderWidth: 1,
                borderColor: theme.tagBorder,
              }}>
              <ImagePlus size={22} color={ON_TINT} strokeWidth={2.1} />
            </View>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: c.secondary }}>
              Add photos
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: c.muted }}>
              Up to 8 · first is the cover
            </Text>
          </Pressable>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingTop: 10 }}>
              {photos.map((photo, index) => (
                <View key={photo.uri} style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={{ width: 76, height: 76, borderRadius: 13, backgroundColor: c.imgBg }}
                  />
                  <Pressable
                    onPress={() =>
                      setPhotos((current) =>
                        current.filter((_, photoIndex) => photoIndex !== index)
                      )
                    }
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: c.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <X size={12} color={c.surface} strokeWidth={3} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* title */}
          <FieldLabel style={{ marginTop: 20, marginBottom: 9 }}>TITLE</FieldLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={meta.titlePh}
            placeholderTextColor={c.muted}
            style={[INPUT_STYLE, { paddingVertical: 14 }]}
          />

          {/* price */}
          <FieldLabel style={{ marginTop: 18, marginBottom: 9 }}>PRICE (GHS)</FieldLabel>
          <View style={[{ flexDirection: 'row', alignItems: 'center' }, INPUT_STYLE, { gap: 10 }]}>
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: c.muted }}>GHS</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder={meta.pricePh}
              placeholderTextColor={c.muted}
              keyboardType="numbers-and-punctuation"
              style={{
                flex: 1,
                minWidth: 0,
                paddingVertical: 14,
                fontFamily: FONTS.semibold,
                fontSize: 14,
                color: c.ink,
              }}
            />
          </View>

          {/* details */}
          <FieldLabel style={{ marginTop: 18, marginBottom: 9 }}>DETAILS</FieldLabel>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => router.push('/category')}
              style={[
                { flexDirection: 'row', alignItems: 'center' },
                INPUT_STYLE,
                { gap: 12, paddingVertical: 14 },
              ]}>
              <TagIcon size={16} color={c.secondary} strokeWidth={2.2} />
              <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: c.ink }}>
                Category
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semibold,
                  fontSize: 12.5,
                  color: draftCategory ? '#4A4D54' : c.muted,
                }}>
                {draftCategory || 'Choose'}
              </Text>
              <ChevronRight size={16} color={c.muted} strokeWidth={2.4} />
            </Pressable>
            <View
              style={[
                { flexDirection: 'row', alignItems: 'center' },
                INPUT_STYLE,
                { gap: 12, paddingVertical: 14 },
              ]}>
              <MapPin size={16} color={c.secondary} strokeWidth={2.2} />
              <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: c.ink }}>
                Location
              </Text>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12.5, color: c.secondary }}>
                East Legon
              </Text>
            </View>
          </View>

          {/* description */}
          <FieldLabel style={{ marginTop: 18, marginBottom: 9 }}>DESCRIPTION</FieldLabel>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Condition, details, what's included…"
            placeholderTextColor={c.muted}
            multiline
            style={[
              INPUT_STYLE,
              {
                minHeight: 92,
                paddingVertical: 14,
                textAlignVertical: 'top',
                fontFamily: FONTS.medium,
              },
            ]}
          />
        </ScrollView>

        {/* sticky footer */}
        <View
          style={{
            backgroundColor: c.surface,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 28,
            borderTopWidth: 1,
            borderTopColor: c.hairline,
          }}>
          <Pressable
            onPress={onPost}
            disabled={posting}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.accent,
              paddingVertical: 15,
              borderRadius: 15,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}>
            {posting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Check size={17} color={theme.accentText} strokeWidth={2.6} />
            )}
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 15, color: theme.accentText }}>
              {posting ? 'Posting…' : 'Post listing'}
            </Text>
          </Pressable>
        </View>
      </KeyboardSafeView>
    </SafeAreaView>
  );
}
