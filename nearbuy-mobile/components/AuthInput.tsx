import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string | null;
}

// Labelled TextInput with inline error — the field used across every auth form.
export function AuthInput({ label, error, style, ...rest }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const c = useColors();

  return (
    <View>
      {!!label && (
        <Text
          style={{
            fontFamily: FONTS.extrabold,
            fontSize: 11.5,
            letterSpacing: 0.4,
            color: c.secondary,
            marginBottom: 8,
          }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={c.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          {
            borderWidth: 1.5,
            borderColor: hasError ? c.danger : focused ? c.ink : c.border,
            backgroundColor: c.surface,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 15,
            fontFamily: FONTS.semibold,
            fontSize: 14.5,
            color: c.ink,
          },
          style,
        ]}
        {...rest}
      />
      {hasError && (
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 11.5, color: c.danger, marginTop: 7 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
