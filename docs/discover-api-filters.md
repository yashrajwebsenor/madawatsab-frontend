# Discover API — Filters Reference (Mobile Integration)

Reference for the **Discover** screen feed. Lists every supported filter, how to
send it, valid values, and which filters need a subscription.

---

## Endpoint

```
GET /api/profile/discover
```

**Auth (both required):**

| Header | Value |
| ------ | ----- |
| `Authorization` | `Bearer <jwt>` |

- The user must be authenticated (JWT).
- The route is also behind the **entry-fee paywall** (`AppAccessGuard`). If the
  admin has the entry fee enabled and the user has **not** paid
  (`hasAppAccess = false`), the API returns:

  ```
  403 Forbidden — "Entry fee payment is required to access the app."
  ```

  If the entry fee is disabled globally, everyone passes.

---

## What the feed returns by default (no filters)

The server always applies this base logic — the frontend cannot change it:

- **Opposite gender only** (male sees female, female sees male).
- Only users with `isOnboardingCompleted = true`.
- **Excludes**: the current user, and anyone they already have an **accepted
  interest** with (both sent & received).
- Sorted by newest first (`createdAt` desc).
- Ad cards may be injected into the list (see [Response shape](#response-shape)).

> The current user must have completed their own onboarding (gender set), else:
> `400 — "Please complete your profile/onboarding first."`

---

## All query params are sent as strings

Every filter is an optional URL query param. Send as a string; the server casts
numbers internally. Omit a param to not filter on it.

Example:

```
GET /api/profile/discover?page=1&limit=10&minAge=25&maxAge=32&sect=sunni&country=1&state=12
```

---

## Filter table

### Pagination

| Param   | Type | Example | Notes |
| ------- | ---- | ------- | ----- |
| `page`  | number | `1`  | Defaults to `1`. |
| `limit` | number | `10` | Page size. Defaults to `10`. |

### Normal filters — available to **every** user

| Param           | Type   | Example         | How it filters |
| --------------- | ------ | --------------- | -------------- |
| `online`        | string | `true`          | `online=true` → only users currently online (`isOnline` flag). Any other value = ignored. |
| `minAge`        | number | `20`            | Min age in years (computed from DOB). |
| `maxAge`        | number | `30`            | Max age in years. |
| `minHeight`     | number | `150`           | Min height in **cm**. |
| `maxHeight`     | number | `180`           | Max height in **cm**. |
| `sect`          | enum   | `sunni`         | Exact match. Values: `sunni`, `shia`, `other`. |
| `maritalStatus` | enum   | `never_married` | Exact match. Values: `never_married`, `divorced`, `widowed`, `separated`, `awaiting_divorce`. |
| `caste`         | string | `Sheikh`        | Partial, case-insensitive match on the user's **community** field. |
| `country`       | number (id) | `1`        | Country id (see [Location reference](#location-reference-ids)). |
| `state`         | number (id) | `12`       | State id. |
| `location`      | number (id) | `42`       | **City id**. Free for everyone (was advanced-only before Jul 2026). |

### Advanced filters — require an **active subscription with advanced filters**

These params are **silently ignored** if the viewer has no active subscription,
or the subscription plan does not include advanced filters
(`hasAdvancedFilters`). No error is thrown — the param simply has no effect, so
the frontend should only show these inputs to eligible users (or accept they may
be ignored).

| Param          | Type        | Example             | How it filters |
| -------------- | ----------- | ------------------- | -------------- |
| `userId`       | string      | `MADA001`           | Exact match on the public member id (search a specific profile). |
| `fullName`     | string      | `Ahmed Khan`        | Partial, case-insensitive name match. Min **3 chars** (shorter values are ignored). |
| `mobile`       | string      | `9876543210`        | Exact mobile-number match. Min **3 chars** (shorter values are ignored). |
| `maslak`       | string      | `Hanafi`            | Exact match. |
| `qualification`| string      | `Bachelors`         | Partial, case-insensitive match. Common values: `Undergraduate`, `Bachelors`, `Masters`, `PhD`, `Diploma`. |
| `language`     | string      | `Urdu`              | Partial, case-insensitive match (mother tongue). |
| `annualIncome` | enum        | `from_5_to_10_lakh` | Exact match. Values below. |
| `workSector`   | enum        | `private`           | Exact match. Values: `business`, `civil_service`, `defence`, `government`, `private`, `others`. |

**`annualIncome` values:**

```
under_3_lakh
from_3_to_5_lakh
from_5_to_10_lakh
from_10_to_15_lakh
from_15_to_25_lakh
from_25_to_50_lakh
from_50_to_75_lakh
from_75_lakh_to_1_crore
above_1_crore
```

---

## Location reference (ids)

`country`, `state`, and `location` (city) expect **numeric ids**, not names.
Fetch them from the Configs endpoints and use the returned ids:

| Purpose | Endpoint |
| ------- | -------- |
| All countries | `GET /api/configs/countries` |
| States in a country | `GET /api/configs/states/:countryId` |
| Cities in a state | `GET /api/configs/cities/:countryId/:stateId` |
| City name search | `GET /api/configs/cities/search?name=<text>` |

Recommended UX: country → state → city cascading pickers, sending the selected
id for each.

---

## Filter combination rules

- All filters are **AND**-combined (narrowing the result set).
- Geo: `country`, `state` and `location`/city are all normal filters — no
  subscription needed for any of them.
- `online=true` combines with every other filter and still paginates correctly.
- Advanced params sent by a non-eligible user are dropped server-side; results
  come back as if those params were not sent.

---

## Response shape

```jsonc
{
  "data": [
    {
      "cardType": "profile",
      "_id": "…",
      "userId": "MADA001",
      "fullName": "…",
      "gender": "female",
      "age": 26,
      "dob": "1999-01-01T00:00:00.000Z",
      "address": { /* populated */ },
      "profilePhoto": { /* populated */ },
      "photos": [ /* populated */ ],
      "isPrivate": false,
      "shouldBlur": true,            // photo blur for non-subscribers
      "isInterestSent": false,       // current user already sent interest
      "isInterestReceived": false    // current user already received interest
      // subscribed viewers receive the full profile object (more fields)
    },
    {
      "cardType": "ad",
      "banner": { /* populated */ }
      // …advertisement fields
    }
  ],
  "pagination": {
    "total": 134,
    "page": 1,
    "limit": 10,
    "totalPages": 14
  }
}
```

Notes for the frontend:

- **Always check `cardType`** — the list mixes `"profile"` and `"ad"` cards. Ad
  cards are injected at a server-controlled frequency and must render as ads, not
  profiles.
- **Subscribed vs not:** non-subscribers get a reduced profile object (id, name,
  gender, age, dob, address, photos, isPrivate) plus `shouldBlur`. Subscribers
  get the full profile. Use `shouldBlur` to blur/gate photos.
- `isInterestSent` / `isInterestReceived` drive the interest button state on each
  card.
- Page using `pagination.totalPages` / `pagination.total`. Note: ad cards make a
  page array sometimes longer than `limit` — paginate off `pagination`, not array
  length.
