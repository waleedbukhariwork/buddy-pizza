# Buddy Pizza — Customer App: Complete UI/UX Design Specification

> **Design philosophy**: Buddy isn't corporate (Domino's), isn't a cold marketplace (Uber Eats), and isn't just a clone. Buddy is the friend who knows your order. **Warm. Fast. Trustworthy.** Every pixel must earn its place.

---

## Implementation Status

| Priority | Feature | Status |
|---|---|---|
| P0 | Mobile bottom navigation | ✅ Done |
| P0 | Food card add → in-place stepper | ✅ Done |
| P0 | Persistent cart bar (mobile) | ✅ Done |
| P1 | Size picker → bottom sheet | ✅ Done |
| P1 | Checkout form improvements | ✅ Done |
| P1 | Cart drawer micro-interactions + upsell row | ✅ Done |
| P2 | Home hero redesign (Syne font, floating animation, time-of-day bar) | ✅ Done |
| P2 | Confirmation confetti + live countdown | ✅ Done |
| P2 | Color system additions + error state separation | ✅ Done |
| P3 | OTP auth flow | ⬜ Todo (needs backend OTP endpoint) |
| P3 | Smart scroll header behavior | ✅ Done |
| P3 | Empty states with illustrations | ✅ Done (cart empty state) |

---

## 1. Design System Foundation

### Typography — Add One Display Voice

| Role | Font | Use |
|---|---|---|
| Hero / Section titles | **Syne Bold** (Google Fonts, free) | Headlines only |
| UI / Body / Buttons | Archivo (current) | Everything else |
| Prices / ETAs / Order #s | JetBrains Mono (current) | All numbers |

**Why Syne:** Geometric, confident, modern. It reads "premium" without being cold. Used 3–4 times per page max. One display font elevates the whole system.

### Color System — Fill the Gaps

```css
/* Tinted surfaces — for hovers, active states, backgrounds */
--bf-ember-08: rgba(232, 67, 31, 0.08);
--bf-amber-08: rgba(255, 182, 39, 0.08);
--bf-leaf-08:  rgba(47, 143, 78, 0.08);

/* Semantic — SEPARATE from brand colors */
--bf-error:   #ef4444;   /* NOT ember — errors are NOT brand red */
--bf-warning: #f59e0b;
--bf-info:    #3b82f6;

/* Surface depth */
--bf-surface-3: #fdf3e7;  /* nested cards, input bg */
```

**Why separate error from ember:** Users learn "red = mistake." Using brand red for both errors and CTAs creates a broken mental model.

### Spacing & Shape Language

```css
--radius-sm:  8px;   /* inputs, pills, small cards */
--radius-md:  14px;  /* cards — keep this */
--radius-lg:  20px;  /* bottom sheets, modals */
--radius-xl:  28px;  /* hero image frames */
--radius-full: 999px; /* pills, circular elements */
```

---

## 2. Navigation Shell

### A. Mobile Bottom Navigation ✅ DONE
- Fixed 60px bar + safe-area-inset-bottom
- 4 tabs: Home, Menu, Cart (badge), Account
- Cart badge: 3-loop pop animation on item add, then stops
- Press: scale(0.86) spring
- Hidden on ≥ 768px

### B. Smart Header Scroll Behavior
- Scrolling **down** → header slides up and hides (gains 64px)
- Scrolling **up** → header reappears
- Threshold: 80px before hiding
- Animation: 200ms ease-out

**Why:** Screen real estate on mobile is precious. Content beats chrome.

### C. Location in Header — Real Area Name
Show actual area: `[🔥 28 min]  [DHA Phase 5 ▼]  [🛒 2]`

Left: delivery time chip. Center: delivery area (tappable). Right: cart count.

**Why:** Delivery zone visibility is a top-5 UX concern. Users want confirmation they're ordering to the right place.

---

## 3. Home Page

### A. Hero Redesign
```
┌──────────────────────────────────────┐
│ [food photography — warm, overhead]  │
│                         ┌──────────┐ │
│  Hot pizza.             │[pizza🍕] │ │
│  At your door.          │ floating │ │
│  ──────────             │  image   │ │
│  Delivering to DHA ✓    └──────────┘ │
│                                      │
│  [  Order Now  ]  [ See Deals ]     │
└──────────────────────────────────────┘
```

- Headline: Syne Bold, 48px desktop / 36px mobile, ink — NOT ember
- Sub-line: "Delivering to [Area] · Avg 28 min · Free above Rs 500"
- CTA: "Order Now" — ember, 52px height
- Image: pizza with float animation (translateY 0 → -8px, 3s loop)

**Why no ember headline:** Reserve ember for ONE call to action. Headlines in ink make the CTA pop harder.

### B. Time-of-Day Context Bar
40px strip, full width, just above hero:

| Time | Message |
|---|---|
| 6am–11am | "Good morning 🌅 Breakfast specials are live" |
| 11am–2pm | "Lunch hour · Order now, eat by 1PM" |
| 5pm–9pm | "Dinner time 🌙 Family deals available" |
| 9pm–2am | "Late night? We're still cooking 🔥" |

**Why:** Context is the highest form of personalization. A Date() check costs zero effort.

### C. Category Strip — Horizontal Pills
Replace 6-column grid with single-row horizontal scroll strip.
- Each pill: icon above label, cream bg, ember active state
- Smooth scroll to menu section on tap — keeps user on home

**Why pills over grid:** Grid requires 2D scanning. A horizontal strip is one-dimensional. Faster.

### D. Deal Cards — Real Savings
- **Savings badge:** "Save Rs 280" in leaf green (actual rupee amount, not %)
- Items included: 3 lines max, "... +2 more" truncation
- No fake countdown timers — if no real deadline, don't fake urgency

**Why actual rupee savings:** "Save Rs 280" > "30% off" for lower-income markets. Concrete number is more motivating.

### E. Fan Favourites — Social Proof
Rename "Most Ordered" → **"Fan Favourites"**
- "47 orders today" pulled from real backend data
- If no data: fallback to "Bestseller" badge — never show 0 or fake numbers

---

## 4. Menu Page

### A. Category Tabs — Anchor Scroll
- Tapping category → anchor scroll (not filter)
- Active tab auto-highlights via IntersectionObserver
- Tab bar: sticky, blur backdrop (backdrop-filter: blur(12px))

**Why anchor over filter:** Filtering removes products. Anchor shows full menu is there.

### B. Food Card ✅ IN-PLACE STEPPER DONE
- Non-sized items: add → [− qty +] stepper in place
- Minus at qty=1 shows × (removes item)
- Spring pop animation on stepper appearance
- Sized items: keep size picker

### C. Size Picker → Bottom Sheet
Replace popup-above-button with proper bottom sheet:
```
┌──────── Size Options ────────┐
│                              │
│  ○  Small  6"  · Rs 590     │
│  ●  Medium 9"  · Rs 890  ✓  │
│  ○  Large  12" · Rs 1,190   │
│           [Best Value]       │
│                              │
│  [   Add to Cart   Rs 890  ]│
└──────────────────────────────┘
```
- Slides up from bottom with spring animation
- Backdrop: black 40% opacity
- Close: swipe down or tap backdrop
- Size visual circles (20px / 30px / 40px CSS circles)
- Default: medium pre-selected

**Why bottom sheet:** Thumb-friendly. Commands attention without blocking full screen.

### D. Persistent Cart Bar ✅ DONE

---

## 5. Cart Drawer

### A. Open Animation
- Spring: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Items stagger-in: each 40ms after previous
- Total count-up: 0 → final in 500ms

### B. Close — Three Ways
| Method | Implementation |
|---|---|
| X button | Top-right, always visible, 44×44px |
| Backdrop tap | Click outside |
| Drag handle | Handle bar, swipe-down on mobile |

**Why three ways:** Never trap a user.

### C. Item Row — Removal Animation
- Removal: item height collapses (300ms ease)
- Gap fills smoothly

### D. Upsell Row — "Don't Forget…"
Between last item and subtotal:
```
──── Don't forget ────
[Garlic Bread Rs 120 +]  [Coke Rs 80 +]  [Dip Rs 50 +]
```
- 3 items max, horizontal scroll
- Smart: pick items from different category than cart contents

**Why:** In-cart upsell has highest conversion of any upsell placement.

### E. Promo Code — Collapsed by Default
`"Have a promo code?"` text link → expands input on tap.

**Why:** Always-visible promo field increases price anxiety for full-price customers.

### F. Empty Cart State
Animated pizza box + "Your order is empty. Let's fix that." + "Browse Menu" CTA.

---

## 6. Checkout Page

### A. Progress Bar — Replace "Step 1 of 3"
```
● ━━━━━━━ ● ━━━━━━━ ●
Address     Payment   Done
```
- Filled: ember red. Completed: leaf green with checkmark. Animates on advance.

### B. Address — Smart First
- "📍 Use my current location" — primary option, full-width
- Saved addresses as selectable pills (if previous order)
- New address expands as accordion below
- Landmark: collapsed ("+Add landmark" link)

**Why:** GPS collapses 4 fields to 1 tap for most users.

### C. Payment — Show Only What Works
Remove disabled Card and EasyPaisa options. Show only Cash on Delivery.

**Why:** Disabled CTAs hurt conversion 15%+. Don't show what users can't use.

### D. Delivery Time — Clock Frame
```
[●] Get it ASAP
    Your order arrives by ~8:15 PM
    ════════════════░░░░░░
    7:43 PM         8:15 PM
```
Show actual clock time, not "28–34 min."

**Why:** "Your pizza arrives at 8:15 PM" is concrete. Abstract minutes create anxiety.

### E. Order Summary — Fixed Bottom on Mobile
Collapsed bar: "4 items · Rs 1,540 ▲" — expands to full summary.

### F. Place Order Button
```
[  Place Order · Rs 1,540  →  ]
```
- Full width, ember red, 56px height
- Shows total on the button
- Brief loading state on press → success

---

## 7. Confirmation Page

### A. Arrival Animation — 500ms Delight Burst
On load:
1. Confetti burst (ember + amber, 500ms, then ends)
2. Checkmark circle draws in (SVG stroke, leaf green, 300ms)
3. "Order confirmed!" slides up (200ms)
4. Order card slides in from bottom (400ms)

**Why confetti ends:** Infinite celebration feels fake.

### B. Live Progress Tracker
```
● ────── ○ ────── ○ ────── ○
Received   Preparing   With Rider   Delivered
```
- Active step: pulsing ring (stops when rider assigns)
- Completed: leaf green dot + draw animation

### C. ETA Countdown
```
  Arriving in
   ┌─────────┐
   │  28:00  │  ← live countdown
   └─────────┘
   Est. 8:15 PM
```

**Why:** Visible countdown reduces support messages by 30%+.

### D. Rider Card — Animates In
Slides in with spring when rider assigned via polling.

---

## 8. Auth Pages

### A. Phone OTP as Primary Login
Pakistan's digital ecosystem runs on OTP. Phone + password is foreign to many users.
```
│  Enter your phone number   │
│  ┌─────────────────────┐   │
│  │ +92  3XX XXXXXXX    │   │
│  └─────────────────────┘   │
│  [  Send Code  ]           │
│  ─── or ───────────────── │
│  Continue with email →     │
│  Continue as guest →       │
```
- 4 large OTP digit boxes (auto-advance, auto-paste from SMS)
- 60s resend cooldown
- Guest checkout option

**Why guest checkout:** 30–40% of first-time users abandon if forced to register.

### B. Dynamic Social Proof on Left Panel
- Today's order count from backend: "1,240 orders delivered today"
- Testimonials cycle every 5s (fade, not slide)

### C. Real-Time Form Validation
| Field | Trigger |
|---|---|
| Email | On blur |
| Phone | Format as typed (+92 XXX XXXXXXX) |
| Password | Live strength meter |

Errors: inline, 12px, `--bf-error` color (never ember red for errors).

---

## 9. Micro-Interactions

| Interaction | Animation | Duration |
|---|---|---|
| Add to cart | Button scale 0.95→1.05→1 | 150ms |
| Remove from cart | Item height collapses | 300ms |
| Step advance in checkout | Right-to-left slide | 250ms |
| Success states | SVG stroke draw | 400ms |
| Page transitions | Fade + slight Y offset | 200ms |
| Cart item count change | Number flip (3D rotate) | 200ms |
| Error shake | translateX oscillation | 300ms |
| Bottom sheet open | Spring (slight overshoot) | 350ms |

**Rule:** Every animation confirms, guides, or delights. If it does none of these, cut it.

---

## 10. Empty & Error States

| State | Copy | Visual |
|---|---|---|
| Empty cart | "Your order is empty. Let's fix that." | Animated pizza box |
| No orders yet | "Be the first to taste the Buddy difference" | Illustrated chef |
| Search no results | "Nothing found for '[query]'. Try something else?" | Shrug |
| API error | "Something went hot. Try again?" | Flame + retry |
| Offline | "No connection. Check your network." | Cloud with X |

**Brand voice in errors:** "Something went hot" is warm, slightly humorous, on-brand.

---

## 11. Implementation Priority

| Priority | Feature | Impact | Effort |
|---|---|---|---|
| 🔴 P0 | Mobile bottom navigation | Highest | Medium |
| 🔴 P0 | Food card add → in-place stepper | High | Low |
| 🔴 P0 | Persistent cart bar on mobile | High | Low |
| 🟠 P1 | Size picker → bottom sheet | High | Medium |
| 🟠 P1 | Checkout form improvements | High | Medium |
| 🟠 P1 | Cart drawer micro-interactions + upsell | High | Medium |
| 🟡 P2 | Home hero redesign + Syne font | Medium | Medium |
| 🟡 P2 | Confirmation confetti + live countdown | Medium | Low |
| 🟡 P2 | Color system + error state separation | Low | Low |
| 🟢 P3 | OTP auth flow | High | High |
| 🟢 P3 | Smart scroll header | Low | Low |
| 🟢 P3 | Empty states with illustrations | Medium | Medium |
