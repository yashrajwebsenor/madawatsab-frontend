# VVIP Tier — Mobile App Implementation Guide

This document describes the **VVIP subscription tier** shipped on the backend + web panel, so it can be replicated **identically in the mobile app**. It covers the data contract, the behaviour rules, and the exact visual treatment.

Read this alongside `subscription-mobile-implementation.md` — VVIP is a **new tier layered on the existing subscription module**, not a replacement. Everything in that doc (capabilities, contact-view wallet, blur rules, purchase flow) still applies unchanged.

> **Golden rule (unchanged):** the backend is the source of truth. Every flag below is a **UX hint** — the server already enforces the VVIP rules on its own (`403` on a blocked interest, pre-mixed discover feed). Render the states the API gives you; do not invent access logic, and never assume a flag grants real access.

---

## 1. What VVIP is

VVIP is the top subscription tier. It bundles **every capability the Assisted plan has**, plus three VVIP-only privileges:

| Privilege | Who implements it |
|---|---|
| **Gold profile card** — VVIP members render with an animated gold treatment everywhere their card appears | **You** (§4) |
| **Feed placement** — VVIP profiles are seeded into every member's discover feed; a VVIP's own feed is ~70% other VVIPs | Backend (already done — §3.1) |
| **Inbound interest protection** — only other VVIPs may send a VVIP an interest | Backend enforces; **you** render the rejection (§3.2) |

### 1.1 The one rule that matters most

**VVIP-ness is a capability, not a plan name.**

```
✅ isVvip = subscription.capabilities.isVvip        // do this
❌ isVvip = subscription.planType === "vvip"        // do NOT do this
```

The tier is a flag on the plan, snapshotted onto the subscription at purchase. Admin can move the tier to a different plan later, and existing subscribers keep exactly what they bought. Gating on `planType` will break the moment that happens. The backend deliberately gates on the flag everywhere — mirror it.

---

## 2. Data Contract

### 2.1 Own profile — `GET /profile`

The existing `subscription` summary gains **one new capability flag**:

```jsonc
{
  "subscription": {
    "hasActivePlan": true,
    "planName": "VVIP",           // label map: vvip → "VVIP"
    "planType": "vvip",           // basic|silver|gold|assisted|unlimited|vvip|null
    "planDuration": "quarterly",
    "expiryDate": "2026-10-17T...",
    "capabilities": {
      "canMessage": true,
      "hasAdvancedFilters": true,
      "canBlock": true,
      "hasProfileBoost": true,
      "hasRelationshipManager": true,
      "isVvip": true              // ← NEW. This is the tier flag.
    },
    "contactViewBalance": 300,
    "contactViewLifetime": 300,
    "viewCountRemaining": 300
  }
}
```

When there is no active plan, `capabilities.isVvip` is `false` (same as every other capability).

### 2.2 Other users — `GET /profile/:id` and `GET /profile/discover`

Every profile/match object gains an optional flag:

```jsonc
{ "_id": "...", "fullName": "...", "isPremium": true, "isVvip": true }
```

- **`isVvip` may be absent.** Absent means not VVIP. Always read it as `!!profile.isVvip`.
- It is **present for unsubscribed viewers too**. Like `isVerified` and `isPremium`, it survives the basic-only payload projection — an unsubscribed viewer still sees VVIP profiles in gold. Do not hide the treatment behind the viewer's own plan.
- It is a **live, derived value** (computed from the target's active subscription), not a stored user field. It disappears on its own when their plan expires.

### 2.3 Plans list — `GET /plans?duration=quarterly`

Each plan now returns `isVvip: boolean` alongside the other capability flags. Use it to give the VVIP **plan card** the gold treatment on the pricing screen (§4.4).

```jsonc
{
  "name": "VVIP",
  "type": "vvip",
  "tagline": "(By Invitation Standard)",
  "isVvip": true,
  "canMessage": true, "hasAdvancedFilters": true, "canBlock": true,
  "hasProfileBoost": true, "hasRelationshipManager": true,
  "features": ["Everything in Assisted, plus:", "Exclusive gold VVIP profile card", "..."],
  "pricing": { "duration": "quarterly", "originalPrice": 24999, "discountedPrice": 19999, "contactViewLimit": 300, "badgeText": "VVIP" }
}
```

> ⚠️ **Seeded prices are placeholders** pending admin edit. Never hardcode a price — always render `pricing.discountedPrice` from the API.

### 2.4 Purchase flow — no change

Buying VVIP is identical to buying any other plan:

```jsonc
POST /payments/create  { "paymentType": "plan", "planId": "<id>", "planDuration": "quarterly" }
```
→ run the payment → `POST /payments/verify` → refresh own profile. The `isVvip` capability appears in the refreshed `subscription`. Re-purchase while a plan is active is still rejected server-side.

---

## 3. Behaviour

### 3.1 Discover feed — **do not re-order it**

The backend already interleaves VVIP and normal profiles before it responds:

- **Normal member's feed:** 9 normal + 1 VVIP per page of 10, VVIP at the end of the page.
- **VVIP member's feed:** ~70% VVIP / ~30% normal per page, shuffled together.
- When one pool runs out, the other backfills. Pages stay full until everything is exhausted.

**What you must do: nothing.** Render `data[]` in the order received.

> ⚠️ **The gotcha:** if the app sorts, groups, or re-orders the discover response client-side (e.g. "VVIP first", sort by recency, de-dupe into sections), it **destroys the server's mix** and the whole feature silently stops working. The mix only exists in the array order. Same rule that already applies to `cardType: "ad"` cards — keep the sequence intact.

**Pagination is unchanged** (`page` / `limit`, ads still injected as `cardType: "ad"`).

> ⚠️ **Keep `limit: 10`.** A normal member's VVIP allowance is `floor(limit / 10)` per page. `limit: 10` → 1 VVIP. `limit: 20` → 2. But **`limit: 6` → 0**, and VVIP profiles vanish from the feed entirely. If you page with anything under 10, VVIP placement breaks silently. Web uses `limit: 10`.

### 3.2 Interests — asymmetric, and it's deliberate

| Sender | Receiver | Result |
|---|---|---|
| Normal / any paid tier | **VVIP** | ❌ Blocked — `403` |
| **VVIP** | Anyone | ✅ Allowed |
| Anyone | Normal | ✅ Allowed (existing daily-limit rules still apply) |

**Replying is not blocked.** A normal member can still **accept or decline** an interest a VVIP sent them, and can chat once connected. Only *opening* the conversation is restricted. Do not gate the Accept/Decline buttons on VVIP status.

**The rejection** — `POST /interests/send` returns `403`:

```jsonc
{
  "code": "VVIP_INTEREST_RESTRICTED",
  "message": "This is a VVIP member. Only VVIP members can send them an interest — upgrade to VVIP to connect."
}
```

Handle it exactly like the existing `INTEREST_LIMIT_REACHED`: **open the upgrade modal** with the server's `message`, not a generic error toast. On web this is one shared list in the API interceptor:

```ts
const UPGRADE_MODAL_CODES = ["INTEREST_LIMIT_REACHED", "VVIP_INTEREST_RESTRICTED"];
// if (error.response.data.code is in the list) → open upgrade modal with .message
```

Build the mobile equivalent in your central error handler so any call site gets it for free.

**Optional UX polish (recommended):** you already know the target's `isVvip` and your own `capabilities.isVvip` before the tap. Pre-empt the round trip — on a VVIP card, when the viewer isn't VVIP, show an "Upgrade to VVIP to connect" affordance instead of the send-interest heart. Treat this as a hint only; still handle the `403`, since the target's plan can expire between fetch and tap.

### 3.3 Badge precedence

**VVIP supersedes the Premium crown.** A VVIP is always a paying subscriber, so both would be true at once and would collide in the same corner of the card.

```
if (isVvip)        → VVIP gem badge
else if (isPremium) → Premium crown badge
```

The **verified blue tick is independent** — a VVIP can also be verified. Keep rendering `isVerified` next to the name exactly as before.

**Deleted / tombstoned profiles never get the gold treatment**, even if the flag is somehow present. Web guards with `const vvip = !!isVvip && !isDeleted;`.

---

## 4. Styling

Brand gold is **`#E9C349`** — it's already the theme's `secondary` colour. The VVIP treatment is built on it deliberately, so the tier reads as *this brand's* premium, not a second unrelated gold. **Do not introduce a new gold.**

### 4.1 Design tokens

| Token | Value |
|---|---|
| Brand gold | `#E9C349` |
| Gold dark (badge gradient ends) | `#8a6d1f` |
| Card background gradient | vertical, `#fdf7e6` → `#f5e6b8` |
| Card border / ring | `1px` `#E9C349` |
| Sheen highlight | `rgba(255,255,255,0.55)` |
| Glow (rest) | `0 0 0 1px rgba(233,195,73,0.5)`, `0 4px 16px -6px rgba(233,195,73,0.45)` |
| Glow (peak) | `0 0 0 1px rgba(233,195,73,0.85)`, `0 10px 30px -6px rgba(233,195,73,0.7)` |

### 4.2 The profile card (the main one)

Three layers on top of the normal card:

1. **Body** — vertical gradient `#fdf7e6` → `#f5e6b8`, plus a `1px` `#E9C349` ring.
   Warm cream-gold, **not** saturated gold. A fully saturated gold body destroys text contrast; this keeps the existing dark text legible while reading unmistakably gold.
2. **Glow** — the box-shadow pulsing between the two values above. `3.5s`, `ease-in-out`, infinite, alternating.
3. **Sheen** — a white highlight band sweeping diagonally across the whole card:
   - Band is **⅓ of card width**, full height, horizontal gradient `transparent → rgba(255,255,255,0.55) → transparent`, skewed `-16°`.
   - Travels `translateX(-150%)` → `translateX(350%)`.
   - **`6s` total, but the travel completes in the first 30%** (keyframes at `0%`, then `30%` and `100%` both at the end position). That's ~1.8s of motion then a ~4.2s rest.

> ⚠️ **The long pause is the whole point.** A grid can show many VVIP cards at once. Without the rest phase they all strobe continuously and the screen becomes unusable. Keep the duty cycle low.

**Layering rules:**
- The sheen sits **above** the card surface but **below** every control. On web: sheen `z-10`, badges/bookmark `z-20`.
- The sheen **must not intercept touches** (`pointer-events: none` on web / don't let it swallow gestures on mobile). It's decoration — the card underneath stays fully pressable.
- Clip the sheen to the card bounds (`overflow: hidden`), or it bleeds across neighbours.

### 4.3 The VVIP badge

Top-left of the photo (same slot the Premium crown uses).

- Pill, horizontal gradient `#8a6d1f → #E9C349 → #8a6d1f` (dark-gold ends give the metallic read; a flat gold looks cheap).
- Gem icon (web: `BsGem`, ~9px) + text **"VVIP"**.
- White text, extra-bold, uppercase, wide letter-spacing, ~10px.
- Subtle white ring (`rgba(255,255,255,0.4)`) + shadow.
- Accessibility label: `"VVIP Member"`.

### 4.4 Where else the gold goes

| Surface | Treatment |
|---|---|
| **Discover / match cards** | Full treatment — body + glow + sheen + badge (§4.2, §4.3) |
| **Profile detail header** | VVIP pill next to the name, replacing the Premium crown. Verified tick stays. |
| **Pricing screen — VVIP plan card** | Same gold body + `2px` `#E9C349` border + sheen. So the tier is recognisable *before* purchase, not just after. |
| **Pricing screen — VVIP tab** | Gold pill tab (§4.5) sitting alongside the duration tabs |
| **My Profile — Membership card** | A **"VVIP Status"** capability chip, listed first, when `capabilities.isVvip`. Same omit-when-false rule as every other chip. |

### 4.5 The pricing screen — VVIP gets its own tab

**The API contract is unchanged** (`/plans?duration=` still returns VVIP alongside everything else — §2.3). What follows is a **presentation decision the web panel made**, and mobile should mirror it.

VVIP is a **tier**, not a duration. Dropped into the duration grids it became a 5th card that stranded itself alone on a second row. Instead:

- **Duration tabs (`3 months` / `6 months` / `Unlimited`) exclude VVIP** — filter `!plan.isVvip`. The remaining 4 plans fill the grid cleanly.
- **A 4th `VVIP` tab** sits beside them, rendered as the gold pill: same `#8a6d1f → #E9C349 → #8a6d1f` gradient, gem icon, uppercase wide-tracked "VVIP", plus the §4.2 sheen. It shines whether or not it's selected — it's an advertisement, not just a control.
- **The VVIP tab shows one card per billing cycle** VVIP is sold in (currently quarterly + half-yearly), filtered to `plan.isVvip`. Since the API is keyed by duration, that means one request per duration, merged.

> ⚠️ **Two traps this creates — both bit the web build:**
> 1. **The tab key is not a duration.** Anything that reads "the selected tab" as a billing cycle (the purchase call, the current-plan check) breaks on the VVIP tab. Read the duration from **`plan.pricing.duration`** instead — never from the tab.
> 2. **The same plan appears twice.** Both VVIP cards share one `plan._id`. Any per-card state keyed on the id alone (loading spinner, disabled state, list keys) will fire on **both** cards at once. Key on **plan id + duration**.

### 4.6 Accessibility — not optional

- **Respect reduced motion.** Both animations are gated behind `motion-safe:` on web (`prefers-reduced-motion`). On mobile, honour the OS setting (iOS *Reduce Motion* / Android *Remove animations*). **When reduced motion is on, drop the sheen and the glow pulse and keep the static gold body + border + badge** — the tier must still be visually distinct without any movement.
- Gold is a **redundant** cue, never the only one. The badge carries the meaning; colour reinforces it. Don't rely on gold alone to communicate VVIP.
- Keep text on the gold body dark. Don't invert to white/gold text — contrast fails.

---

## 5. Checklist

- [ ] Read VVIP from `capabilities.isVvip`, **never** `planType === "vvip"`
- [ ] Treat `profile.isVvip` as `!!profile.isVvip` (may be absent)
- [ ] Render VVIP gold for **all** viewers, including unsubscribed
- [ ] **Do not re-order the discover response** — the mix lives in the array order
- [ ] Keep discover `limit: 10` (below 10 silently kills VVIP placement)
- [ ] Route `VVIP_INTEREST_RESTRICTED` to the upgrade modal, not a toast
- [ ] Do **not** gate Accept/Decline — only *sending* is restricted
- [ ] VVIP badge replaces Premium; verified tick unaffected
- [ ] No gold on deleted/tombstoned profiles
- [ ] Sheen is decoration: clipped, non-interactive, low duty cycle
- [ ] Reduced motion → static gold, no sheen/glow
- [ ] Never hardcode the VVIP price — read `pricing.discountedPrice`
- [ ] Pricing: filter VVIP **out** of the duration tabs, **into** its own gold tab
- [ ] Read billing cycle from `plan.pricing.duration`, **never** from the selected tab
- [ ] Key per-card state on **plan id + duration** (VVIP renders one plan twice)

---

## 6. Web reference

| Thing | File |
|---|---|
| Card treatment + badge precedence | `frontend/app/components/cards/MatchCard.tsx` |
| VVIP badge | `frontend/app/components/shared/VvipBadge.tsx` |
| Animation keyframes + tokens | `frontend/tailwind.config.js` (`vvip-sheen`, `vvip-glow`) |
| Upgrade-modal error codes | `frontend/app/api/api.ts` (`UPGRADE_MODAL_CODES`) |
| Pricing card gold | `frontend/app/components/cards/PriceCard.tsx` |
| Membership chip | `frontend/app/components/my-profile/MembershipCard.tsx` |
| Detail header pill | `frontend/app/components/match-details/MatchProfileSection.tsx` |
| Feed mixing + interest gate (backend) | `profile.service.ts` (`getDiscovery`), `interests.service.ts` (`sendInterest`) |
