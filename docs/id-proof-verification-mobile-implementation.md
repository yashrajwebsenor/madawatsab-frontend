# ID Proof (Aadhaar) Verification — Mobile Implementation Guide

Audience: mobile app developer. This documents the **identity-verification feature** so the mobile app matches the web app's behaviour exactly. It covers the concept, the reminder modal, the upload screen, and every API request/response involved.

---

## 1. What this feature is (concept)

A user can upload **one** photo of their Aadhaar / government ID as **verification evidence**. An admin reviews that photo in the admin panel and grants a **verified badge** (`isVerified`) to the profile.

Important framing:

- The ID proof is **evidence only**. It does **not** unlock anything, change visibility, or auto-verify the user. Verification stays a **manual admin action**.
- Uploading is **optional** and **one-time**: once a user submits an ID proof, they **cannot replace or delete it themselves**. Only an **admin** can remove it — after removal the user may upload again.
- The admin can verify a user **with or without** an uploaded ID proof.

User journey:

1. User finishes onboarding, clears the entry-fee / spin gates, and **buys a subscription plan**.
2. Only then does a polished **reminder modal** ("Get your profile verified") appear, inviting them to upload an ID. Free / un-subscribed users never see it — see §4.1.
3. **Maybe later** → modal closes and **re-appears every 10 minutes**, indefinitely, until they submit.
4. **Verify now** → navigate to the **upload screen** → pick one photo from the gallery → submit.
5. After submit, the upload screen shows a locked **"You submitted your ID proof"** state, and the reminder modal never shows again.
6. If an admin later **removes** the submission, the user's `idProof` becomes `null` again → the modal resumes and the user can re-upload.

---

## 2. Source of truth: `user.idProof`

Everything keys off a single field on the **own-profile** object returned by `GET /api/profile`:

```jsonc
// user.idProof
{ "_id": "665f...", "url": "https://res.cloudinary.com/.../id.jpg", "status": "approved" }
// OR
null   // nothing submitted (or admin removed it)
```

- `idProof === null` (or missing) → **not submitted** → show the reminder modal (subject to the 10-min timer) and the upload UI on the verify screen.
- `idProof` is an object → **submitted** → never show the modal; the verify screen shows the locked "submitted" state.

> `idProof` is only present on the user's **own** profile response. It is never returned on another user's profile. `status` will be `"approved"` (ID proofs are not part of the gallery review flow — ignore `status` on the client, just treat non-null as "submitted").

Refresh `user.idProof` by re-fetching `GET /api/profile` after a successful upload.

---

## 3. API reference

Base URL: all endpoints are under the global prefix **`/api`**.
Auth: every request needs the bearer token — `Authorization: Bearer <jwt>`.

### Standard response envelope

**Success** (any 2xx) is wrapped by a global interceptor:

```jsonc
{
  "status": 200,
  "message": "Request successful",
  "data": { /* the actual payload */ }
  // list endpoints also add siblings like "pagination"
}
```

Always read the payload from **`data`**.

**Error** (any 4xx/5xx) has a different shape (global exception filter):

```jsonc
{
  "success": false,
  "statusCode": 409,
  "code": "OPTIONAL_MACHINE_CODE",   // only on some errors; absent here
  "message": "ID proof already submitted",
  "timestamp": "2026-07-18T10:00:00.000Z",
  "path": "/api/profile/upload-id-proof"
}
```

Read the user-facing error text from **`message`**.

---

### 3.1 Upload ID proof

```
POST /api/profile/upload-id-proof
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
```

Body — a single form field named **`photo`** (the image file). Nothing else.

| Field | Type | Notes |
|-------|------|-------|
| `photo` | file (image/jpeg, image/png) | The Aadhaar / ID photo. One file. |

**Success `201`** — `data` is the created attachment:

```jsonc
{
  "status": 201,
  "message": "Request successful",
  "data": {
    "_id": "665f0a1b2c3d4e5f60718293",
    "userId": "664e...",
    "url": "https://res.cloudinary.com/.../id.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../id_thumb.jpg",
    "fileName": "id.jpg",
    "mimeType": "image/jpeg",
    "publicId": "madawatsab/id_xxx",
    "type": "id_proof",
    "status": "approved",
    "createdAt": "2026-07-18T10:00:00.000Z",
    "updatedAt": "2026-07-18T10:00:00.000Z"
  }
}
```

**Error `409` — already submitted** (the user already has an ID proof; blocked from re-uploading):

```jsonc
{
  "success": false,
  "statusCode": 409,
  "message": "ID proof already submitted",
  "timestamp": "...",
  "path": "/api/profile/upload-id-proof"
}
```

**Error `400`** — `"Photo is required"` if no file was attached.
**Error `401`** — missing/expired token.

> After a `201`, call `GET /api/profile` again and update your local user so `idProof` is populated. Do not rely on the upload response alone for the "submitted" UI — treat `GET /api/profile`'s `idProof` as truth.

---

### 3.2 Read submission state

```
GET /api/profile
Authorization: Bearer <jwt>
```

Returns the full own-profile object. The only field this feature needs:

```jsonc
{
  "status": 200,
  "message": "Request successful",
  "data": {
    "_id": "...",
    "fullName": "...",
    "isVerified": false,          // admin-granted verified badge (separate)
    "idProof": null,              // <-- null = not submitted; object = submitted
    // ...all other profile fields
  }
}
```

There is **no** dedicated "get my id proof" or "delete my id proof" endpoint for the user. Removal is **admin-only** and happens in the admin panel; the mobile app never deletes an ID proof.

---

## 4. The reminder modal (behaviour to match)

Show a modal that nudges the user to verify. Match these rules exactly:

**When to show** — all four must hold:

1. The user is fully inside the app (onboarding complete, past any entry-fee / spin gates — i.e. the same place your main app screens live).
2. **The user has an active subscription** — `user.subscription.hasActivePlan === true`. See §4.1.
3. `user.idProof` is `null`/missing.
4. Not currently on the upload screen itself.

If any fails, render nothing at all (don't mount a hidden modal, don't start the timer).

**10-minute re-prompt cadence**

- Persist a timestamp locally, e.g. `AsyncStorage` key `idProofPromptDismissedAt` (epoch millis). (Web uses `localStorage` with the same key/semantics.)
- Show the modal when `Date.now() - dismissedAt >= 10 * 60 * 1000`.
- First time (no stored timestamp) → show immediately.
- On **Maybe later** → write `dismissedAt = Date.now()`, hide. It reappears after 10 minutes.
- On **Verify now** → also write `dismissedAt = Date.now()` (so it doesn't immediately pop again if they leave the upload screen without submitting), hide, then navigate to the upload screen.
- Re-evaluate periodically while the app is foregrounded (web checks every 60s). On mobile, check on app-foreground / screen-focus plus a light interval — good enough; exact timing isn't critical.
- Once `user.idProof` becomes non-null (submitted), stop showing it. No need to clear the timestamp.

> Design note: the web modal shows an animated generic "ID card" graphic — deliberately **not** the real Aadhaar logo/artwork. Keep the mobile version generic too. Copy used on web:
> - Title: **"Get your profile verified"**
> - Body: *"Upload your Aadhaar or any government ID and our team will add a trusted verified badge to your profile. It only takes a moment and builds trust with your matches."*
> - Reassurance chip: *"Your ID is private and only reviewed by our team."*
> - Buttons: **Verify now** (primary) / **Maybe later**

---

## 4.1 Payment gate (subscription required)

The nudge is only for **paying** members. Ordering the user experiences:

```
onboarding → spin wheel (if enabled) → entry fee (if enabled) → app
                                                                 │
                                                    buys a subscription plan
                                                                 │
                                                    ID-proof nudge starts appearing
```

**Entry fee / spin** are already handled by your existing gate redirect — those screens
replace the app shell, so a modal mounted inside the app shell can never fire before
the fee is paid. Nothing new to do there.

**Subscription** is the new condition. Read it from the same `GET /api/profile`
response the rest of this doc uses:

```jsonc
{
  "data": {
    "idProof": null,
    "subscription": {
      "hasActivePlan": false,      // <-- the gate
      "planName": "Free",
      "planType": null,
      "planDuration": null,
      "expiryDate": null,
      "capabilities": { /* canMessage, isVvip, ... */ },
      "contactViewBalance": 0
    }
  }
}
```

Rules:

- `hasActivePlan === false` (or `subscription` missing) → **never show the modal.** No timer,
  no first-time pop, nothing. A free user must never be nagged.
- `hasActivePlan === true` → behave exactly as §4 describes (10-min re-prompt cadence, etc.).
- The flag is server-computed (plan exists **and** not expired) — do not derive it yourself
  from `planType` or `expiryDate`.
- It flips live: right after a successful plan purchase you re-fetch `GET /api/profile`
  anyway, so the nudge starts on the next evaluation with no extra wiring. Same on expiry —
  it goes quiet by itself.
- If your app already has a subscription hook/selector (web has `useSubscriptionAccess`),
  reuse it instead of reading the raw field in the modal.

> The **upload screen** (`/verify-identity`) is deliberately **not** gated — only the nudge is.
> A user who reaches it another way can still submit. Match that; don't add a paywall there.

Web reference: `frontend/app/components/verify-identity/IdProofPromptModal.tsx`

```ts
const hasSubmitted   = !!user?.idProof;
const onUploadScreen = pathname === routes.verifyIdentity;
const hasActivePlan  = !!user?.subscription?.hasActivePlan;
const eligible = !!user && hasActivePlan && !hasSubmitted && !onUploadScreen;

if (!eligible) return null;
```

---

## 5. The upload screen (behaviour to match)

Two states, driven by `user.idProof`:

**A. Not submitted (`idProof == null`)**
- Short explainer: *"Pick one clear photo of your Aadhaar or any government ID. Only our review team can see it — it is never shown to other users."*
- A single-image picker (gallery). Show a preview of the chosen image with a remove/clear control.
- **Submit** button (disabled until a file is chosen). On press → `POST /api/profile/upload-id-proof` with the `photo` field → on success, re-fetch `GET /api/profile` → the screen flips to state B.
- A secondary **"I'll do this later"** action returning to home.

**B. Already submitted (`idProof` is an object)**
- Locked success state: a check icon + **"You submitted your ID proof"**.
- Message: *"Our team will review it and verify your profile. If you need to change it, please contact support to have it removed first."*
- Optionally show the submitted image (`user.idProof.url`) as a thumbnail.
- **No** replace/delete control — the user cannot change it. (Only an admin can remove it.)

---

## 6. Round-trip summary (what the admin does)

For context — the admin side is already built on web:

- Admin sees a queue of users who submitted an ID proof, and the photo inline on the user-detail screen.
- Admin can **Verify User** (grants `isVerified`) — with or without a photo.
- Admin can **Remove** the ID proof. After removal, the user's `GET /api/profile` returns `idProof: null` again → your modal resumes and the user can re-upload.

The mobile app only needs to: **show the modal**, **upload**, **reflect submitted/locked state**, and **react to `idProof` flipping back to `null`** (handled automatically since you read it from `GET /api/profile`).

---

## 7. Quick checklist

- [ ] Read `idProof` from `GET /api/profile`; treat non-null as "submitted".
- [ ] Reminder modal: gated on `subscription.hasActivePlan` **and** `!idProof`, 10-min `AsyncStorage` timer (`idProofPromptDismissedAt`), suppressed on upload screen, stops once submitted.
- [ ] Free / expired users see the modal **never** — verify by logging in without a plan.
- [ ] After buying a plan, re-fetch profile → nudge starts appearing.
- [ ] Upload screen itself is NOT paywalled — reachable and submittable regardless of plan.
- [ ] Upload screen: single gallery photo → `POST /api/profile/upload-id-proof` (multipart, field `photo`) → re-fetch profile.
- [ ] Handle `409 "ID proof already submitted"` gracefully (shouldn't happen if you gate on `idProof`, but treat it as "already submitted" and refresh).
- [ ] Submitted state is locked — no user-side replace/delete.
- [ ] Bearer token on every request; read payload from `data`, errors from `message`.
