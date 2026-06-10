# Religious & Lifestyle Profile Fields — Mobile App Implementation Guide

This document describes the new **Religious Practice** and **Lifestyle & Interests** profile fields we shipped on the **web panel** (My Profile → Edit Profile) so they can be replicated **identically in the mobile app**.

Scope of this change:
- **Backend**: new optional fields on the User model + the profile-update DTO.
- **Web**: two new editable sections on the My Profile page.
- **No onboarding, no discovery filters.** These fields are collected/edited **only** from the profile-edit screen. They are all **optional and nullable** — a user may fill none, some, or all of them.

> **Golden rule:** every field below is optional. Never block a screen, a save, or onboarding because one is empty. Render "not set" / hide the row when a value is missing.

---

## 1. Data Contract

### 1.1 Where the fields live
The new fields are stored **directly on the User document**. They come back on the own-profile response and are saved through the normal profile-update call. No new endpoints.

- **Read:** `GET /profile` → the user object now includes the fields below.
- **Write:** `PUT /profile` → send any subset of the fields below in the JSON body.
- **Read another user:** `GET /profile/:id` → same fields appear on other users' profiles (subject to the existing subscription gating; nothing field-specific here).

### 1.2 New fields on the user object

| Field | Type | Allowed values | Notes |
|------|------|------|------|
| `offerNamaz` | string (enum) | `during_ramadan` \| `regularly` \| `sometimes` \| `never` | Frequency |
| `reciteQuran` | string (enum) | `during_ramadan` \| `regularly` \| `sometimes` \| `never` | Frequency |
| `keepRoza` | string (enum) | `yes` \| `no` | |
| `giveZakat` | string (enum) | `during_ramadan` \| `regularly` \| `sometimes` \| `never` | Frequency |
| `performedHajjUmrah` | string (enum) | `yes` \| `no` | |
| `wearHijab` | string (enum) | `yes` \| `no` \| `sometimes` | **Female profiles only** (see §3.3) |
| `dietPreference` | string (enum) | `vegetarian` \| `non_vegetarian` | |
| `languagesKnown` | string[] | free strings from the Languages list (§4.1) | Multi-select |
| `smoke` | string (enum) | `yes` \| `no` | |
| `drink` | string (enum) | `yes` \| `no` | |
| `cookFood` | string (enum) | `yes` \| `no` \| `sometimes` | |
| `sports` | string[] | free strings from the Sports list (§4.2) | Multi-select |
| `hobbies` | string[] | free strings from the Hobbies list (§4.3) | Multi-select |
| `musics` | string[] | free strings from the Music list (§4.4) | Multi-select |

All fields are absent/`null`/empty when the user has not set them. Single-value fields are stored as the **exact lowercase enum string** shown above. Array fields store the **exact title strings** from the lists in §4 (e.g. `"Cricket"`, `"Naat / Hamd"`).

> Important for cross-platform consistency: the array fields store raw display strings, not codes. The mobile app **must use the exact same option strings** listed in §4 so that values written on web and mobile match.

### 1.3 Example `GET /profile` fragment

```jsonc
{
  // ...all normal own-profile fields...
  "offerNamaz": "regularly",
  "reciteQuran": "during_ramadan",
  "keepRoza": "yes",
  "giveZakat": "regularly",
  "performedHajjUmrah": "no",
  "wearHijab": "sometimes",          // only for female users

  "dietPreference": "vegetarian",
  "languagesKnown": ["Urdu", "Arabic", "English"],
  "smoke": "no",
  "drink": "no",
  "cookFood": "sometimes",
  "sports": ["Cricket", "Badminton"],
  "hobbies": ["Reading", "Travelling"],
  "musics": ["Naat / Hamd", "Qawwali"]
}
```

### 1.4 Example `PUT /profile` body

Send only what changed. Any field omitted is left untouched on the server.

```jsonc
{
  "offerNamaz": "regularly",
  "keepRoza": "yes",
  "dietPreference": "vegetarian",
  "languagesKnown": ["Urdu", "Arabic"],
  "sports": ["Cricket"]
}
```

The update route persists whatever it receives (`findByIdAndUpdate`). There is **no server-side validation** on this route today, so the client is responsible for only sending valid enum strings / list values.

---

## 2. Screen Layout

On web these are two cards appended at the bottom of the existing Edit-Profile column, **after** "4. Family Background":

- **Section 5 — Religious Practice** — "Share how you observe your faith (all optional)."
- **Section 6 — Lifestyle & Interests** — "Your habits, languages and what you enjoy (all optional)."

Mobile: add two equivalent grouped sections to the existing edit-profile flow (separate cards/screens are fine). Keep them after the family section to match the web ordering, but ordering is not critical.

Each section behaves like the existing sections:
- Pre-fill every input from the current user object.
- Show a **Save** action only when the user changed something (dirty state).
- On save, `PUT /profile` with the changed fields, then re-fetch `GET /profile` and refresh the store. Show a success toast.

---

## 3. Section 5 — Religious Practice

Each field is a **single-select** dropdown/picker. Labels and options:

| Field | Label | Options (value → display) |
|------|------|------|
| `offerNamaz` | Offer Namaz | `during_ramadan`→During Ramadan, `regularly`→Regularly, `sometimes`→Sometimes, `never`→Never |
| `reciteQuran` | Recite Quran | same four frequency options |
| `keepRoza` | Keep Roza | `yes`→Yes, `no`→No |
| `giveZakat` | Give Zakat | same four frequency options |
| `performedHajjUmrah` | Performed Hajj / Umrah | `yes`→Yes, `no`→No |
| `wearHijab` | Wear Hijab | `yes`→Yes, `no`→No, `sometimes`→Sometimes |

### 3.3 Hijab gender rule
The **Wear Hijab** field is shown **only when the user's `gender === "female"`**. For male profiles, hide the field entirely (do not render the picker, do not send the value). The backend stores whatever it receives, so the gender restriction is enforced purely in the UI.

---

## 4. Section 6 — Lifestyle & Interests

Single-selects:

| Field | Label | Options (value → display) |
|------|------|------|
| `dietPreference` | Diet Preference | `vegetarian`→Vegetarian, `non_vegetarian`→Non Vegetarian |
| `smoke` | Smoke | `yes`→Yes, `no`→No |
| `drink` | Drink | `yes`→Yes, `no`→No |
| `cookFood` | Cook Food | `yes`→Yes, `no`→No, `sometimes`→Sometimes |

Multi-selects (store the exact strings; user can pick many):

### 4.1 Languages (`languagesKnown`)
Reuse the existing Languages list already used elsewhere in the app. Stored **values**:
`English`, `Hindi`, `Urdu`, `Arabic`, `Marathi`, `Bengali`, `Tamil`, `Telugu`, `Gujarati`, `Kannada`, `Malayalam`, `Punjabi`, `Sanskrit`, `Spanish`, `French`, `German`, `Mandarin`, `Japanese`.
(Display can include the native-script hint, e.g. `Urdu (اردو رسم الخط)`, but the stored value is just `Urdu`.)

### 4.2 Sports (`sports`)
`Cricket`, `Football`, `Badminton`, `Tennis`, `Table Tennis`, `Hockey`, `Basketball`, `Volleyball`, `Kabaddi`, `Swimming`, `Cycling`, `Running`, `Gym / Fitness`, `Yoga`, `Chess`, `Carrom`.

### 4.3 Hobbies (`hobbies`)
`Reading`, `Writing`, `Travelling`, `Cooking`, `Photography`, `Painting / Art`, `Gardening`, `Gaming`, `Music`, `Dancing`, `Fitness`, `Movies & TV`, `Volunteering`, `Calligraphy`, `Blogging`, `Shopping`.

### 4.4 Music (`musics`)
`Naat / Hamd`, `Qawwali`, `Ghazal`, `Sufi`, `Classical`, `Bollywood`, `Pop`, `Rock`, `Hip Hop / Rap`, `Folk`, `Instrumental`, `Devotional`.

> For the multi-select value/display: value and display are the same string for these three lists. For Languages, value is the plain name and display may add the script hint.

---

## 5. Save Behavior (match web exactly)

1. **All optional** — never require a field, never block save when empty.
2. **Single-select fields:** strip empty values before sending. If a single-select is left blank (no selection), do **not** include it in the `PUT` body, so an existing stored value is never overwritten with an empty string.
3. **Multi-select fields:** send the array **as-is**, including an empty array `[]`. This lets the user clear a previously-set multi-select.
4. After a successful `PUT /profile`, re-fetch `GET /profile` and update the local user store so the UI reflects saved values.
5. Show a success toast ("Profile updated successfully") and reset the dirty state.

---

## 6. Display Formatting

When showing a stored enum value as a label, convert snake_case to Title Case:
- `during_ramadan` → "During Ramadan"
- `non_vegetarian` → "Non Vegetarian"
- `yes` → "Yes", `no` → "No", `sometimes` → "Sometimes"

Array fields are already human-readable; render them as chips/comma-separated text.

---

## 7. Checklist for the mobile developer

- [ ] Add the 14 fields to the mobile User model/type as optional.
- [ ] Add two edit sections: Religious Practice (6 fields) and Lifestyle & Interests (8 fields).
- [ ] Hide **Wear Hijab** unless `gender === "female"`.
- [ ] Use the **exact** option strings from §3 and §4.
- [ ] Pre-fill from `GET /profile`; save via `PUT /profile`; re-fetch after save.
- [ ] Strip empty single-selects before sending; send arrays as-is (including `[]`).
- [ ] Format enum values to Title Case for display.
- [ ] Confirm nothing requires these fields anywhere (no onboarding gate, no discovery filter).
```
