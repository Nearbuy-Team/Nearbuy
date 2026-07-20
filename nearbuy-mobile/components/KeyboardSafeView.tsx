import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, type ViewStyle } from 'react-native';

interface KeyboardSafeViewProps extends PropsWithChildren {
  keyboardVerticalOffset?: number;
  style?: ViewStyle;
}

/**
 * Keeps focused fields and their actions above the software keyboard.
 * Scrollable screens should still set keyboardShouldPersistTaps="handled".
 */
export function KeyboardSafeView({
  children,
  keyboardVerticalOffset = 0,
  style,
}: KeyboardSafeViewProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}
