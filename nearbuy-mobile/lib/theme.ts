// Nearbuy design tokens — mirrors README section 5 & 7.

export type Mode = 'shop' | 'services' | 'rent';
export type Tab = 'home' | 'search' | 'chat' | 'wallet' | 'profile';

export interface ModeTheme {
  accent: string; // bg of pill, CTA, active tab, dots
  accentText: string; // text/icon ON accent (contrast)
  tagBg: string; // accent @ 13% tint (color-mix not supported in RN)
  tagBorder: string; // accent @ 42%
  cta: string; // CTA label
  searchHint: string; // search placeholder
  promoTitle: string;
  promoSub: string;
  toast: string; // CTA confirmation verb
}

export const MODES: Record<Mode, ModeTheme> = {
  shop: {
    accent: '#CCFF00',
    accentText: '#1A1A1A',
    tagBg: '#FAFFE6',
    tagBorder: 'rgba(204,255,0,0.42)',
    cta: 'Buy Now',
    searchHint: 'Search goods near you…',
    promoTitle: 'Verified sellers, protected payments',
    promoSub: 'Pay safely — funds held until you confirm',
    toast: 'Added to cart',
  },
  services: {
    accent: '#008080',
    accentText: '#FFFFFF',
    tagBg: '#E6F2F2',
    tagBorder: 'rgba(0,128,128,0.42)',
    cta: 'Book Slot',
    searchHint: 'Search services near you…',
    promoTitle: 'Book trusted local pros',
    promoSub: 'Real-time slots · same-day availability',
    toast: 'Slot requested',
  },
  rent: {
    accent: '#9B5DE5',
    accentText: '#FFFFFF',
    tagBg: '#F5EEFC',
    tagBorder: 'rgba(155,93,229,0.42)',
    cta: 'Rent Now',
    searchHint: 'Search rentals near you…',
    promoTitle: 'Rent by the hour, day or week',
    promoSub: 'Deposits auto-released on confirmed return',
    toast: 'Rental requested',
  },
};

// Manrope weights — must match the names loaded in app/_layout.tsx.
export const FONTS = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

// Neutral palette — now two schemes. Screens read the *live* one via
// `useColors()` (lib/ThemeContext) so Light/Dark/System swaps recolor the app.
// Brand accents (MODES green/teal/purple) are unchanged across schemes.
export interface Palette {
  ink: string; // primary text
  secondary: string; // secondary text
  secondaryAlt: string;
  muted: string; // faint text / placeholders
  surface: string; // cards, headers, sheets (raised)
  canvas: string; // screen background
  chip: string; // inputs, small buttons, avatars
  track: string; // segmented-control / toggle track
  hairline: string; // subtle 1px borders
  border: string; // solid outline borders (outline buttons)
  divider: string; // row separators inside cards
  imgBg: string; // image / media placeholders
  navInactive: string;
  segInactive: string;
  promoFrom: string; // promo strip gradient
  promoTo: string;
  success: string; // positive amounts / status
  danger: string; // logout / destructive
}

export const LIGHT: Palette = {
  ink: '#111317',
  secondary: '#84888F',
  secondaryAlt: '#8A8F98',
  muted: '#9A9EA6',
  surface: '#FFFFFF',
  canvas: '#F6F6F4',
  chip: '#F3F3F1',
  track: '#EEEEEC',
  hairline: 'rgba(17,19,23,0.06)',
  border: '#E7E7E3',
  divider: '#F3F3F0',
  imgBg: '#EDEDEA',
  navInactive: '#9CA3AF',
  segInactive: '#83878E',
  promoFrom: '#15171C',
  promoTo: '#24272F',
  success: '#0A7D3D',
  danger: '#E0463E',
};

export const DARK: Palette = {
  ink: '#F3F4F6',
  secondary: '#9CA1A9',
  secondaryAlt: '#969BA4',
  muted: '#787D86',
  surface: '#1A1C21',
  canvas: '#0F1013',
  chip: '#25272D',
  track: '#2C2E35',
  hairline: 'rgba(255,255,255,0.09)',
  border: '#34363D',
  divider: 'rgba(255,255,255,0.06)',
  imgBg: '#25272D',
  navInactive: '#6C707A',
  segInactive: '#9CA1A9',
  promoFrom: '#1D1F26',
  promoTo: '#2B2E37',
  success: '#3FBE6E',
  danger: '#FF6B61',
};

/** Light palette. Prefer `useColors()` for reactive theming; this constant is
 *  the light scheme and is safe for scheme-agnostic values only. */
export const COLORS = LIGHT;

// Shadows (RN style objects)
export const SHADOWS = {
  card: {
    shadowColor: '#111317',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 4,
  },
  pill: {
    shadowColor: '#111317',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    shadowColor: '#111317',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  toast: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;

// Tabs that hide the header and lock the accent to brand green.
export const HEADER_TABS: Tab[] = ['home', 'search'];

/** Effective theme a screen renders with: home/search use the selected mode;
 *  chat/wallet/profile lock to brand green (MODES.shop). */
export function effectiveTheme(mode: Mode, tab: Tab): ModeTheme {
  return HEADER_TABS.includes(tab) ? MODES[mode] : MODES.shop;
}
