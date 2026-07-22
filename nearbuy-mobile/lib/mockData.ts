// Mock content — mirrors the data block in Nearbuy.dc.html.

import type { Mode } from './theme';

export type TrustTier = 'Platinum' | 'Gold' | 'Silver';

export interface Listing {
  title: string;
  price: string;
  unit: string;
  meta: string;
  trust: TrustTier;
  imgLabel: string;
  tags: string[];
}

export const LISTINGS: Record<Mode, Listing[]> = {
  shop: [
    {
      title: 'iPhone 13 Pro',
      price: 'GHS 4,200',
      unit: '',
      meta: 'Graphite · 256GB · Used – Good',
      trust: 'Gold',
      imgLabel: 'product · iPhone 13 Pro',
      tags: ['Electronics', 'Negotiable', 'Verified seller'],
    },
    {
      title: 'Fresh Yam Tubers',
      price: 'GHS 35',
      unit: '/tuber',
      meta: 'Farm produce · from Techiman',
      trust: 'Silver',
      imgLabel: 'product · yam tubers',
      tags: ['Farm produce', 'Bulk available'],
    },
    {
      title: 'Nike Air Force 1',
      price: 'GHS 520',
      unit: '',
      meta: 'Size 43 · Brand new · Sealed',
      trust: 'Platinum',
      imgLabel: 'product · sneakers',
      tags: ['Fashion', 'Free delivery'],
    },
  ],
  services: [
    {
      title: 'AC Repair Technician',
      price: 'GHS 120',
      unit: '/visit',
      meta: 'Kwame A. · ★ 4.9 (213 jobs)',
      trust: 'Gold',
      imgLabel: 'provider · AC technician',
      tags: ['Same-day', 'Insured work', 'Verified'],
    },
    {
      title: 'WASSCE Math Tutor',
      price: 'GHS 50',
      unit: '/hr',
      meta: 'Ama O. · ★ 5.0 (88 students)',
      trust: 'Platinum',
      imgLabel: 'provider · math tutor',
      tags: ['Online or in-person', 'Verified'],
    },
    {
      title: 'Home Deep Cleaning',
      price: 'GHS 180',
      unit: '/session',
      meta: 'SparkleCo · ★ 4.8 (140 jobs)',
      trust: 'Gold',
      imgLabel: 'provider · cleaning team',
      tags: ['Team of 3', 'Insured'],
    },
  ],
  rent: [
    {
      title: 'Soundsystem / DJ Set',
      price: 'GHS 800',
      unit: '/day',
      meta: '2.4kW · mixer & 2 speakers incl.',
      trust: 'Gold',
      imgLabel: 'rental · DJ soundsystem',
      tags: ['Deposit GHS 500', 'Delivery'],
    },
    {
      title: '25kVA Generator',
      price: 'GHS 450',
      unit: '/day',
      meta: 'Diesel · silent canopy · operator opt.',
      trust: 'Platinum',
      imgLabel: 'rental · generator',
      tags: ['Operator opt.', 'Insured'],
    },
    {
      title: 'Canon R6 Camera Kit',
      price: 'GHS 220',
      unit: '/day',
      meta: 'Body + 2 lenses · hourly available',
      trust: 'Silver',
      imgLabel: 'rental · DSLR camera kit',
      tags: ['Hourly avail.', 'Deposit GHS 800'],
    },
  ],
};

export interface ChatThread {
  initial: string;
  name: string;
  last: string;
  time: string;
  unread: boolean;
}

export const CHAT_THREADS: ChatThread[] = [
  {
    initial: 'K',
    name: 'Kwame A.',
    last: 'On my way — should be there by 2pm 🚗',
    time: 'now',
    unread: true,
  },
  {
    initial: 'S',
    name: 'SparkleCo',
    last: 'Your deep-clean is confirmed for Sat.',
    time: '12m',
    unread: true,
  },
  {
    initial: 'M',
    name: 'Mensah Rentals',
    last: 'Generator deposit received, thanks!',
    time: '1h',
    unread: false,
  },
  {
    initial: 'A',
    name: 'Ama O. (Tutor)',
    last: 'See you at the next session.',
    time: 'Tue',
    unread: false,
  },
];

export interface WalletTxn {
  label: string;
  sub: string;
  amount: string;
  dir: 'in' | 'out';
}

export const WALLET_TXNS: WalletTxn[] = [
  { label: 'Top-up · Mobile Money', sub: 'MTN MoMo · Today', amount: '+ GHS 500', dir: 'in' },
  { label: 'AC Repair Technician', sub: 'Escrow held · Today', amount: '− GHS 120', dir: 'out' },
  { label: 'Generator deposit', sub: 'Refundable · Yesterday', amount: '− GHS 500', dir: 'out' },
];

export interface ProfileRow {
  glyph: string;
  label: string;
}

export const PROFILE_ROWS: ProfileRow[] = [
  { glyph: '📦', label: 'My orders & bookings' },
  { glyph: '🏷️', label: 'My listings' },
  { glyph: '⭐', label: 'Reviews & TrustScore' },
  { glyph: '💳', label: 'Payment methods' },
  { glyph: '⚙️', label: 'Settings' },
];

// --- Listing Detail / Checkout / Conversation helpers (mirror Nearbuy.dc.html) ---

/** Find a listing by mode + title (feed cards are looked up this way so detail
 *  and checkout routes only need to pass `mode` + `id`). */
export function getListing(mode: Mode, title: string): Listing | undefined {
  return LISTINGS[mode].find((l) => l.title === title);
}

export interface Seller {
  name: string;
  initial: string;
  trustScore: number;
}

/** Derive the seller shown on a listing — services use the provider named in the
 *  listing's meta; shop/rent use fixed demo sellers. */
export function sellerFor(mode: Mode, listing: Listing): Seller {
  if (mode === 'services') {
    const name = (listing.meta.split('·')[0] || 'Provider').trim();
    return { name, initial: (name[0] || 'P').toUpperCase(), trustScore: 98 };
  }
  if (mode === 'rent') return { name: 'Mensah Rentals', initial: 'MR', trustScore: 94 };
  return { name: 'Kojo Mensah', initial: 'KM', trustScore: 96 };
}

/** Mode-specific spec rows for the Listing Detail "Details" table. */
export function specsFor(mode: Mode, listing: Listing): { k: string; v: string }[] {
  if (mode === 'services')
    return [
      { k: 'Service', v: listing.tags[0] || 'On-site' },
      { k: 'Availability', v: 'Same-day' },
      { k: 'Location', v: 'East Legon, Accra' },
      { k: 'Guarantee', v: 'Insured work' },
    ];
  if (mode === 'rent')
    return [
      { k: 'Category', v: listing.tags[0] || 'Equipment' },
      { k: 'Min. period', v: '1 day' },
      { k: 'Deposit', v: listing.tags.find((t) => /deposit/i.test(t)) || 'Refundable' },
      { k: 'Location', v: 'East Legon, Accra' },
    ];
  return [
    { k: 'Category', v: listing.tags[0] || 'General' },
    { k: 'Condition', v: 'Used – Good' },
    { k: 'Location', v: 'East Legon, Accra' },
    { k: 'Delivery', v: 'Available · GHS 20' },
  ];
}

export interface ChatMessage {
  mine: boolean;
  text: string;
  time: string;
}

/** Listing context shown atop a conversation, keyed by the other party's name. */
export const LISTING_BY_THREAD: Record<string, { title: string; sub: string; mode: Mode }> = {
  'Kwame A.': { title: 'AC Repair Technician', sub: 'GHS 120 /visit', mode: 'services' },
  SparkleCo: { title: 'Home Deep Cleaning', sub: 'GHS 180 /session', mode: 'services' },
  'Mensah Rentals': { title: '25kVA Generator', sub: 'GHS 450 /day', mode: 'rent' },
  'Ama O. (Tutor)': { title: 'WASSCE Math Tutor', sub: 'GHS 50 /hr', mode: 'services' },
};

export function seedMessages(): ChatMessage[] {
  return [
    { mine: false, text: 'Hi! Thanks for reaching out on Nearbuy.', time: '9:30' },
    { mine: true, text: 'Hello — is this still available?', time: '9:31' },
    { mine: false, text: 'Yes it is. When would work for you?', time: '9:32' },
  ];
}

// --- Secondary pages (Notifications / Orders / Reviews / Payments / Settings) ---
// Placeholder content; swap for API data when the backend lands.

export interface AppNotification {
  title: string;
  sub: string;
  time: string;
  unread: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    title: 'Payment secured',
    sub: 'Your payment for "AC Repair Technician" is confirmed.',
    time: '2m',
    unread: true,
  },
  {
    title: 'New message from Kwame A.',
    sub: 'On my way — should be there by 2pm 🚗',
    time: '15m',
    unread: true,
  },
  { title: 'Listing approved', sub: '"iPhone 13 Pro" is now live.', time: '1h', unread: false },
  {
    title: 'Price drop nearby',
    sub: 'Nike Air Force 1 dropped to GHS 520.',
    time: '3h',
    unread: false,
  },
  {
    title: 'Deposit refunded',
    sub: 'GHS 500 generator deposit returned to your wallet.',
    time: 'Yesterday',
    unread: false,
  },
];

export type OrderStatus = 'In escrow' | 'Completed' | 'Booked' | 'Cancelled';

export interface Order {
  title: string;
  status: OrderStatus;
  meta: string;
  amount: string;
}

export const ORDERS: Order[] = [
  {
    title: 'AC Repair Technician',
    status: 'In escrow',
    meta: 'Booking · Today 2:00pm',
    amount: 'GHS 120',
  },
  { title: 'iPhone 13 Pro', status: 'Completed', meta: 'Order · 12 Jun', amount: 'GHS 4,200' },
  { title: '25kVA Generator', status: 'Booked', meta: 'Rental · 14–16 Jun', amount: 'GHS 1,350' },
  { title: 'Home Deep Cleaning', status: 'Cancelled', meta: 'Booking · 8 Jun', amount: 'GHS 180' },
];

export interface Review {
  author: string;
  initial: string;
  rating: number;
  text: string;
  time: string;
}

export const TRUST_SCORE = 92;

export const REVIEWS: Review[] = [
  {
    author: 'Kwame A.',
    initial: 'K',
    rating: 5,
    text: 'Smooth transaction, fast responses. Highly recommend!',
    time: '2d',
  },
  {
    author: 'SparkleCo',
    initial: 'S',
    rating: 5,
    text: 'Great communication and on time. Will deal again.',
    time: '1w',
  },
  {
    author: 'Mensah Rentals',
    initial: 'M',
    rating: 4,
    text: 'All good, returned the deposit promptly.',
    time: '3w',
  },
];

export interface PaymentMethod {
  brand: string;
  label: string;
  sub: string;
  primary: boolean;
  tint: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { brand: 'MoMo', label: 'MTN Mobile Money', sub: '•••• 0247', primary: true, tint: '#FFCC00' },
  { brand: 'VISA', label: 'Visa debit', sub: '•••• 4419', primary: false, tint: '#1A1F71' },
  {
    brand: 'Cash',
    label: 'Cash on delivery',
    sub: 'Pay in person',
    primary: false,
    tint: '#0A7D3D',
  },
];

export const CATEGORIES: string[] = [
  'Electronics',
  'Phones & tablets',
  'Fashion',
  'Home & garden',
  'Vehicles',
  'Farm produce',
  'Services',
  'Equipment rental',
  'Property',
  'Other',
];
