# Handoff: Nearbuy — Three-Mode Marketplace (Mobile)

> Target stack: **Expo (React Native) + TypeScript + NativeWind**, Expo Router (`app/` dir).
> Repo: `nearbuy-mobile/` with `app/`, `components/`, `lib/`, `assets/`, `global.css`, `tailwind.config.js`, `metro.config.js`, `nativewind-env.d.ts`.
>
> **This is the v3 spec.** See `Nearbuy.dc.html` (interactive prototype) for the intended look and every interaction — it now demonstrates the pre-login Auth flow, Listing Detail, Chat Conversation, and Checkout/Escrow end-to-end.

---

## 0. ⚡ RESUMING MID-BUILD — read me first
Build order is a checklist worked **one step at a time**; finish, run, and visually verify each step before the next.

**v3 changes vs v2 (all now in the prototype + spec'd below):**
1. **Pre-login Auth flow (Step A — build FIRST):** Splash → Onboarding (3 mode slides) → Sign Up → OTP verify → Login → Forgot-password. The original handoff assumed a logged-in user; it doesn't. Spec in §5.5 + §6.
2. **Listing Detail screen:** full product/service/rental page with hero image, seller card + TrustScore, spec rows, description, tags, escrow note, sticky Chat + buy/book/rent CTA. Spec in §6.
3. **Chat Conversation screen:** the messaging view inside a thread — header, listing-context chip, safety banner, message bubbles, composer with send + auto-reply. Spec in §6.
4. **Checkout / Escrow flow:** bottom-sheet → order summary + fee breakdown + MoMo method + escrow banner → processing → success (order ref). Spec in §6.
5. **Bottom nav** is **5 slots with a centered "+"** (Home · Chat · [ + ] · Wallet · Profile); **Search is NOT a tab** — it's the header field on Home.
6. **Sell / Create-listing flow** (Create Listing modal + My Listings) reachable from the center **+** FAB, the **+ Sell** header pill, and Profile → My listings.

**Navigation note:** the prototype is one file, so it fakes routing with a `stage` state (`splash | onboarding | login | signup | otp | forgot | app`) for auth and absolute-positioned overlays for Detail/Conversation/Checkout. **In Expo, these become real routes** — see §4 and §5.5.

---

## 1. Overview
Nearbuy is a location-based marketplace for Ghana with **three modes in one app** — **Shop** (buy goods), **Services** (book pros), **Rent** (rent equipment). The signature interaction: a **mode selector** in the header re-themes the whole app (accent color + text-on-accent) and swaps the feed's content + CTA. The prototype covers the **Home, Chat, Wallet, and Profile** tabs (search lives in the Home header), plus the **Sell / Create-listing** flow, the **pre-login Auth flow**, **Listing Detail**, **Chat Conversation**, **Checkout/Escrow**, and a toast/confirmation system.

## 2. About the design files
`Nearbuy.dc.html` is a **design reference** — an interactive HTML prototype. **It is not production code to copy.** Recreate it in the Expo app using React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`) and **NativeWind** classes. `support.js` is only the browser preview runtime — **do not port it**.

## 3. Fidelity
**High-fidelity.** Colors, type scale, spacing, radii, shadows, motion, and copy are all final. The only placeholders are **card images** (hatched gray boxes) — wire to real images.

---

## 4. Where things go (Expo Router structure)

```
nearbuy-mobile/
├─ app/
│  ├─ _layout.tsx                # Root stack; wraps app in <AuthProvider> + <ModeProvider> + <ToastProvider>
│  ├─ index.tsx                  # SPLASH — logo while fonts load + auth check; redirects to (auth) or (tabs)
│  ├─ (auth)/                    # PRE-LOGIN group (no tab bar). Redirect here when no valid token.
│  │  ├─ _layout.tsx             # Stack; hides header
│  │  ├─ onboarding.tsx          # 3 mode slides (Shop/Services/Rent), themed accent per slide
│  │  ├─ signup.tsx              # full name, email, phone, password + validation
│  │  ├─ verify.tsx              # OTP — 5-digit code + 30s resend cooldown
│  │  ├─ login.tsx               # email/phone + password + Forgot link
│  │  └─ forgot.tsx              # multi-step: request → code → new password → done
│  ├─ (tabs)/
│  │  ├─ _layout.tsx             # Tabs navigator — custom tab bar; redirects to login when no token
│  │  ├─ home.tsx                # HOME  (feed + mode selector + in-header search)  [route "/" via redirect]
│  │  ├─ chat.tsx                # CHAT  (message threads)
│  │  ├─ wallet.tsx              # WALLET (balance + transactions)
│  │  └─ profile.tsx             # PROFILE (user + menu)
│  ├─ create.tsx                 # CREATE LISTING (modal route — the Sell flow)
│  ├─ listings.tsx               # MY LISTINGS (manage your posts)
│  ├─ listing/[id].tsx           # LISTING DETAIL (image, seller+TrustScore, specs, escrow, CTA)
│  ├─ chat/[id].tsx              # CHAT CONVERSATION (bubbles, listing chip, composer)
│  └─ checkout.tsx               # CHECKOUT / ESCROW (modal: review → processing → success)
├─ components/
│  ├─ ModeContext.tsx            # mode state + theme map (the heart of the app)
│  ├─ ModeSelector.tsx           # segmented control w/ animated pill
│  ├─ AppHeader.tsx              # brand row + Sell button + ModeSelector + SearchBar
│  ├─ SearchBar.tsx              # TextInput, clear button
│  ├─ ListingCard.tsx            # the marketplace card (image/price/trust/tags/CTA)
│  ├─ MyListingCard.tsx          # owner's listing card (status toggle + edit)
│  ├─ PromoStrip.tsx             # dark promo banner
│  ├─ Toast.tsx + ToastContext.tsx  # global confirmation toast
│  ├─ AuthInput.tsx              # labelled TextInput + inline error (auth forms)
│  ├─ OtpInput.tsx               # 5-box code input w/ auto-advance focus
│  ├─ SellerCard.tsx             # avatar + name + Verified/TrustScore pill (Listing Detail)
│  ├─ MessageBubble.tsx          # incoming (white) / outgoing (ink) chat bubble
│  └─ TrustBadge.tsx, Tag.tsx    # small reusables
├─ lib/
│  ├─ AuthContext.tsx            # { user, token, isLoading, login(), register(), verifyOtp(), logout() } + secure-store
│  ├─ theme.ts                   # color tokens, type scale, radii, shadows
│  └─ mockData.ts                # listings, chat, txns, profile rows, conversations
└─ global.css / tailwind.config.js   # extend theme with Nearbuy tokens
```

**Routing note (collision avoidance):** `app/index.tsx` is the splash at `/`, so the Home tab lives at `app/(tabs)/home.tsx` (not `(tabs)/index.tsx`) to avoid two screens resolving to `/`. The splash redirects to `/(tabs)/home` or `/(auth)/*`; the tabs layout sets `initialRouteName="home"`.

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

> ⚠️ **Styling = inline only; NativeWind is removed.** On this stack (React 19 + RN 0.81 new arch) NativeWind's `jsxImportSource` broke rendering: `className` utilities didn't apply, and even without `className` it silently dropped the background of **function-form** `style={({pressed}) => ({…})}` Pressables (Sell/Explore/Buy Now/Top up/Withdraw). It's been stripped from `babel.config.js` / `metro.config.js` and the `global.css` import dropped. **Style everything inline** with `style={{…}}`, pulling tokens from `lib/theme` (`COLORS`/`MODES`/`FONTS`/`SHADOWS`). Do **not** re-add `className` or the NativeWind build wiring.

---

## 5. State / theming model

```ts
export type Mode = 'shop' | 'services' | 'rent';
export type Tab  = 'home' | 'search' | 'chat' | 'wallet' | 'profile';

export interface ModeTheme {
  accent: string; accentText: string; cta: string; searchHint: string;
  promoTitle: string; promoSub: string; toast: string;
}
```
- `ModeContext` holds `{ mode, setMode, theme }`. Every screen reads `theme` from it.
- **Header visibility & accent lock:** the header (brand row + ModeSelector + SearchBar) renders **only on Home & Search**. On **Chat / Wallet / Profile** the header is hidden and the accent is **locked to brand green `#CCFF00`** (dark `#1A1A1A` on-accent text) regardless of mode. Effective theme: `home`/`search` → `MODES[mode]`; `chat`/`wallet`/`profile` → `MODES.shop`. The active bottom-tab color uses this same effective accent.
- `accentText` is the **contrast rule**: dark charcoal on Volt Green, white on Teal & Purple. Always read `theme.accentText`.
- Active **bottom-tab** color = current effective accent; inactive tabs = `#9CA3AF`.

## 5.5 Auth & navigation model

The prototype fakes routing with a single `stage` state; in Expo these are real routes (see §4). Map the prototype's stages as:

| Prototype `stage` | Expo route | Notes |
|---|---|---|
| `splash` | `app/index.tsx` | Logo while fonts + auth check run; auto-redirects. |
| `onboarding` | `(auth)/onboarding` | First launch only (persist a `seenOnboarding` flag). |
| `signup` / `otp` / `login` / `forgot` | `(auth)/*` | Stack screens, no tab bar. |
| `app` | `(tabs)/*` | The logged-in experience. |

```ts
export interface AuthState {
  user: { name: string; email: string; phone: string } | null;
  token: string | null;
  isLoading: boolean;          // true while reading token from secure store on launch
  login(idOrEmail, password): Promise<void>;
  register(fields): Promise<void>;   // → OTP
  verifyOtp(code): Promise<void>;    // → logged in
  logout(): void;
}
```
- `AuthContext` lives **above** `ModeContext`. On launch, read the token from **`expo-secure-store`** (never AsyncStorage) — if valid, land on `(tabs)`; else `(auth)`. (Web has no SecureStore → falls back to `localStorage`/memory so the flow still runs in a browser.)
- **Protect `(tabs)`**: in `(tabs)/_layout.tsx`, redirect to `/(auth)/login` when `!token`.
- **Logout** (Profile → Log out) clears secure store, resets `AuthContext`, navigates to `(auth)/login`.
- Auth/onboarding screens render on the **light canvas `#F6F6F4`**, brand green accent (`#CCFF00`); the only mode theming is the **onboarding carousel**, where each of the 3 slides uses its mode accent (green → teal → purple).
- For backend wiring (`/api/auth/register`, `/verify-otp`, `/login`, `/refresh`) see the to-do list §1.1 / §2.3. The submit handlers are **stubs** — replace with real calls.

---

## 6. Screens & components (exact specs)

### Global header (`AppHeader`) — appears on Home & Search
- White bg, padding `4/20/16`, bottom hairline `0 1px 0 rgba(17,19,23,0.05)`.
- **Brand row:** accent-bg rounded icon (`26²`, radius 9) with house glyph in `accentText`; wordmark "Nearbuy" `22/800 #111317 ls -0.6`; location subtitle pin + "East Legon · 5 km radius" `11.5/600 #8A8F98`. Right: **bell button** `42²` radius 14 bg `#F3F3F1`, accent unread dot → tap → toast "No new notifications".
- **ModeSelector** + **SearchBar** below.

### ModeSelector (segmented control) — the core component
- Track full-width, bg `#EEEEEC`, radius 16, padding 5.
- **Sliding pill:** absolute, inset 5, `width: (100%-10)/3`, radius 12, bg = accent, shadow `0 4px 12px -2px rgba(17,19,23,0.25)`; `translateX(index*100%)`. Animate with Reanimated spring (~320ms overshoot); accent bg crossfades 250ms.
- 3 buttons SHOP / SERVICES / RENT, `flex:1`, `12.5/800 ls 0.6`. Active label = `accentText`; inactive = `#83878E`.

### SearchBar — **working filter**
- Row, bg `#F3F3F1`, radius 14, pad `12/14`, gap 10: magnifier + `TextInput` (placeholder = `theme.searchHint`, `13.5/500`) + clear "×" (only when query non-empty).
- Typing filters the feed live (case-insensitive over title + meta + tags of the current mode).

### Home feed (`app/(tabs)/home.tsx`)
- ScrollView, bg `#F6F6F4`, pad `18/20/110`.
- **PromoStrip** (hidden while searching): dark gradient `#15171C→#24272F`, radius 20; accent circle top-right `opacity .18`; title `13.5/800 #FFF` + sub `11.5/500`; **Explore** chip → toast "Exploring {Mode}".
- Section header: `{searching ? 'Results' : 'Popular near you'}` `17/800`, right = `{searching ? 'N found' : 'See all'}` `12.5/700 #9A9EA6`.
- **ListingCard ×N** (gap 16). Mode change replays a subtle enter anim.
- **Empty state** on 0 results: icon tile + `No matches for "{q}"` + hint.

### ListingCard (`components/ListingCard.tsx`)
- White, radius 22, shadow `0 6px 22px -10px rgba(17,19,23,0.18), 0 1px 0 rgba(17,19,23,0.03)`.
- Image area `h152`: **price chip** top-right; **TrustBadge** top-left.
- Body pad `15/16/16`: title `15.5/800 ls -.3`; meta `12.5/500 #84888F`; **tags** (accent tint); **CTA** = `theme.cta`, bg accent → toast `"{theme.toast} · {card.title}"`. Image/title tap → Listing Detail.

### Chat screen (`(tabs)/chat.tsx`)
- **No header**, accent locked green. Title "Messages" `22/800`. Thread rows (white, radius 16): accent-tint avatar tile (`46²` r14, initial `16/800`) + accent unread dot; name `14.5/800` + time `11/600 #9A9EA6`; last message `12.5/500 #84888F` truncated. **Tap → push Chat Conversation** (`chat/[id]`).

### Chat Conversation (`chat/[id].tsx`)
The messaging view. Accent locked green. Reached from a Chat thread, Listing Detail "Message", and Checkout success "Message seller".
- **Header** (white, pad `50/16/12`): back ‹ + accent-tint avatar (`40²` r13) + name `15/800` + presence `11/600` green.
- **Listing-context chip** (bg `#F0F0ED`): hatched thumb + title `12/800` + price `11/600` + **View** chip → Listing Detail.
- **Safety banner** (centered pill): lock glyph + "Keep payments in Nearbuy · never share OTP codes" `10.5/700 #84888F`.
- **Messages**: bubbles `13.5/500`, pad `10/13`, max-width 78%. Incoming = white / `#111317`, left, radius `16 16 16 5`; outgoing = `#15171C` / white, right, radius `16 16 5 16`. Timestamp `9.5/600 #B0B3B9` under each.
- **Composer** (white): chip-bg `#F3F3F1` TextInput + accent send button (`44²` r14). Send appends an outgoing bubble + a canned reply ~1.1s later.

### Wallet screen (`(tabs)/wallet.tsx`)
- **No header**, accent locked green. Title "Wallet". **Balance card**: dark gradient, accent circle, "Available balance" `12/600 rgba(255,255,255,.55)`, **GHS 1,250.00** `30/800`; two buttons — **Top up** (accent) + **Withdraw** (outline) → toasts.
- "Recent activity" rows: icon tile, label `13.5/700`, sub `11.5/500`, amount right (`+` green `#0A7D3D` / `−` ink). Mock: `+GHS 500` top-up, `−GHS 120` AC repair, `−GHS 500` generator deposit.

### Profile screen (`(tabs)/profile.tsx`)
- **No header**, accent locked green. Header card: accent-tint avatar `60²` r20 "AB", name "Ama Boateng" `18/800`, "East Legon, Accra · Member since 2024", verified pill "Verified · TrustScore 92".
- Menu rows: 📦 My orders & bookings · 🏷️ My listings (→ My Listings) · ⭐ Reviews & TrustScore · 💳 Payment methods · ⚙️ Settings · 🚪 **Log out** (→ clears auth, returns to `(auth)/login`).

### Listing Detail (`listing/[id].tsx`)
Accent = that listing's mode. Reached by tapping a ListingCard's image/title.
- **Hero image** `h300` with floating **back ‹** + **favourite ♡** buttons (`40²` r13 white-blur).
- **Sheet** overlaps hero by `-22` (radius `26 26 0 0`): trust-badge row + pin "East Legon · 1.2 km"; title `21/800 ls -.5` + price `20/800` + unit `12/600` right; meta `13/500`.
- **SellerCard** (white r18): accent-tint avatar + name `14.5/800` + Verified · TrustScore pill + **Message** chip.
- **Details** table (white card, hairline rows): mode-specific key/value pairs.
- **Description** `13/500 #5C606A` lh 1.6; **Tags**; **Escrow note** card.
- **Sticky footer**: square outline **Chat** (`56` wide) + full-width **CTA** = `theme.cta` → opens Checkout.

### Checkout / Escrow (`checkout.tsx` — modal route)
Bottom-sheet over a scrim (`rgba(10,10,12,.42)`), radius `28 28 0 0`, max-height 94%, grab-handle. Accent = listing's mode. Three steps via local `coStep`:
- **review:** "Confirm {order|booking|rental}" + close ×. Listing summary. Breakdown: Item price, Service fee (`max(GHS 2, 1.5%)`), **Total**. Payment-method card (MTN MoMo "•••• 0247", "Change"). Escrow banner. Footer **Pay GHS {total}**.
- **processing:** spinner + "Securing your payment…" (~1.5s in prototype).
- **success:** accent check tile + "Payment secured" + **Order ref `NB-######`**; **Message seller** (→ Chat) + **Done** (→ close, toast "Order placed · escrow held").

### Create Listing (`app/create.tsx` — modal route)
Reached 3 ways: center **+** FAB, Home header **+ Sell** pill, My Listings → "New listing".
- Top bar: close **×** + "Create listing" `17/800`.
- **Type selector** (segmented pill): **ITEM / SERVICE / RENTAL** → local `createType` themes the modal accent (green/teal/purple). Independent of global `mode`.
- **Photos**: dashed upload box + accent-tint icon + "Add photos / Up to 8 · first is the cover".
- **Title**, **Price (GHS)** (prefix + numeric), **Details** (Category picker + Location prefilled "East Legon"), **Description** (multiline).
- Sticky footer: **Post listing** CTA → prepend new item to `listings` (Active, 0 views), reset form, go to My Listings, toast "Listing posted".

### My Listings (`app/listings.tsx`)
Full-screen, accent locked green. From Profile → My listings (or after posting).
- Top bar: back ‹ + "My listings" + "N active".
- **"New listing"** (green) → Create Listing.
- **MyListingCard**: thumbnail + type badge (typed accent) + status dot/label (Active `#0A7D3D` / Paused `#9A9EA6`) + title + price; footer: `views`/`chats` stats + **Pause/Activate** + **Edit**.

### Bottom tab bar (`(tabs)/_layout.tsx`)
- Translucent white `rgba(255,255,255,0.92)` + blur, top hairline, pad `9/14/24`. **5 slots: Home · Chat · [ + ] · Wallet · Profile** — icon `23` + label `10/700`. Center **+** = raised accent square (`56²` r19, `margin-top:-4`, accent bg) opening Create Listing — **no label**.
- **Search is NOT a tab.** Active icon+label = current effective accent, inactive `#9CA3AF`. iOS home-indicator pill `130×5` r3 `#111317@.85`. Custom `tabBar` so active tint reads mode from Context.

### Toast (`ToastContext` + `Toast`)
- `showToast(msg)`; pinned above the tab bar (`bottom: 98`), dark `#15171C` pill r15, accent check circle + msg `13/700 #FFF`, spring-in, auto-dismiss ~2.2s.

---

## 7. Design tokens

**Mode accents & derived tints**
| Mode | Accent | On-accent text | Tag bg (13%) | Tag border (42%) |
|------|--------|----------------|--------------|------------------|
| Shop | `#CCFF00` | `#1A1A1A` | `#FAFFE6` | `rgba(204,255,0,0.42)` |
| Services | `#008080` | `#FFFFFF` | `#E6F2F2` | `rgba(0,128,128,0.42)` |
| Rent | `#9B5DE5` | `#FFFFFF` | `#F5EEFC` | `rgba(155,93,229,0.42)` |

**Neutrals:** canvas `#F6F6F4` · surface `#FFFFFF` · chip/input `#F3F3F1` · seg track `#EEEEEC` · text `#111317` / secondary `#84888F`,`#8A8F98` / muted `#9A9EA6` · inactive nav `#9CA3AF` · inactive seg `#83878E` · promo gradient `#15171C→#24272F` · success green `#0A7D3D`.

**Type (Manrope, 400–800):** 31/800 splash wordmark · 30/800 balance · 26/800 auth title · 22/800 screen title · 22/800 wordmark · 17/800 section · 15.5/800 card title · 14.5/800 chat name · 14/800 CTA · 13.5 body · 12.5 meta · 11–11.5 sub · 10.5/700 tags · 10/700 nav.

**Radii:** card 22 · promo/balance 20–22 · seg track 16 / pill 12 · search/CTA/auth-input 14–15 · avatar tiles 14–20 · chips 8–11.

**Shadows:** card `0 6px 22px -10px rgba(17,19,23,.18), 0 1px 0 rgba(17,19,23,.03)` · pill `0 4px 12px -2px rgba(17,19,23,.25)` · row `0 4px 16px -12px rgba(17,19,23,.2)` · toast `0 16px 40px -12px rgba(0,0,0,.5)`.

**Motion:** pill slide spring ~320ms overshoot · accent crossfade 250ms · labels/nav 200ms · feed enter 320ms ease-out · press `scale .97`.

> RN note: `color-mix` isn't supported — use the literal tint hex above. `backdrop-filter` blur → `expo-blur` `<BlurView>`.

## 8. Assets
- Icons: `lucide-react-native`.
- Card/avatar images: placeholders — supply real images from the listings API.
- Font: **Manrope** via `@expo-google-fonts/manrope`.

---

## 10. ▶ Build order — do these ONE AT A TIME

> Work the checklist top-to-bottom. **Finish, run, and visually verify each step before starting the next.** Ask before adding any feature not in the spec.

- [x] **Step A — Auth flow** (`app/index.tsx` splash + `(auth)/*`). `AuthContext` + `expo-secure-store` (§5.5), `AuthInput`, `OtpInput`. Splash → Onboarding (3 themed slides) → Sign Up (validation) → OTP (5 boxes, 30s resend) → Login → Forgot (multi-step). Protect `(tabs)`; redirect to login when no token. Submit handlers stubbed. *Verify: cold start lands on splash → onboarding → can sign up/log in into the tabs; logout returns to login.*
- [x] **Step 0 — Foundation.** Deps, tailwind tokens, `lib/theme.ts` + `lib/mockData.ts`, `ModeContext`, root layout. *Verify: app boots, font loads.*
- [x] **Step 1 — Header + ModeSelector.** `AppHeader`, `ModeSelector` (Reanimated pill), `SearchBar`. *Verify: pill slides, colors + labels swap, contrast correct.*
- [x] **Step 2 — ListingCard + Home feed.** `PromoStrip`, `TrustBadge`, `Tag`, `ListingCard`; current mode's 3 cards; `ToastContext` + `Toast`; CTA fires toast. *Verify: cards match in all 3 modes, toast shows.*
- [x] **Step 3 — Search.** SearchBar filters the feed live; Results header + count + empty state. *Verify: typing filters, clear works, empty state shows.*
- [x] **Step 4 — Bottom tab bar.** Custom tab bar, **5 slots: Home · Chat · [centered + FAB, no label] · Wallet · Profile**. Active tint = effective accent, home-indicator pill, blur bg. The + opens the Create Listing modal. *Verify: + is dead-center & label-less, active tab lights in mode color (green on Chat/Wallet/Profile).*
- [x] **Step 5 — Chat list.** Thread list, accent avatars + unread dots, tap → toast. *(Row tap will switch to push `chat/[id]` in Step 8b.)*
- [x] **Step 6 — Wallet** (`wallet.tsx`). Balance card + Top up/Withdraw + transaction rows (+/− colors). *Verify: matches prototype.*
- [x] **Step 7 — Profile** (`profile.tsx`). Profile header card + verified pill + menu rows; Log out wired; My listings deep-links to `/listings`. *Verify: matches prototype.*
- [x] **Step 8 — Create Listing + My Listings** (`create.tsx`, `listings.tsx` + `MyListingCard` + `ListingsContext`). Create modal (local animated type selector themes it, controlled Title/Price/Description, photo box, Post prepends to shared `listings` state) and My Listings (cards with status toggle + edit). All 3 entry points wired: center **+** FAB, header **+ Sell** pill, Profile → My listings. *Verify: post a listing and see it Active at the top; pause/activate toggles.*
- [x] **Step 8a — Listing Detail** (`listing/[id].tsx`). Hero + back/fav, overlapping sheet, `SellerCard` (TrustScore), details table, description, tags, escrow note, sticky Chat + CTA. Card image/title pushes this. *Verify: accent matches the listing's mode; CTA opens Checkout.*
- [x] **Step 8b — Chat Conversation** (`chat/[id].tsx` + `MessageBubble`). Header, listing chip, safety banner, bubbles (in white / out ink), composer with send + canned reply. Wired from the Chat-list tap and the Detail/Checkout "Message" entry points. *Verify: send appends an outgoing bubble; reply follows.*
- [x] **Step 8c — Checkout / Escrow** (`checkout.tsx`, transparentModal). Bottom-sheet review → processing → success (order ref). Opened from Detail CTA and feed-card CTA. *Verify: Pay → spinner → success; Done toasts and closes; Message seller → conversation.*
- [x] **Step 8d — Full interactivity pass.** Every interactive control across the app is wired (no dead buttons): feed card image/title → Detail, card CTA → Checkout, chat rows → Conversation, header **+ Sell** → Create, all auth/nav/menu/footer buttons route or toast. *Verify: tap everything — nothing is inert.*
- [x] **Step 8e — Secondary pages.** Navigation buttons open real pages (placeholder data until backend): bell → **Notifications**, Profile → **Orders & bookings** / **Reviews & TrustScore** / **Payment methods** / **Settings**, Wallet **Top up**/**Withdraw** → `wallet/[action]` (amount + method + confirm), Create **Category** → picker (writes `draftCategory`), Checkout **Change** + Settings → Payment methods, Conversation **View** → Listing Detail. Shared `SubHeader`. *Verify: each opens its own screen; payment radio + settings toggles respond.*
- [x] **Step 9 — Polish.** Press-scale on every interactive control (incl. SubHeader back, SearchBar clear); staggered feed rise-in on mode change (`FadeInDown`, keyed by mode); checkout sheet slide-up (`SlideInDown`); safe-area (home-indicator) insets on the sticky footers (Listing Detail, Chat composer, Checkout); toast timing (2.2s, re-triggers on repeat); onboarding `FadeIn` slide transitions. *Verify: feels like the prototype end-to-end.*
