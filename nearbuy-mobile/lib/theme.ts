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
    promoTitle: 'Verified sellers, escrow-protected',
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

// Neutral palette
export const COLORS = {
  ink: '#111317',
  secondary: '#84888F',
  secondaryAlt: '#8A8F98',
  muted: '#9A9EA6',
  surface: '#FFFFFF',
  canvas: '#F6F6F4',
  chip: '#F3F3F1',
  track: '#EEEEEC',
  navInactive: '#9CA3AF',
  segInactive: '#83878E',
  promoFrom: '#15171C',
  promoTo: '#24272F',
  success: '#0A7D3D',
} as const;

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
