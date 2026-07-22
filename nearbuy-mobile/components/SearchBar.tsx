import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

import { useColors } from '@/lib/ThemeContext';
import { FONTS } from '@/lib/theme';

interface SearchBarProps {
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
}

/**
 * Controlled search field — the query lives in the Home screen so the feed can
 * filter live (Step 3). Typing and the clear button both flow through
 * `onQueryChange`.
 */
export function SearchBar({ placeholder, query, onQueryChange }: SearchBarProps) {
  const c = useColors();
  return (
    <View
      style={{
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: c.chip,
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}>
      <Search size={17} color={c.muted} strokeWidth={2.2} />
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        style={{
          flex: 1,
          minWidth: 0,
          padding: 0,
          fontFamily: FONTS.medium,
          fontSize: 13.5,
          color: c.ink,
        }}
      />
      {query.length > 0 && (
        <Pressable
          onPress={() => onQueryChange('')}
          hitSlop={8}
          style={({ pressed }) => ({
            height: 20,
            width: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
            backgroundColor: c.track,
            transform: [{ scale: pressed ? 0.85 : 1 }],
          })}>
          <X size={11} color={c.secondary} strokeWidth={3} />
        </Pressable>
      )}
    </View>
  );
}
