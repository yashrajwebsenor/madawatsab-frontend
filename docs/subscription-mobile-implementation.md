# Subscription Module — Mobile App Implementation Guide

This document describes the subscription behaviour and UI/UX changes we shipped on the **web panel** so they can be replicated **identically in the mobile app**. The web panel and the mobile app are functionally identical, so every gating rule, every locked-state screen, and every data field below applies to mobile too.

It is derived from two commits:
- `2bfe5c7` — *added subscription module in backend and admin panel* (backend gating + data model + initial frontend wiring)
- `66d4079` — *web panel improvements for subscription* (the full frontend behaviour + UI/UX polish)

> **Golden rule:** the backend is the source of truth. All gating flags described here are **UX hints only** — the server already returns `403` / basic-only payloads / blurred data on its own. The mobile app must render the right states from the data the API returns; it must not invent its own access logic, and it must never assume a flag grants real access.

---

## 1. Core Concept — Two independent things

There are **two separate** subscriber assets. Do not conflate them.

### 1.1 Active subscription (capabilities) — expires
An active plan unlocks **capabilities**: messaging, advanced filters, full profile view, photo un-blur, etc. These die the moment the plan expires.

### 1.2 Contact-view wallet — persistent, never expires
Buying a plan tops up a **per-user wallet** (`contactViewBalance`). Each contact reveal spends **1 view**. Leftover views **survive plan expiry** — a user with no active plan can still spend remaining views to unlock contacts down to 0.

So a user can be in any of these states:
| State | Active plan? | Wallet > 0? | Can message / advanced filters / full profile? | Can reveal contact? |
|------|------|------|------|------|
| Unsubscribed (entry fee only) | ✗ | ✗ | ✗ | ✗ |
| Active plan | ✓ | maybe | ✓ (per plan capabilities) | only if wallet > 0 |
| Expired plan with leftover views | ✗ | ✓ | ✗ | ✓ (until wallet hits 0) |

---

## 2. Data Contract (what the API returns)

### 2.1 Own profile — `GET /profile`
The own-profile response now includes a `subscription` summary object. **This is the single source for all gating in the app.** Read it once (into your store) and derive everything from it.

```jsonc
{
  // ...all normal own-profile fields...
  "contactViewBalance": 12,      // wallet on the user object
  "contactViewLifetime": 30,     // total ever purchased (analytics/hint)
  "subscription": {
    "hasActivePlan": true,
    "planName": "Gold",          // "Till You Marry" for unlimited, "No Plan" when none
    "planType": "gold",          // basic | silver | gold | assisted | unlimited | null
    "planDuration": "quarterly", // quarterly | half_yearly | unlimited | null
    "expiryDate": "2026-09-04T...", // null when unlimited OR no plan
    "capabilities": {
      "canMessage": true,
      "hasAdvancedFilters": true,
      "canBlock": true,
      "hasProfileBoost": true,
      "hasRelationshipManager": false
    },
    "contactViewBalance": 12,
    "contactViewLifetime": 30,
    "viewCountRemaining": 12
  }
}
```

When there is no active plan, `hasActivePlan: false`, `planName: "No Plan"`, all capabilities `false`, but `contactViewBalance` may still be > 0.

### 2.2 Another user's profile — `GET /profile/:id`
The backend **shapes the payload by viewer subscription**:
- **Subscribed viewer** → full profile **plus** `shouldBlur` (true only when the target is private).
- **Unsubscribed viewer** → **basic-only payload**: `_id, userId, fullName, gender, age, dob, address, photos, isPrivate, shouldBlur`. Profession, education, income, family, etc. are simply **absent** from the response.

So if the user is unsubscribed, the mobile detail screen **will not have** the detailed fields — you must render locked states, not "Not Specified" for missing data.

`shouldBlur` is computed server-side as: `shouldBlur = !(viewerHasActiveSub && target.isPrivate === false)`.
- Private target → blurred for everyone.
- Public target → blurred only if viewer has no active plan.
- Own profile → never blurred.

Each profile/match object now carries an optional `shouldBlur?: boolean`. **Render blur from `shouldBlur`, falling back to `isPrivate` when the flag is absent** (older responses): `blurred = shouldBlur ?? isPrivate`.

### 2.3 Discovery / list — `GET /profile/discover`
Same serialization. Unsubscribed viewers get **only name, age, location, photo (blurred), isPrivate, shouldBlur** per card.

### 2.4 Chat rooms — `GET /chats/rooms`
Each room's `participants[]` now carries `shouldBlur` per participant (computed from the viewer's subscription vs that participant's privacy; self is always `false`). Use it to blur chat avatars.

### 2.5 Contact reveal endpoints (NEW)
- `GET /contact-status/:id` → `{ unlocked: boolean, contact: { mobile, email } | null }`. **No view spent.** Call on detail-screen load to show a contact that was already unlocked previously.
- `GET /view-contact/:id` → spends **1 wallet view** (unless already unlocked / own profile), returns `{ unlocked, contact, message }`. `message === "Previously unlocked"` means **no view was spent** (don't refresh wallet). Throws `403` "You have no contact views left..." when wallet is empty.

### 2.6 Plan purchase — `POST /payments/create`
Send only ids; **the amount is derived server-side** (never trust a client amount):
```jsonc
{ "paymentType": "plan", "planId": "<id>", "planDuration": "quarterly" }
```
Then run the Razorpay (or platform equivalent) flow and call `POST /payments/verify` with the gateway response. Backend **rejects re-purchase while a plan is already active** — guard the UI too and show a toast.

### 2.7 Plans list — `GET /plans?duration=quarterly`
Returns plans for that duration, each with `capabilities` flags + `pricing` (with `contactViewLimit`) + marketing `features`. Durations: `quarterly` (3 mo), `half_yearly` (6 mo), `unlimited`.

---

## 3. The central access helper

On web we built one hook (`useSubscriptionAccess`) that reads the stored subscription summary and exposes derived booleans. **Build the mobile equivalent** (a hook / provider / view-model) so every screen reads the same logic and labels stay consistent.

Derived values (mirror exactly):
```
hasActivePlan          = subscription.hasActivePlan
canViewFullProfile     = hasActivePlan
canUseAdvancedFilters  = hasActivePlan && capabilities.hasAdvancedFilters
canSendMessages        = hasActivePlan && capabilities.canMessage
hasContactCredits      = contactViewBalance > 0
contactViewBalance     = subscription.contactViewBalance ?? 0
contactViewLifetime    = subscription.contactViewLifetime ?? 0
capabilities           = subscription.capabilities

// photo lock reason helpers (take a profile with shouldBlur/isPrivate)
isSubscriptionPhotoLocked(p) = !!p.shouldBlur && !p.isPrivate   // blurred ONLY due to no plan
isPrivatePhotoLocked(p)      = !!p.isPrivate                    // blurred because target is private
```

> Treat these as hints. Still handle backend `403`s gracefully.

---

## 4. Reusable "Locked" component

We made a single reusable **LockedContent** panel and use it everywhere a feature is gated, so locked states look consistent. Build the mobile equivalent.

Props: `title` (required), `reason?`, `ctaLabel?` (default "View Plans"), `onCta?` (default → navigate to Pricing), optional `secondaryLabel` + `onSecondary`, `icon?` (default lock icon).

Visual: dashed-border card, lock icon in a tinted circle, title, reason text, primary CTA button → Pricing screen.

Use it for: locked profile details, locked family tab, locked photo gallery, locked match insights, advanced-filters upsell, contact reveal (no credits).

---

## 5. Screen-by-Screen behaviour

### 5.1 Discovery / Match cards (`MatchCard`)
- **Blur the photo** when `blurred = shouldBlur ?? isPrivate`. Disable zoom when blurred.
- Show a **Private** badge when `isPrivate`.
- ⚠️ **Web gap to also fix on mobile (do it properly here):** when a photo is blurred **only** because the viewer has no plan (`shouldBlur && !isPrivate`), overlay a small **"Subscribe to view photo"** lock chip (distinct from the Private badge). Web currently only shows the Private badge; mobile should show both reasons distinctly.
- Cards render only the fields present in the payload. For unsubscribed viewers only name/age/location/photo exist — render conditionally (e.g. `{[occupation, age].filter(Boolean).join(", ")}`, show sect / qualification chips only when present). **Never** print "Not Specified" / empty chips for missing fields.
- Sending an **interest is ungated** (any user, unlimited). Keep the send/accept/decline actions as-is.

### 5.2 Match detail screen
Decide `locked = !canViewFullProfile` once and pass down.

**Profile header section (`MatchProfileSection`):**
- Blur main photo when `shouldBlur ?? isPrivate`.
- Overlay: if `isPrivate` → Private badge; else if `subscriptionLocked` (`shouldBlur && !isPrivate`) → **"Subscribe to view photo"** lock overlay.
- Render each field (profession, sect, qualification, occupation, language) **only when present**. No hardcoded placeholder data.
- **Send Interest** button (ungated) with states: Send Interest / Interest Sent / Interested in You.
- **Contact reveal block** (bottom):
  - On mount, call `contact-status/:id`; if already unlocked, show the contact (no spend).
  - If `hasContactCredits` → "Reveal Contact" button + "Uses 1 contact view • N remaining". Tapping shows a **confirm dialog** ("This uses 1 contact view. You have N remaining."), then calls `view-contact/:id`. On success refresh own profile (to update wallet) **unless** `message === "Previously unlocked"`.
  - If no credits → "Buy a plan to get contact views" button → Pricing, plus "You have 0 contact views remaining".
  - On `403`, show an error toast.

**Match insights / compatibility (`MatchCapability`):**
- When `locked` → replace with LockedContent ("Match insights are a premium feature" / "Subscribe to unlock compatibility insights for this member.").
- ⚠️ **Known web debt to avoid on mobile:** for *subscribed* users the web still shows a hardcoded "95% compatibility" dummy. On mobile, either wire real compatibility data or omit the section — **do not ship fake numbers.**

**Extra details tabs (`MatchExtraDetails`) — About / Family / Photo Gallery:**
- `galleryLocked = locked || (shouldBlur ?? isPrivate)`.
- **About Profile tab:** if `locked` → LockedContent ("Subscribe to view full profile details"). Otherwise render fields; show "Not Specified" only for genuinely-empty fields of an *unlocked* profile.
- **Family Background tab:** if `locked` → LockedContent ("Family details are locked") with a lock icon on the tab title. (Backend only returns `family` to subscribed viewers.)
- **Photo Gallery tab:** if `galleryLocked` → LockedContent with copy that differs by reason: private target → "Private photo gallery" / "This member keeps their gallery private."; subscription lock → "Photo gallery is locked" / "Subscribe to a plan to view the full photo gallery." Show a lock icon on the tab title.

### 5.3 Filters / Search (`FilterSection`)
Split filters into **basic** (always allowed) and **advanced** (need `canUseAdvancedFilters`).

- **Basic (always on):** age range, height range, country, state, sect, marital status, caste.
- **Advanced (gated):** userId, location (city), qualification, work sector, annual income, language.

Behaviour:
- When `!canUseAdvancedFilters`: **disable** all advanced inputs, show a lock icon next to "Advanced Filters", and show an upsell box ("Advanced filters need an active plan." + Upgrade button → Pricing).
- On **Apply**, **strip the advanced keys entirely** from the query when the user lacks access (backend ignores them anyway). Advanced key list: `userId, location, qualification, language, annualIncome, workSector`.
- Caste maps to the `caste` query param (not maslak).

### 5.4 Chat
- **Reading/receiving is open to everyone.** Unsubscribed users can open rooms, see history, and receive new messages in real time.
- **Sending requires `canSendMessages`** (active plan + `canMessage`). When false, **replace the entire composer** (input + attachment + emoji + send) with a single locked bar: lock icon + "Chat is locked — subscribe to unlock chat", tapping → Pricing screen.
- **Blur chat avatars** using each participant's `shouldBlur` (fallback `isPrivate`) in the chat header and chat-list rows.

### 5.5 My Profile — Membership card (`MembershipCard`)
Add a Membership card to the profile screen showing:
- Plan name + Active/Inactive chip.
- Expiry: "Lifetime • Never expires" for unlimited; otherwise "Expires <date>"; hidden when no plan.
- **Contact Views Remaining** (big number = `contactViewBalance`).
- **Capability chips** — only the capabilities the active plan **includes** (Messaging, Advanced Filters, Profile Boost, Relationship Manager, Block Users). Do **not** show disabled/crossed-out capabilities — omit them.
- CTA → Pricing ("View Plans" if active, "Subscribe Now" if not).
- If no active plan but wallet > 0, a hint: "You still have N contact view(s) from a past plan."

### 5.6 Pricing screen
- **Membership summary band** at top: current plan name (use the `planName`, fall back to a label map by `planType`), expiry term (Lifetime for unlimited), and **Contact Views Remaining**. If no plan but wallet > 0, show the leftover-views hint.
- **Duration tabs:** 3 months / 6 months / Unlimited → refetch `/plans?duration=`.
- **Plan cards (`PriceCard`):** show **only enabled** capabilities (no strikethrough for missing ones). Hide the contact-views line when the plan grants 0 views. Mark the user's current plan; **disable purchase when `hasActivePlan`** (button: Current Plan / Plan Already Running / Activate).
- **On mount**, refetch own profile so a lazily-expired plan reflects correctly (the persisted store can still claim an active plan after server-side expiry).
- **Activate flow:** guard re-purchase (toast if already active) → `POST /payments/create` with `{ paymentType:'plan', planId, planDuration }` → run payment → `POST /payments/verify` → on success refresh own profile (updates plan + wallet).
- Plan label map for unlimited = **"Till You Marry"**.

---

## 6. Plan catalog (reference)

Five plan types: `basic, silver, gold, assisted, unlimited`. Capabilities per plan are admin-editable and snapshotted at purchase. Photo un-blur of public profiles is a **global rule for any active plan** (not a per-plan flag). The mobile app should never hardcode plan capabilities — always read `capabilities` from the API.

---

## 7. Refresh discipline

Refresh the own-profile/subscription state (and thus the wallet + capability flags) after any subscription-affecting action:
- After successful plan purchase/verify.
- After a contact reveal that spent a view (skip when "Previously unlocked").
- On Pricing screen mount (catch lazy expiry).

---

## 8. Edge cases / gotchas

- **Don't expose the far-future date.** Unlimited plans use a `2099-12-31` sentinel internally; the API returns `expiryDate: null` for them — render "Lifetime", never a date.
- **Basic plan grants 0 contact views** — that's intentional. Hide "0 contact views" UI rather than showing a zero.
- **Wallet survives expiry** — never gate contact reveal behind `hasActivePlan`; gate it behind `contactViewBalance > 0`.
- **Interests are never gated.**
- **Always handle `403`** from `view-contact` and chat-send as the real boundary; the client flags are only to keep the UI honest.

---

## 9. Build checklist (mobile)

- [ ] Add `subscription` summary + `contactViewBalance` / `contactViewLifetime` to the user model/store from `GET /profile`.
- [ ] Add `shouldBlur` to profile/match/chat-participant models.
- [ ] Central access helper (section 3).
- [ ] Reusable LockedContent component (section 4).
- [ ] Match card: blur + Private badge + subscription-lock chip + conditional fields.
- [ ] Match detail: locked profile/family/gallery, photo overlays, send-interest, contact reveal (status + view-contact + confirm + wallet refresh).
- [ ] Match insights: locked for unsubscribed; real data or removed for subscribed (no dummy 95%).
- [ ] Filters: basic vs advanced split, disable + upsell, strip advanced keys on apply.
- [ ] Chat: composer replaced by locked bar when `!canSendMessages`; avatar blur via `shouldBlur`.
- [ ] My Profile: Membership card.
- [ ] Pricing: summary band, duration tabs, enabled-only capability rendering, re-purchase guard, create→verify→refresh, "Till You Marry" label.
- [ ] Wire contact-reveal endpoints + payment endpoints (ids only; amount server-side).
- [ ] Refresh discipline (section 7).
