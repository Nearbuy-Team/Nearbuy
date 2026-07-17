import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Plus, Trash2, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { SubHeader } from '@/components/SubHeader';
import { useToast } from '@/components/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import { useColors, useTheme } from '@/lib/ThemeContext';
import { type ApiPaymentMethod, paymentMethodsApi } from '@/lib/api';
import { FONTS, MODES, SHADOWS } from '@/lib/theme';

const theme = MODES.shop;
const PROVIDERS = ['MTN', 'AT', 'TELECEL'] as const;

export default function PaymentMethods() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const c = useColors();
  const { isDark } = useTheme();
  const [methods, setMethods] = useState<ApiPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>('MTN');
  const [phone, setPhone] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setMethods(await paymentMethodsApi.all(token));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load payment methods');
    } finally {
      setLoading(false);
    }
  }, [showToast, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const add = async () => {
    if (!token) return;
    try {
      const created = await paymentMethodsApi.addMobileMoney(token, provider, phone);
      setMethods((current) => [created, ...current]);
      setPhone('');
      setAdding(false);
      showToast('Mobile Money method saved');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save method');
    }
  };

  const setDefault = async (method: ApiPaymentMethod) => {
    if (!token || method.defaultMethod) return;
    try {
      await paymentMethodsApi.setDefault(token, method.id);
      setMethods((current) =>
        current.map((item) => ({ ...item, defaultMethod: item.id === method.id }))
      );
      showToast(`${method.provider} set as default`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update method');
    }
  };

  const remove = async (method: ApiPaymentMethod) => {
    if (!token) return;
    try {
      await paymentMethodsApi.remove(token, method.id);
      await load();
      showToast('Payment method removed');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not remove method');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SubHeader title="Payment methods" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={c.ink} /> : null}
        {!loading && methods.length === 0 && !adding ? (
          <Text style={{ fontFamily: FONTS.medium, color: c.secondary }}>
            Add a test Mobile Money number for checkout.
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          {methods.map((method) => (
            <Pressable
              key={method.id}
              onPress={() => void setDefault(method)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: c.surface,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1.5,
                borderColor: method.defaultMethod ? theme.accent : 'transparent',
                ...SHADOWS.row,
              }}>
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: method.provider === 'MTN' ? '#FFCC00' : '#E8E8E4',
                }}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 9, color: '#1A1A1A' }}>
                  {method.provider}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 13.5, color: c.ink }}>
                  {method.provider} Mobile Money
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 11.5,
                    color: c.muted,
                    marginTop: 1,
                  }}>
                  •••• {method.lastFour}
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: method.defaultMethod ? 0 : 1.5,
                  borderColor: c.border,
                  backgroundColor: method.defaultMethod ? theme.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {method.defaultMethod ? (
                  <Check size={13} color={theme.accentText} strokeWidth={3} />
                ) : null}
              </View>
              <Pressable onPress={() => void remove(method)} hitSlop={8}>
                <Trash2 size={17} color={c.muted} />
              </Pressable>
            </Pressable>
          ))}
        </View>

        {adding ? (
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: 16,
              padding: 14,
              marginTop: 16,
              gap: 12,
              ...SHADOWS.row,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text style={{ fontFamily: FONTS.extrabold, color: c.ink }}>Add Mobile Money</Text>
              <Pressable onPress={() => setAdding(false)}>
                <X size={18} color={c.ink} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PROVIDERS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setProvider(item)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: provider === item ? theme.accent : c.chip,
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.extrabold,
                      color: provider === item ? theme.accentText : c.ink,
                      fontSize: 11,
                    }}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 0551234987"
              placeholderTextColor={c.muted}
              style={{
                backgroundColor: c.chip,
                color: c.ink,
                borderRadius: 12,
                paddingHorizontal: 13,
                paddingVertical: 12,
                fontFamily: FONTS.semibold,
              }}
            />
            <Pressable
              onPress={() => void add()}
              style={{
                backgroundColor: theme.accent,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}>
              <Text style={{ fontFamily: FONTS.extrabold, color: theme.accentText }}>
                Save method
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              backgroundColor: theme.accent,
              paddingVertical: 14,
              borderRadius: 14,
              marginTop: 18,
            }}>
            <Plus size={16} color={theme.accentText} strokeWidth={3} />
            <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: theme.accentText }}>
              Add payment method
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
