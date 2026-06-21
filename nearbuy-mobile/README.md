# Handoff: Nearbuy — Three-Mode Marketplace (Mobile)

> Target stack: **Expo (React Native) + TypeScript + NativeWind**, Expo Router (`app/` dir).
> Repo: `nearbuy-mobile/` with `app/`, `components/`, `lib/`, `assets/`, `global.css`, `tailwind.config.js`, `metro.config.js`, `nativewind-env.d.ts`.
>
> **This is the v2 spec.** See `Nearbuy.dc.html` (interactive prototype) for the intended look and every interaction.

---

## 0. ⚡ RESUMING MID-BUILD — read me first
Build order is a checklist worked **one step at a time**; finish, run, and visually verify each step before the next.

**v2 changes vs the original handoff (only affect Step 4 and Step 8):**
1. **Bottom nav is 5 slots with a centered "+":** order **Home · Chat · [ + ] · Wallet · Profile**. The center **+** is a raised accent square FAB **with no text label**, dead-center. **The Search tab was removed** — search now lives only in the header search field (on Home). So there is no `search.tsx` tab; keep search as in-header filtering on Home.
2. **Sell / Create-listing flow (Step 8):** a Create Listing modal + My Listings screen, reachable from (a) the center **+** FAB, (b) the **+ Sell** pill in the Home header, (c) Profile → My listings. Full spec in §6.
3. Everything else (mode theming, ListingCard, feed, toasts, Chat/Wallet/Profile screens) is unchanged.

---

## 1. Overview
Nearbuy is a location-based marketplace for Ghana with **three modes in one app** — **Shop** (buy goods), **Services** (book pros), **Rent** (rent equipment). The signature interaction: a **mode selector** in the header re-themes the whole app (accent color + text-on-accent) and swaps the feed's content + CTA. The prototype covers the **Home, Chat, Wallet, and Profile** tabs (search lives in the Home header), plus the **Sell / Create-listing** flow and a toast/confirmation system.

## 2. About the design files
`Nearbuy.dc.html` is a **design reference** — an interactive HTML prototype. **It is not production code to copy.** Recreate it in the Expo app using React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`) and **NativeWind** classes. `support.js` is only the browser preview runtime — **do not port it**.

## 3. Fidelity
**High-fidelity.** Colors, type scale, spacing, radii, shadows, motion, and copy are all final. The only placeholders are **card images** (hatched gray boxes) — wire to real images.

---

## 4. Where things go (Expo Router structure)

```
nearbuy-mobile/
├─ app/
│  ├─ _layout.tsx                # Root stack; wraps app in <ModeProvider> + <ToastProvider>
│  ├─ (tabs)/
│  │  ├─ _layout.tsx             # Tabs navigator — custom tab bar, active color = mode accent
│  │  ├─ index.tsx               # HOME  (feed + mode selector + in-header search)
│  │  ├─ chat.tsx                # CHAT  (message threads)
│  │  ├─ wallet.tsx              # WALLET (balance + transactions)
│  │  └─ profile.tsx             # PROFILE (user + menu)
│  ├─ create.tsx                 # CREATE LISTING (modal route — the Sell flow)
│  └─ listings.tsx               # MY LISTINGS (manage your posts)
├─ components/
│  ├─ ModeContext.tsx            # mode state + theme map (the heart of the app)
│  ├─ ModeSelector.tsx           # segmented control w/ animated pill
│  ├─ AppHeader.tsx              # brand row + Sell button + ModeSelector + SearchBar
│  ├─ SearchBar.tsx              # TextInput, clear button
│  ├─ ListingCard.tsx            # the marketplace card (image/price/trust/tags/CTA)
│  ├─ MyListingCard.tsx          # owner's listing card (status toggle + edit)
│  ├─ PromoStrip.tsx             # dark promo banner
│  ├─ Toast.tsx + ToastContext.tsx  # global confirmation toast
│  └─ TrustBadge.tsx, Tag.tsx    # small reusables
├─ lib/
│  ├─ theme.ts                   # color tokens, type scale, radii, shadows
│  └─ mockData.ts                # listings, chat, txns, profile rows
└─ global.css / tailwind.config.js   # extend theme with Nearbuy tokens
```

**`tailwind.config.js`** — tokens so classes like `bg-volt`, `text-ink` work:
```js
// theme.extend.colors
colors: {
  volt: '#CCFF00', teal: '#008080', purple: '#9B5DE5',
  ink: '#111317', subtle: '#84888F', muted: '#9A9EA6',
  surface: '#FFFFFF', canvas: '#F6F6F4', chip: '#F3F3F1', track: '#EEEEEC',
}
```
Mode accent itself is **dynamic** — keep it in React state/Context and apply via inline `style={{ backgroundColor: accent }}`; NativeWind classes can't switch it at runtime.

---

## 5. State / theming model (build this FIRST)

```ts
export type Mode = 'shop' | 'services' | 'rent';
export type Tab  = 'home' | 'chat' | 'wallet' | 'profile';

export interface ModeTheme {
  accent: string;        // bg of pill, CTA, active tab, dots
  accentText: string;    // text/icon ON accent (contrast)
  cta: string;           // CTA label
  searchHint: string;    // search placeholder
  promoTitle: string;
  promoSub: string;
  toast: string;         // CTA confirmation verb
}

export const MODES: Record<Mode, ModeTheme> = {
  shop:     { accent: '#CCFF00', accentText: '#1A1A1A', cta: 'Buy Now',  searchHint: 'Search goods near you…',    promoTitle: 'Verified sellers, escrow-protected', promoSub: 'Pay safely — funds held until you confirm', toast: 'Added to cart' },
  services: { accent: '#008080', accentText: '#FFFFFF', cta: 'Book Slot', searchHint: 'Search services near you…', promoTitle: 'Book trusted local pros',            promoSub: 'Real-time slots · same-day availability',   toast: 'Slot requested' },
  rent:     { accent: '#9B5DE5', accentText: '#FFFFFF', cta: 'Rent Now',  searchHint: 'Search rentals near you…',  promoTitle: 'Rent by the hour, day or week',      promoSub: 'Deposits auto-released on confirmed return', toast: 'Rental requested' },
};
```
- `ModeContext` holds `{ mode, setMode, theme }`. Every screen reads `theme` from it.
- **Header visibility & accent lock:** The header (brand row + ModeSelector + SearchBar) renders **only on Home**. On **Chat / Wallet / Profile** the header is hidden and the accent is **locked to brand green `#CCFF00`** (with dark `#1A1A1A` on-accent text) regardless of mode. Effective theme: `home` → `MODES[mode]`; `chat`/`wallet`/`profile` → `MODES.shop` (green). The active bottom-tab color uses this same effective accent.
- `accentText` is the **contrast rule**: dark charcoal on Volt Green, white on Teal & Purple. Never hardcode per-screen — always read `theme.accentText`.
- The active **bottom-tab** color = the current effective accent. Inactive tabs = `#9CA3AF`.

---

## 6. Screens & components (exact specs)

### Global header (`AppHeader`) — appears on Home
- White bg, padding `4/20/16`, bottom hairline shadow `0 1px 0 rgba(17,19,23,0.05)`.
- **Brand row:** accent-bg rounded icon (`26²`, radius 9) with house glyph in `accentText`; wordmark "Nearbuy" `22/800 #111317 ls -0.6`; location subtitle pin + "East Legon · 5 km radius" `11.5/600 #8A8F98`. Right side: **+ Sell pill** (accent bg / accentText, plus icon, `13/800`, radius 13 — opens Create Listing) then **bell button** `42²` radius 14 bg `#F3F3F1`, accent unread dot → tap → toast "No new notifications".
- **ModeSelector** and **SearchBar** below.

### ModeSelector (segmented control) — the core component
- Track full-width, bg `#EEEEEC`, radius 16, padding 5.
- **Sliding pill:** absolute, inset 5, `width: (100%-10)/3`, radius 12, **bg = accent**, shadow `0 4px 12px -2px rgba(17,19,23,0.25)`; position `translateX(index*100%)`, index 0/1/2.
  - Animate transform with **Reanimated** spring (`cubic-bezier(0.34,1.56,0.64,1)`, ~320ms — overshoot). Accent bg crossfades 250ms.
- 3 buttons SHOP / SERVICES / RENT, `flex:1`, `12.5/800 ls 0.6`. Active label = `accentText`; inactive = `#83878E`.

### SearchBar — **working filter**
- Row, bg `#F3F3F1`, radius 14, pad `12/14`, gap 10: magnifier + `TextInput` (placeholder = `theme.searchHint`, `13.5/500`) + clear "✕" button (only when query non-empty).
- Typing filters the feed live (case-insensitive over title + meta + tags of the current mode).

### Home feed (`app/(tabs)/index.tsx`)
- ScrollView, bg `#F6F6F4`, pad `18/20/110`.
- **PromoStrip** (hidden while searching): dark gradient `#15171C→#24272F`, radius 20, pad `16/18`; accent circle top-right `opacity .18`; title `13.5/800 #FFF` + sub `11.5/500 rgba(255,255,255,.6)`; **Explore** chip (bg accent, text accentText) → toast "Exploring {Mode}".
- Section header: `{searching ? 'Results' : 'Popular near you'}` `17/800`, right = `{searching ? 'N found' : 'See all'}` `12.5/700 #9A9EA6`.
- **ListingCard ×N** (gap 16). Mode-change replays a subtle enter anim (`opacity 0→1`, `translateY 8→0`, 320ms).
- **Empty state** when search has 0 results: icon tile + `No matches for "{q}"` + hint.

### ListingCard (`components/ListingCard.tsx`)
- White, radius 22, shadow `0 6px 22px -10px rgba(17,19,23,0.18), 0 1px 0 rgba(17,19,23,0.03)`.
- Image area `h152` (real image, `cover`): **price chip** top-right (bg `rgba(17,19,23,0.82)`, white `12.5/800`, unit suffix `10.5/600 opacity .65`); **TrustBadge** top-left (bg `rgba(255,255,255,0.92)`, star + tier `10.5/800 #111317`).
- Body pad `15/16/16`: title `15.5/800 #111317 ls -.3`; meta `12.5/500 #84888F`; **tags** (wrap, gap 7) each `10.5/700 #4A4D54`, bg = accent@13% tint, border = accent@42% (precompute per mode, table below).
- **CTA** (full width, radius 14, pad `13/0`, `14/800`): label = `theme.cta`, bg = accent, text = accentText, press `scale(0.97)` → **toast `"{theme.toast} · {card.title}"`**.

### Chat screen (`chat.tsx`)
- **No header** — content starts just below the status bar. Accent **locked green `#CCFF00`** (dark on-accent text).
- Title "Messages" `22/800`. Thread rows (white, radius 16, shadow): accent-tint avatar tile (`46²` radius 14, initial `16/800`) with accent unread dot; name `14.5/800` + time `11/600 #9A9EA6`; last message `12.5/500 #84888F` truncated. Tap → toast "Opening chat · {name}".
- Mock threads: Kwame A. (now, unread), SparkleCo (12m, unread), Mensah Rentals (1h), Ama O. (Tutor) (Tue).

### Wallet screen (`wallet.tsx`)
- **No header**, accent **locked green**.
- Title "Wallet". **Balance card**: dark gradient, accent circle, "Available balance" `12/600 rgba(255,255,255,.55)`, **GHS 1,250.00** `30/800 #FFF ls -1`; two buttons — **Top up** (bg accent / accentText) + **Withdraw** (outline) → toasts.
- "Recent activity" rows: icon tile, label `13.5/700`, sub `11.5/500 #9A9EA6`, amount right (`+` green `#0A7D3D` / `−` ink). Mock: `+GHS 500` top-up, `−GHS 120` AC repair (escrow), `−GHS 500` generator deposit.

### Profile screen (`profile.tsx`)
- **No header**, accent **locked green**.
- Header card: accent-tint avatar `60²` radius 20 "AB", name "Ama Boateng" `18/800`, "East Legon, Accra · Member since 2024", verified pill (accent tint) "Verified · TrustScore 92".
- Menu rows (white, radius 14): 📦 My orders & bookings · 🏷️ My listings (**→ opens My Listings**) · ⭐ Reviews & TrustScore · 💳 Payment methods · ⚙️ Settings.

### Create Listing (`app/create.tsx` — modal route)
Full-screen modal (`presentation:'modal'`). Reached **3 ways**: (1) raised center **+ "Sell"** FAB in the tab bar, (2) **"+ Sell"** pill in the Home header, (3) **My Listings → "New listing"**.
- Top bar (white): close **✕** (36² radius 11 `#F3F3F1`) + title "Create listing" `17/800`.
- **Type selector**: same segmented-pill control as the mode selector, options **ITEM / SERVICE / RENTAL** → sets a local `createType` that themes the modal's accent (green/teal/purple) + sublabel ("Item for sale / Service offered / Item for rent"). This accent is **local to the modal**, independent of the global `mode`.
- **Photos**: dashed upload box (`2px dashed #CFCFCA`, bg `#FBFBF9`, radius 18) with accent-tint icon tile + "Add photos / Up to 8 · first is the cover".
- **Title** (TextInput, controlled), placeholder varies by type.
- **Price (GHS)**: "GHS" prefix + numeric TextInput, placeholder varies by type.
- **Details**: Category row (tap → picker) + Location row (prefilled "East Legon").
- **Description**: multiline TextInput.
- Sticky footer (white, top hairline): **Post listing** CTA (bg accent / accentText, check icon). On submit → prepend a new item to `listings` (status Active, 0 views), reset the form, navigate to My Listings, toast "Listing posted".

### My Listings (`app/listings.tsx` — modal/stack route)
Full-screen, accent **locked green**. Reached from Profile → My listings (or after posting).
- Top bar: back **‹** + "My listings" + "N active" count.
- **"New listing"** button (green) → opens Create Listing.
- **Listing cards** (`components/MyListingCard.tsx`): thumbnail + **type badge** (colored by that listing's type accent) + **status** dot/label (Active `#0A7D3D` / Paused `#9A9EA6`) + title + price; footer row with `views` + `chats` stats and two buttons: **Pause/Activate** (toggles status, neutral chip) and **Edit** (dark chip → toast).

### Bottom tab bar (`(tabs)/_layout.tsx`)
- Translucent white `rgba(255,255,255,0.92)` + blur, top hairline, pad `9/14/24`. **5 slots: Home · Chat · [ + ] · Wallet · Profile** — icon `23` + label `10/700`. The **center +** slot is a raised accent square (`56²` radius 19, `margin-top:-4`, accent bg / accentText `+` icon, soft accent shadow) that opens Create Listing — **no text label**. Being the 3rd of 5 equal slots, it sits dead-center.
- **Search is NOT a tab.** **Active icon+label = current effective accent** (mode accent on Home; locked green on Chat/Wallet/Profile), inactive `#9CA3AF`. iOS home-indicator pill `130×5` radius 3 `#111317@.85`.
- Use a **custom `tabBar`** so the active tint can read mode from Context.

### Toast (`ToastContext` + `Toast`)
- Global provider exposes `showToast(msg)`. Renders pinned above the tab bar (`bottom: 98`), dark `#15171C` pill radius 15, accent check circle + msg `13/700 #FFF`, spring-in, auto-dismiss ~2.2s.

---

## 7. Design tokens

**Mode accents & derived tints**
| Mode | Accent | On-accent text | Tag bg (13%) | Tag border (42%) |
|------|--------|----------------|--------------|------------------|
| Shop | `#CCFF00` | `#1A1A1A` | `#FAFFE6` | `rgba(204,255,0,0.42)` |
| Services | `#008080` | `#FFFFFF` | `#E6F2F2` | `rgba(0,128,128,0.42)` |
| Rent | `#9B5DE5` | `#FFFFFF` | `#F5EEFC` | `rgba(155,93,229,0.42)` |

**Neutrals:** canvas `#F6F6F4` · surface `#FFFFFF` · chip/input `#F3F3F1` · seg track `#EEEEEC` · text `#111317` / secondary `#84888F`,`#8A8F98` / muted `#9A9EA6` · inactive nav `#9CA3AF` · inactive seg `#83878E` · promo gradient `#15171C→#24272F` · success green `#0A7D3D`.

**Type (Manrope, 400–800):** 30/800 balance · 22/800 screen title · 22/800 wordmark · 17/800 section · 15.5/800 card title · 14.5/800 chat name · 14/800 CTA · 13.5 body · 12.5 meta · 11–11.5 sub · 10.5/700 tags · 10/700 nav.

**Radii:** card 22 · promo/balance 20–22 · seg track 16 / pill 12 · search/CTA 14 · avatar tiles 14–20 · chips 8–11.

**Shadows:** card `0 6px 22px -10px rgba(17,19,23,.18), 0 1px 0 rgba(17,19,23,.03)` · pill `0 4px 12px -2px rgba(17,19,23,.25)` · row `0 4px 16px -12px rgba(17,19,23,.2)` · toast `0 16px 40px -12px rgba(0,0,0,.5)`.

**Motion:** pill slide spring ~320ms overshoot · accent crossfade 250ms · labels/nav 200ms · feed enter 320ms ease-out · press `scale .97` · modal slide-up.

> RN note: `color-mix` isn't supported — use the literal tint hex above. `backdrop-filter` blur → `expo-blur` `<BlurView>` (or solid `rgba(255,255,255,0.96)` fallback).

## 8. Assets
- Icons: line icons (house, pin, bell, search, chat, wallet, profile, star, chevron, check, arrows, plus) — `lucide-react-native`.
- Card/avatar images: placeholders — supply real images from the listings API.
- Font: **Manrope** via `@expo-google-fonts/manrope`.

---

## 10. ▶ Build order — do these ONE AT A TIME

- [x] **Step 0 — Foundation.** Deps, tailwind tokens, `lib/theme.ts` + `lib/mockData.ts`, `ModeContext`, root layout. *Verify: app boots, font loads.*
- [x] **Step 1 — Header + ModeSelector.** `AppHeader`, `ModeSelector` (Reanimated pill), `SearchBar`. *Verify: pill slides, colors + labels swap, contrast correct.*
- [x] **Step 2 — ListingCard + Home feed.** `PromoStrip`, `TrustBadge`, `Tag`, `ListingCard`; current mode's 3 cards; `ToastContext` + `Toast`; CTA fires toast. *Verify: cards match in all 3 modes, toast shows.*
- [x] **Step 3 — Search.** SearchBar filters the feed live; Results header + count + empty state. *Verify: typing filters, clear works, empty state shows.*
- [x] **Step 4 — Bottom tab bar.** Custom tab bar, **5 slots: Home · Chat · [centered + FAB, no label] · Wallet · Profile**. Active tint = effective accent, home-indicator pill, blur bg. The + opens the Create Listing modal. *Verify: + is dead-center & label-less, active tab lights in mode color (green on Chat/Wallet/Profile).*
- [x] **Step 5 — Chat.** Thread list, accent avatars + unread dots, tap → toast.
- [ ] **Step 6 — Wallet.** Balance card + Top up/Withdraw + transaction rows (+/− colors).
- [ ] **Step 7 — Profile.** Profile header card + verified pill + menu rows.
- [ ] **Step 8 — Create Listing + My Listings** (`create.tsx`, `listings.tsx` + `MyListingCard`). Create modal (local type selector themes it, controlled Title/Price/Description, photo box, Post prepends to `listings`) and My Listings (cards with status toggle + edit). Wire all 3 entry points: center **+** FAB, header **+ Sell** pill, Profile → My listings. *Verify: post a listing and see it Active at the top; pause/activate toggles.*
- [ ] **Step 9 — Polish.** Press states, feed enter animation, modal slide-up, safe-area insets, toast timing.
