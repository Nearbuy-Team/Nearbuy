import { createContext, useContext, useMemo, useState } from 'react';

import { MODES, type Mode, type ModeTheme } from '@/lib/theme';

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
  /** Theme for the currently selected mode (raw, not the per-tab effective theme). */
  theme: ModeTheme;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('shop');

  const value = useMemo<ModeContextValue>(
    () => ({ mode, setMode, theme: MODES[mode] }),
    [mode]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within a <ModeProvider>');
  return ctx;
}
