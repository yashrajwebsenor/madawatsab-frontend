# Profile Photo & Gallery Photos — Mobile Implementation Guide

Audience: mobile app developer. This documents the **photo architecture change** (single profile photo vs. reviewed gallery photos) and every API request/response the app must adapt to.

---

## 1. What changed (concept)

Previously every user image was one bucket (`photos[]`) and the app used `photos[0]` as the avatar. That is **no longer correct.**

There are now **two distinct kinds of photo**:

| Kind | Type (`type` field) | Count | Reviewed? | Who sees it |
|------|--------------------|-------|-----------|-------------|
| **Profile photo** (avatar) | `profile_picture` | exactly **1** | **No** — visible immediately | everyone |
| **Other / gallery photos** | `profile_photo` | up to **5** | **Yes** — admin must approve | everyone, always — pending ones carry a badge |

Key rules:

1. **Avatar = `profilePhoto`**, NOT `photos[0]`. Use `profilePhoto.url` everywhere you show the user's picture (lists, chat, headers, etc.).
2. **Profile photo is single + replace-on-upload.** Uploading a new one replaces the old. Not reviewed — shows instantly.
3. **Gallery photos are moderated but always visible.** A newly uploaded gallery photo is `status: "pending"`. It is shown normally to **every viewer** (owner and other users alike) with a "Pending review" badge overlaid, until an admin approves it (`status: "approved"`) and the badge disappears. Rejected photos are **deleted** (they just disappear).
4. **Every viewer gets the `status` field** — the API does not filter gallery photos by review status for anyone. The frontend is what decides whether to render the badge (render it whenever `status === "pending"`, regardless of whose profile is being viewed).

---

## 2. Data shapes

### `Photo` (gallery item)
```jsonc
{
  "_id": "665f...",
  "url": "https://res.cloudinary.com/.../abc.jpg",
  "status": "pending" | "approved"   // present on gallery photos
}
```

### `ProfilePhoto`
```jsonc
{
  "_id": "665f...",
  "url": "https://res.cloudinary.com/.../avatar.jpg"
}
```

### User object (relevant fields)
```jsonc
{
  "_id": "...",
  "fullName": "Test User",
  "profilePhoto": { "_id": "...", "url": "..." } | null,
  "photos": [ { "_id": "...", "url": "...", "status": "approved" }, ... ],
  // ...all other profile fields unchanged
}
```

> `status` is present on gallery photos everywhere — your own profile and every other user's profile alike. Always check it and render the "Pending review" badge when `status === "pending"`, no matter whose profile you're rendering.

---

## 3. APIs

Base path: `/profile`. All require `Authorization: Bearer <jwt>`.

> **Response envelope:** every response is wrapped as `{ "status": 200, "message": "...", "data": <payload>, "pagination"?: {...} }`. Examples below show only the `data` payload.

### 3.1 Get own profile — `GET /profile`
Returns the full user. `photos` here includes **both pending and approved** (so the owner can see their pending uploads), each with a `status`. `profilePhoto` is the avatar (or `null` if not set yet).

```jsonc
{
  "data": {
    "_id": "...",
    "fullName": "Test User",
    "profilePhoto": { "_id": "p1", "url": "https://.../avatar.jpg" },
    "photos": [
      { "_id": "g1", "url": "https://.../1.jpg", "status": "approved" },
      { "_id": "g2", "url": "https://.../2.jpg", "status": "pending" }
    ],
    "isOnboardingCompleted": true,
    "subscription": { ... }
    // ...
  }
}
```
UI: render `profilePhoto` as the avatar; render `photos` as a gallery, overlaying a **"Pending review"** badge on any item where `status === "pending"`.

### 3.2 Get another user's profile — `GET /profile/:id`
`profilePhoto` present; `photos` includes **both pending and approved**, each with its `status` — render the pending badge here too. Same blur/subscription gating as before applies to the rest of the payload.

### 3.3 Discovery list — `GET /profile/discover?page=&limit=`
Each profile card carries `profilePhoto` + `photos` (pending and approved). **Use `profilePhoto.url` for the card image** (not `photos[0]`).

### 3.4 Upload / replace profile photo — `POST /profile/upload-profile-photo`
- `Content-Type: multipart/form-data`
- Field: **`photo`** (single file)
- Replaces the existing profile photo (old one is deleted). Result is **immediately visible** (no review).

Response = the created attachment:
```jsonc
{
  "data": {
    "_id": "p1",
    "url": "https://.../avatar.jpg",
    "type": "profile_picture",
    "status": "approved"
  }
}
```
After success, refetch `GET /profile` (or use the returned object) to update the avatar.

### 3.5 Add ONE gallery photo — `POST /profile/upload-photo`
- `Content-Type: multipart/form-data`
- Field: **`photo`** (single file)
- Created as **`status: "pending"`** → goes to admin review.

```jsonc
{ "data": { "_id": "g3", "url": "https://.../3.jpg", "type": "profile_photo", "status": "pending" } }
```

### 3.6 Add MULTIPLE gallery photos — `POST /profile/upload-multiple-photos`
- `Content-Type: multipart/form-data`
- Field: **`photos`** (repeat the key per file; **max 5**)
- All created as **`status: "pending"`**.

```jsonc
{ "data": [ { "_id": "g4", "url": "...", "type": "profile_photo", "status": "pending" }, ... ] }
```

### 3.7 Delete a photo — `DELETE /profile/delete-photo/:id`
Works for either kind (pass the photo's `_id`). Removes it from Cloudinary + DB.

> There is **no** separate "delete profile photo" endpoint — to change the avatar just upload a new one (3.4), which replaces it. To remove a gallery photo use this with the gallery item's `_id`.

---

## 4. Screens to update

### Onboarding — photos step
- Two sections: **Profile Photo** (single, required) and **Other Photos** (optional gallery).
- Profile photo → `POST /profile/upload-profile-photo`.
- Other photos → `POST /profile/upload-multiple-photos` (or repeated `upload-photo`).
- **A profile photo is required to finish onboarding.** Block "continue" until `profilePhoto` exists. (Backend onboarding-complete signal keys off having a profile photo.)
- Show a note: other photos are reviewed before others can see them.

### Edit profile — photos
- Profile photo block: show current `profilePhoto`, "Change photo" replaces it.
- Other photos block: grid of `photos`; "Pending review" badge on pending items; allow delete; cap at 5.

### Everywhere an avatar is shown (discovery cards, match/chat headers, profile header, menus)
- Switch the image source from `photos?.[0]?.url` → **`profilePhoto?.url`** (with your existing placeholder fallback).

### Viewing another user
- Gallery = the `photos` array as-is, pending items included. Overlay the same "Pending review" badge used on your own profile whenever `status === "pending"` — the photo itself still renders normally.

---

## 5. Edge cases / notes

- `profilePhoto` can be `null` (user hasn't set one) — keep a placeholder/initials fallback.
- Pending photos are visible to every viewer, on every profile — never hide a pending photo, only badge it.
- Gallery cap is 5 (enforce in UI; backend won't add a 6th meaningfully).
- Field names matter: profile photo + single gallery use form key **`photo`**; multiple gallery uses **`photos`**.

---

## 6. Migration (FYI, server-side only)

On rollout the backend runs a one-time migration: each existing user's earliest photo becomes their `profile_picture` (approved), and their remaining existing gallery photos are set to **`pending`** (so they must be re-approved by an admin). No mobile action needed, but be aware existing users may temporarily show fewer approved gallery photos until an admin reviews them.
