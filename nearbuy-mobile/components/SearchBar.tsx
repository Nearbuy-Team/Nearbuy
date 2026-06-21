import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

import { COLORS, FONTS } from '@/lib/theme';

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
  return (
    <View
      className="mt-3 flex-row items-center rounded-2xl bg-chip"
      style={{ gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
      <Search size={17} color={COLORS.muted} strokeWidth={2.2} />
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        style={{
          flex: 1,
          minWidth: 0,
          padding: 0,
          fontFamily: FONTS.medium,
          fontSize: 13.5,
          color: COLORS.ink,
        }}
      />
      {query.length > 0 && (
        <Pressable
          onPress={() => onQueryChange('')}
          hitSlop={8}
          className="h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: '#D9D9D5' }}>
          <X size={11} color="#6B6F76" strokeWidth={3} />
        </Pressable>
      )}
    </View>
  );
}
