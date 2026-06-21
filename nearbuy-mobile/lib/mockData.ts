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
  { initial: 'K', name: 'Kwame A.', last: 'On my way — should be there by 2pm 🚗', time: 'now', unread: true },
  { initial: 'S', name: 'SparkleCo', last: 'Your deep-clean is confirmed for Sat.', time: '12m', unread: true },
  { initial: 'M', name: 'Mensah Rentals', last: 'Generator deposit received, thanks!', time: '1h', unread: false },
  { initial: 'A', name: 'Ama O. (Tutor)', last: 'See you at the next session.', time: 'Tue', unread: false },
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
