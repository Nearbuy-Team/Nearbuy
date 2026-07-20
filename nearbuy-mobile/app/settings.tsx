import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { SubHeader } from '@/components/SubHeader';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { FONTS, MODES, SHADOWS, type Palette } from '@/lib/theme';

const theme = MODES.shop;
const PREF_LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const;

export default function Settings() {
  const router = useRouter();
  const { deleteAccount, logout } = useAuth();
  const { showToast } = useToast();
  const c = useColors();
  const { isDark, preference, cyclePreference } = useTheme();

  const [pushOn, setPushOn] = useState(true);
  const [locationOn, setLocationOn] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setDeleteOpen(false);
      setDeletePassword('');
      router.replace('/(auth)/login');
      showToast('Your Nearbuy account was deleted');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete account');
    } finally {
      setDeleting(false);
    }
  };

  const requestDelete = () => {
    if (!deletePassword) return showToast('Enter your password to continue');
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, listings, messages and account data. This cannot be undone.',
      [
        { text: 'Keep account', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Settings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        <Section title="ACCOUNT" c={c}>
          <LinkRow c={c} label="Edit profile" onPress={() => showToast('Edit profile')} />
          <LinkRow
            c={c}
            label="Payment methods"
            onPress={() => router.push('/payment-methods')}
            last
          />
        </Section>

        <Section title="PREFERENCES" c={c}>
          <LinkRow
            c={c}
            label="Appearance"
            value={PREF_LABEL[preference]}
            onPress={cyclePreference}
          />
          <ToggleRow c={c} label="Push notifications" value={pushOn} onValueChange={setPushOn} />
          <ToggleRow
            c={c}
            label="Location services"
            value={locationOn}
            onValueChange={setLocationOn}
          />
          <LinkRow
            c={c}
            label="Language"
            value="English"
            onPress={() => showToast('Language')}
            last
          />
        </Section>

        <Section title="SUPPORT" c={c}>
          <LinkRow c={c} label="Help center" onPress={() => showToast('Help center')} />
          <LinkRow c={c} label="Terms & privacy" onPress={() => showToast('Terms & privacy')} />
          <LinkRow
            c={c}
            label="About Nearbuy"
            value="v1.0.0"
            onPress={() => showToast('About Nearbuy')}
            last
          />
        </Section>

        <Section title="DANGER ZONE" c={c}>
          <LinkRow c={c} danger label="Delete account" onPress={() => setDeleteOpen(true)} last />
        </Section>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: c.surface,
            paddingVertical: 15,
            borderRadius: 14,
            marginTop: 20,
            transform: [{ scale: pressed ? 0.99 : 1 }],
            ...SHADOWS.row,
          })}>
          <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: c.danger }}>
            Log out
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={deleteOpen}
        onRequestClose={() => !deleting && setDeleteOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.48)',
            justifyContent: 'flex-end',
          }}>
          <KeyboardSafeView style={{ justifyContent: 'flex-end' }}>
            <Pressable
              accessibilityLabel="Close delete account"
              disabled={deleting}
              onPress={() => setDeleteOpen(false)}
              style={{ flex: 1 }}
            />
            <View
              style={{
                backgroundColor: c.canvas,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                paddingHorizontal: 22,
                paddingTop: 18,
                paddingBottom: 34,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: c.chip,
                  }}>
                  <Trash2 size={19} color={c.danger} strokeWidth={2.3} />
                </View>
                <Pressable disabled={deleting} onPress={() => setDeleteOpen(false)} hitSlop={10}>
                  <X size={20} color={c.ink} />
                </Pressable>
              </View>
              <Text
                style={{
                  fontFamily: FONTS.extrabold,
                  fontSize: 20,
                  color: c.ink,
                  marginTop: 16,
                }}>
                Delete account
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12.5,
                  lineHeight: 19,
                  color: c.secondary,
                  marginTop: 6,
                }}>
                Enter your current password. Nearbuy will block deletion while a payment, refund or
                seller payout still needs to be resolved.
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!deleting}
                onChangeText={setDeletePassword}
                onSubmitEditing={requestDelete}
                placeholder="Current password"
                placeholderTextColor={c.muted}
                returnKeyType="done"
                secureTextEntry
                value={deletePassword}
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1.5,
                  borderColor: c.border,
                  borderRadius: 13,
                  color: c.ink,
                  fontFamily: FONTS.semibold,
                  fontSize: 14,
                  marginTop: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                }}
              />
              <Pressable
                disabled={deleting}
                onPress={requestDelete}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: c.danger,
                  borderRadius: 13,
                  marginTop: 14,
                  minHeight: 48,
                  opacity: deleting ? 0.65 : pressed ? 0.82 : 1,
                })}>
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: '#FFFFFF' }}>
                    Delete my account
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardSafeView>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: Palette }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontFamily: FONTS.extrabold,
          fontSize: 11.5,
          letterSpacing: 0.4,
          color: c.secondary,
          marginBottom: 9,
        }}>
        {title}
      </Text>
      <View
        style={{
          backgroundColor: c.surface,
          borderRadius: 16,
          overflow: 'hidden',
          ...SHADOWS.row,
        }}>
        {children}
      </View>
    </View>
  );
}

function RowShell({
  children,
  last,
  c,
}: {
  children: React.ReactNode;
  last?: boolean;
  c: Palette;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 15,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.divider,
      }}>
      {children}
    </View>
  );
}

function LinkRow({
  label,
  value,
  onPress,
  last,
  danger,
  c,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  danger?: boolean;
  c: Palette;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <RowShell last={last} c={c}>
        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.bold,
            fontSize: 14,
            color: danger ? c.danger : c.ink,
          }}>
          {label}
        </Text>
        {!!value && (
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 12.5, color: c.muted }}>
            {value}
          </Text>
        )}
        <ChevronRight size={16} color={danger ? c.danger : c.muted} strokeWidth={2.4} />
      </RowShell>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  c,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  c: Palette;
}) {
  return (
    <RowShell c={c}>
      <Text style={{ flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: c.ink }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.track, true: theme.accent }}
        thumbColor="#FFFFFF"
      />
    </RowShell>
  );
}
