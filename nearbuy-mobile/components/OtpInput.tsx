import { useRef } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
}

// Six-box code input with auto-advance + backspace-to-previous focus.
export function OtpInput({ length = 6, value, onChange }: OtpInputProps) {
  const c = useColors();
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigit = (i: number, raw: string) => {
    const numeric = raw.replace(/\D/g, '');
    const next = digits.slice();

    if (numeric.length > 1) {
      numeric
        .slice(0, length - i)
        .split('')
        .forEach((digit, offset) => {
          next[i + offset] = digit;
        });
      onChange(next.join(''));
      refs.current[Math.min(i + numeric.length, length - 1)]?.focus();
      return;
    }

    const ch = numeric.slice(-1);
    next[i] = ch;
    onChange(next.join(''));
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onKeyPress = (i: number) => (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChangeText={(t) => setDigit(i, t)}
          onKeyPress={onKeyPress(i)}
          keyboardType="number-pad"
          maxLength={length}
          textContentType={i === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          style={{
            flex: 1,
            height: 60,
            textAlign: 'center',
            borderWidth: 1.5,
            borderColor: d ? c.ink : c.border,
            borderRadius: 14,
            backgroundColor: c.surface,
            fontFamily: FONTS.extrabold,
            fontSize: 24,
            color: c.ink,
          }}
        />
      ))}
    </View>
  );
}
