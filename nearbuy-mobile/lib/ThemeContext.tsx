// App color scheme — Light / Dark / System. Screens read the live palette via
// `useColors()` so a preference change recolors the whole app instantly. The
// preference persists (SecureStore, web localStorage fallback) across launches.

import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { DARK, LIGHT, type Palette } from '@/lib/theme';

export type ThemePref = 'light' | 'dark' | 'system';
export type Scheme = 'light' | 'dark';

const PREF_KEY = 'nb_theme_pref';

interface ThemeContextValue {
  preference: ThemePref; // what the user picked
  scheme: Scheme; // resolved scheme actually in effect
  isDark: boolean;
  colors: Palette; // live palette for the resolved scheme
  setPreference: (pref: ThemePref) => void;
  /** Cycle System → Light → Dark → System (for the Settings row). */
  cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// SecureStore is unavailable on web — fall back to localStorage / memory.
const mem = new Map<string, string>();
const store = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? mem.get(key) ?? null;
      } catch {
        return mem.get(key) ?? null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        mem.set(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
};

const isPref = (v: string | null): v is ThemePref =>
  v === 'light' || v === 'dark' || v === 'system';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The OS appearance — drives the 'system' preference. null → treat as light.
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePref>('system');

  // Restore the saved preference on launch.
  useEffect(() => {
    (async () => {
      try {
        const saved = await store.get(PREF_KEY);
        if (isPref(saved)) setPref(saved);
      } catch {
        // ignore — default to 'system'
      }
    })();
  }, []);

  const setPreference = (pref: ThemePref) => {
    setPref(pref);
    void store.set(PREF_KEY, pref);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: Scheme =
      preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    const isDark = scheme === 'dark';
    return {
      preference,
      scheme,
      isDark,
      colors: isDark ? DARK : LIGHT,
      setPreference,
      cyclePreference: () =>
        setPreference(
          preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system'
        ),
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}

/** Live neutral palette for the active scheme. */
export function useColors(): Palette {
  return useTheme().colors;
}
