# Subscription Frontend Implementation Guide

This document maps the redesigned backend subscription module to the current frontend web panel and lists the UI/UX changes needed so the panel behaves consistently with the implemented rules.

## Backend Subscription Behaviour To Reflect

1. Active subscription is capability based, not only plan-name based.

   The current user profile response includes `subscription` with:
   - `hasActivePlan`
   - `planName`, `planType`, `planDuration`, `expiryDate`
   - `capabilities.canMessage`
   - `capabilities.hasAdvancedFilters`
   - `capabilities.canBlock`
   - `capabilities.hasProfileBoost`
   - `capabilities.hasRelationshipManager`
   - `contactViewBalance`, `contactViewLifetime`, `viewCountRemaining`

   Frontend gating should read these values from `useUserStore().user.subscription`. Do not infer access from a plan name or from pricing-card marketing text.

2. Contact views are a persistent wallet.

   When a plan is purchased, the backend adds `pricing.contactViewLimit` to `User.contactViewBalance` and `User.contactViewLifetime`. These credits do not expire when the subscription expires. This means a user can have no active plan but still have contact credits.

   UI must treat "active subscription" and "available contact views" as separate states.

3. Viewing contact details spends one wallet credit.

   Endpoint:
   - `GET /view-contact/:id`

   Backend behaviour:
   - Viewing own contact is always free.
   - If the contact was previously unlocked, the user gets it again without spending another credit.
   - If not previously unlocked, one credit is atomically deducted from `contactViewBalance`.
   - If no credits remain, backend returns forbidden with: `You have no contact views left. Purchase a plan to unlock contacts.`

   Frontend must add this endpoint and build a contact reveal flow instead of showing phone/email directly from profile data.

4. Profile photo and profile-detail visibility are subscription gated.

   Backend returns `shouldBlur` on other-user profiles. The rule is:
   - Own profile: never blurred.
   - Other public profile + active subscription: photo can be clear.
   - Other public profile + no active subscription: photo must be blurred.
   - Other private profile: photo remains blurred even for subscribed users.

   Backend also limits other-user profile payloads:
   - Subscribed viewer gets full profile plus family details.
   - Unsubscribed viewer gets basic profile only: id, display id, name, gender, age/dob, address, photos, `isPrivate`, `shouldBlur`.

   Frontend must be resilient when fields such as `occupation`, `qualification`, `sect`, `workSector`, `language`, `family`, `annualIncome`, etc. are absent because absence is now expected behaviour for unsubscribed users.

5. Discovery filters are split into basic and advanced filters.

   Always available:
   - Country
   - State
   - Sect
   - Marital status
   - Caste/community
   - Height range
   - Age range

   Advanced filters require active subscription and `hasAdvancedFilters`:
   - User ID
   - City/location
   - Maslak
   - Qualification
   - Language
   - Annual income
   - Work sector

   Backend silently ignores advanced params when the viewer does not have access. Frontend should not let users believe those filters are active when the backend will ignore them.

6. Messaging is capability gated.

   Backend allows users to read and receive messages without a messaging plan, but sending a message requires:
   - active subscription
   - `subscription.capabilities.canMessage === true`

   If not allowed, backend rejects send with: `Your plan does not allow sending messages. Please purchase a plan that includes chat.`

   Frontend should disable or replace the composer when sending is not allowed, instead of waiting for socket failure.

7. Plan purchase rules are backend enforced.

   Backend prevents purchasing a new plan while an active subscription exists. It also calculates the amount server-side from `planId + planDuration`; frontend should continue sending only those fields.

   Pricing UI should show current plan status and avoid showing enabled "Activate" buttons for users who already have an active plan.

8. Interests are NOT subscription gated — do not lock them.

   Backend does not gate `interests/send` or `interests/:id/respond` by subscription. An unsubscribed user can send unlimited interest requests and accept/decline incoming ones. The send/accept/decline buttons on `MatchCard` and elsewhere must stay enabled for all users regardless of plan state. Do not add a subscription check to these actions.

9. Capability state is convenience only — backend is the authority.

   The user (with `subscription.capabilities`) is persisted to `localStorage` via `useUserStore`. A subscription expires lazily on the server, so the persisted copy can claim an active plan after it has actually expired. Treat UI capability checks as UX hints only; never as a security boundary — the backend already returns 403 on disallowed actions. To keep the UI honest, call `getMyProfile()` + `setUser()` on app focus / pricing page mount (not only after a payment or contact reveal) so expiry and balance reflect.

## Current Frontend State

1. Pricing page exists and calls the correct payment flow.

   Current files:
   - `frontend/app/(app)/pricing/page.tsx`
   - `frontend/app/components/cards/PriceCard.tsx`

   Current behaviour:
   - Fetches `GET /plans?duration=...`
   - Creates plan payment with `paymentType: plan`, `planId`, `planDuration`
   - Verifies Razorpay payment
   - Refreshes profile after success

   Missing:
   - Current subscription summary.
   - Contact-view balance display.
   - Active plan lockout before calling payment API.
   - Capability labels for all backend flags. `PriceCard` currently highlights only `hasAdvancedFilters`; it does not show `canMessage`, `canBlock`, `hasProfileBoost`, or `hasRelationshipManager` even though these are plan-level runtime capabilities.

2. Match cards partially support blur.

   Current file:
   - `frontend/app/components/cards/MatchCard.tsx`

   Current behaviour:
   - Uses `profile.shouldBlur ?? profile.isPrivate`.
   - Blurs the main photo.

   Missing:
   - Upgrade/locked overlay when blur is caused by missing subscription.
   - Different label for private profile vs subscription-locked profile.
   - Safe fallback display when unsubscribed payload does not include `occupation`, `qualification`, or `sect`.
   - Card click currently opens details even when the user has only basic access. This is acceptable, but the details page must show a locked state instead of empty/misleading fields.

   Fixed (this revision):
   - The top sub-line previously rendered `{occupation}, {age}` directly. For an unsubscribed viewer the backend basic payload omits `occupation`, so the card showed the literal `undefined, 28`. Now guarded with `{[occupation, age].filter(Boolean).join(", ")}`.
   - The `sect` and `qualification` chips previously rendered unconditionally, producing empty chips for unsubscribed payloads. Both are now conditional (`{sect && ...}`, `{qualification && ...}`).
   - `age` is recomputed from `dob` (present in the basic payload), so age continues to display for unsubscribed viewers.

3. Match details need redesign for gated data.

   Current files:
   - `frontend/app/(app)/matches/[id]/page.tsx`
   - `frontend/app/components/match-details/MatchProfileSection.tsx`
   - `frontend/app/components/match-details/MatchExtraDetails.tsx`
   - `frontend/app/components/match-details/MatchCapability.tsx`

   Current behaviour:
   - Main photo uses `shouldBlur`.
   - Page always renders compatibility and extra details.
   - Extra details render "Not Specified" when values are absent.
   - Gallery is disabled only when `profile.isPrivate`.

   Missing:
   - Unsubscribed users should not see an apparently complete profile full of "Not Specified"; they should see a deliberate locked profile state.
   - Family tab should be locked/hidden for unsubscribed users because backend returns `family: null`.
   - Photo gallery must respect `shouldBlur`, not just `isPrivate`.
   - Gallery modal should not open clear photos when `shouldBlur` is true.
   - `MatchCapability` is static dummy content and should either be removed, replaced with real match data, or turned into a premium/locked insight block if it is intended as a subscription feature.
   - Contact reveal UI is missing entirely.

4. Discovery filters do not match backend gating.

   Current file:
   - `frontend/app/components/home/FilterSection.tsx`

   Current behaviour:
   - Shows `userId`, age, location, sect, caste, qualification.
   - Sends whatever is selected as query params.

   Missing:
   - `userId`, `location`, `maslak`, and `qualification` are currently shown as normal filters, but backend treats them as advanced-only.
   - Country/state are backend-supported basic filters but are not exposed here.
   - Height, marital status, language, annual income, and work sector are backend-supported but not represented.
   - There is no disabled/upgrade state for advanced filters when `hasAdvancedFilters` is false.

5. Chat composer is not subscription aware.

   Current files:
   - `frontend/app/components/chat/ChatFooter.tsx`
   - `frontend/app/(app)/message/[id]/page.tsx`

   Current behaviour:
   - Composer is always enabled.
   - Socket send includes `senderId` and relies on backend to reject.

   Missing:
   - Composer disabled state for no active plan or no `canMessage`.
   - Upgrade CTA to pricing with a clear explanation.
   - Socket error feedback. If `sendMessage` fails in the gateway, the user currently may see no useful UI error.
   - Attachment and emoji controls should also be disabled when sending is not allowed.

6. Chat avatars use privacy only, not subscription blur.

   Current files:
   - `frontend/app/components/chat/ChatHeader.tsx`
   - `frontend/app/components/chat/ChatListCard.tsx`

   Current behaviour:
   - Avatars blur when `participant.isPrivate`.

   Backend room participant population currently selects `isPrivate`, but not `shouldBlur`, so chat cannot fully apply subscription blur yet. Frontend should either request backend support for `shouldBlur` in chat room summaries or continue privacy-only blur and document it as a backend gap.

7. Contact unlock endpoint is not wired.

   Current file:
   - `frontend/app/api/endpoints.ts`

   Missing:
   - Add `SUBSCRIPTION.VIEW_CONTACT: (id: string) => /view-contact/${id}` or similar.
   - Add UI action on match details.
   - Refresh profile/subscription after a successful first unlock so `contactViewBalance` updates.

8. My profile does not show subscription/wallet state.

   Current files:
   - `frontend/app/(app)/my-profile/page.tsx`
   - `frontend/app/components/my-profile/MyProfileDetails.tsx`

   Current behaviour:
   - Shows editable profile and public preview.

   Missing:
   - Current plan card.
   - Expiry date.
   - Contact views remaining.
   - Capability list.
   - CTA to pricing when no active plan or zero credits.

## Required Frontend UI/UX Changes

1. Add a reusable subscription access helper.

   Create a small utility/hook, for example `useSubscriptionAccess`, that reads from `useUserStore` and exposes:
   - `hasActivePlan`
   - `canViewFullProfile`
   - `canUseAdvancedFilters`
   - `canSendMessages`
   - `hasContactCredits`
   - `contactViewBalance`
   - `isSubscriptionPhotoLocked(profile)`
   - `isPrivatePhotoLocked(profile)`

   This prevents each component from inventing its own checks and keeps UI labels consistent.

2. Add a reusable locked-content component.

   Build a component for subscription-gated panels with:
   - lock icon
   - concise title
   - reason text
   - primary CTA to `/pricing`
   - optional secondary action such as "Use contact credit" if the user has credits

   Use this in match details, advanced filters, chat composer, photo gallery, and contact reveal.

3. Redesign the pricing page around current membership state.

   Add a top summary band before plan cards:
   - Active plan name or "No active plan"
   - Expiry date if active
   - Contact views remaining
   - Lifetime contact views purchased
   - Capability chips for the active plan

   Behaviour:
   - If `hasActivePlan` is true, show plan cards in compare mode and disable activation buttons with copy like "Active plan already running".
   - If `hasActivePlan` is false, activation buttons remain enabled.
   - If user has no active plan but has credits, show "You still have X contact views available" so users understand credits survive expiry.
   - After payment success, refresh `getMyProfile()` and update pricing page state immediately.

4. Update plan cards to show runtime capabilities.

   `PriceCard` should display all backend capability flags, not only `hasAdvancedFilters`.

   Recommended display:
   - Contact views: `pricing.contactViewLimit`
   - Messaging: enabled when `canMessage`
   - Advanced filters: enabled when `hasAdvancedFilters`
   - Profile boost: enabled when `hasProfileBoost`
   - Relationship manager: enabled when `hasRelationshipManager`
   - Block feature: enabled when `canBlock`

   Marketing `features[]` can stay, but capability flags should be visibly separate because they control real access.

5. Update match card locked-photo behaviour.

   `MatchCard` should continue using `shouldBlur`, but add clear visual reasons:
   - If `profile.isPrivate`, show private badge and text/icon indicating "Private photo".
   - If `profile.shouldBlur && !profile.isPrivate`, show a subscription lock overlay or small chip like "Subscribe to view photo".

   For unsubscribed basic payloads:
   - Do not render blank chips for missing `sect`, `qualification`, or `occupation`.
   - Keep the card useful with name, age, city/state/country, and user ID.
   - Optional CTA on the card: "View basic profile" or "Upgrade to view full details".

6. Redesign match details for three access states.

   State A: subscribed viewer + public target
   - Clear main photo.
   - Full details visible.
   - Family tab visible if family exists.
   - Gallery visible and modal enabled.
   - Contact reveal action available, spending wallet credit if not previously unlocked.

   State B: unsubscribed viewer
   - Main photo blurred.
   - Basic identity/location visible.
   - Replace detailed sections with locked cards instead of rows saying "Not Specified".
   - Hide or disable family tab with upgrade CTA.
   - Gallery thumbnails should remain blurred or be replaced by locked gallery placeholder.
   - Contact reveal should show wallet-aware CTA:
     - If `contactViewBalance > 0`: "Reveal contact, uses 1 view".
     - If `contactViewBalance === 0`: "Buy a plan to get contact views".

   State C: subscribed viewer + private target
   - Full textual details can be visible because subscription is active.
   - Photos remain blurred.
   - Gallery disabled/locked because backend marks photo access private.
   - Contact reveal still follows contact-credit rules.

7. Add contact reveal flow on match details.

   Add a contact section to `MatchProfileSection` or a new side panel:
   - Initial state: show masked phone/email placeholders.
   - If the user has credits: show "Reveal contact" button and explain it uses one view.
   - If zero credits: show upgrade CTA.
   - On click call `GET /view-contact/:id`.
   - On success show returned `mobile` and `email`.
   - If message is "Previously unlocked", show the contact without deducting UI balance.
   - After first unlock, call `getMyProfile()` to refresh `contactViewBalance`.
   - Show backend forbidden errors as actionable toasts.

8. Gate advanced discovery filters in the UI.

   Split filters into "Basic filters" and "Advanced filters".

   Basic filters should include backend-supported non-premium filters:
   - age range
   - country
   - state
   - sect
   - marital status
   - caste/community
   - height range

   Advanced filters should include:
   - user ID
   - city/location
   - maslak
   - qualification
   - language
   - annual income
   - work sector

   Behaviour:
   - If `user.subscription.capabilities.hasAdvancedFilters` is false, advanced controls should be disabled or visually locked.
   - Disabled controls should not be added to URL query params.
   - Show a compact upgrade CTA near the advanced group.
   - If the user lands with advanced params already in the URL but does not have access, show a notice that advanced filters require a plan and remove/ignore them client-side.

9. Update chat composer for `canMessage`.

   `ChatFooter` should read `user.subscription.capabilities.canMessage`.

   Behaviour:
   - If allowed: keep existing composer.
   - If no active plan: replace composer with a locked bar: "Subscribe to send messages" and CTA to pricing.
   - If active plan but `canMessage` false: show "Your current plan does not include messaging" and CTA to pricing/compare plans.
   - Disable file upload, emoji, text input, and send button when not allowed.
   - Add socket error handling so forbidden send errors display a toast instead of failing silently.

10. Add subscription summary to account/profile area.

   Add a compact membership card on My Profile:
   - Plan name and status
   - Expiry date
   - Contact views remaining
   - Capability chips
   - CTA to pricing

   This gives the user a place to understand why features are locked.

11. Normalize copy and empty states.

   Avoid showing backend-gated absence as "Not Specified". Use:
   - "Subscribe to view full profile details"
   - "Private photo"
   - "This plan does not include messaging"
   - "You have 0 contact views remaining"
   - "Previously unlocked" when returned by contact endpoint

   "Not Specified" should only mean the subscribed/full profile payload contains the field but the user has not filled it.

12. Refresh profile after subscription-affecting actions.

   Call `getMyProfile()` after:
   - successful plan activation
   - successful first contact reveal
   - any future subscription-related reward/top-up

   This keeps `contactViewBalance`, active plan, and capabilities in sync with backend state.

## Page-by-Page Implementation Checklist

1. `frontend/app/api/endpoints.ts`

   Add subscription endpoints:
   - `VIEW_CONTACT: (id: string) => /view-contact/${id}`

   No standalone `GET /subscription` constant is needed: subscription state is embedded in the own-profile response (`getProfile` returns `subscription`). Frontend refreshes sub state by calling `PROFILE.GET` + `setUser()`.

2. `frontend/app/types/types.ts`

   Ensure `Plan` includes all capability flags returned by plan APIs:
   - `canMessage`
   - `canBlock`
   - `hasProfileBoost`
   - `hasRelationshipManager`

   These are already present in the type but not fully returned by public `GET /plans` at the time of this review, except `hasAdvancedFilters`. Preferred fix: update the backend `getPlansByDuration` response to include all five capability flags (4-line change), rather than defaulting missing booleans to false on the frontend — defaulting silently mislabels plans before purchase. Do this backend fix first; it unblocks PriceCard capability display.

3. `frontend/app/(app)/pricing/page.tsx`

   Add membership summary, active-plan lockout, and better error toasts for `CREATE` failures.

4. `frontend/app/components/cards/PriceCard.tsx`

   Display capability flags and support disabled/active-plan button states. (The old `isPremium` heuristic — `name.toLowerCase().includes("premium")` — was dead for the new basic/silver/gold/assisted/unlimited catalog and has been removed; derive any highlight from `plan.type` or `pricing.badgeText`.)

5. `frontend/app/components/home/FilterSection.tsx`

   Split basic/advanced filters and lock advanced filters when unavailable.

6. `frontend/app/components/cards/MatchCard.tsx`

   Add subscription-lock overlay and make missing fields safe.

7. `frontend/app/(app)/matches/[id]/page.tsx`

   Decide access state once, pass it to child components, and render locked detail sections when needed.

8. `frontend/app/components/match-details/MatchProfileSection.tsx`

   Add contact reveal UI and handle blurred-photo reason.

9. `frontend/app/components/match-details/MatchExtraDetails.tsx`

   Respect `shouldBlur` for gallery access, lock family/details for unsubscribed payloads, and avoid misleading "Not Specified" rows.

10. `frontend/app/components/match-details/MatchCapability.tsx`

   Replace static dummy content with real data or remove it. If keeping as a premium feature, lock it behind a capability once backend provides a real capability/source.

11. `frontend/app/components/chat/ChatFooter.tsx`

   Gate send composer by `canMessage`, disable attachments/emoji when locked, and surface socket errors.

12. `frontend/app/components/chat/ChatHeader.tsx` and `frontend/app/components/chat/ChatListCard.tsx`

   Continue privacy blur for now, but request backend to include `shouldBlur` for chat participants if subscription-based chat avatar blur is required.

13. `frontend/app/(app)/my-profile/page.tsx`

   Add subscription/wallet summary card.

## Backend Gaps Affecting Frontend Completion

1. Public `GET /plans` response currently returns `hasAdvancedFilters` but not the other capability flags, even though frontend `Plan` type expects them and admin plans define them. The pricing page needs `canMessage`, `canBlock`, `hasProfileBoost`, and `hasRelationshipManager` to accurately describe plans before purchase.

2. Chat room participant payload does not include `shouldBlur`, only `isPrivate`. If chat avatars should follow subscription blur rules, backend should compute and return `shouldBlur` for room summaries.

3. Socket send errors need a client-visible error event or acknowledgement pattern. Right now a forbidden exception during `sendMessage` may not produce a clear frontend toast unless the socket wrapper already handles gateway errors.

4. No frontend endpoint constant exists for `GET /view-contact/:id`.

## Recommended Implementation Order

1. Add subscription access helper, locked-content component, and `VIEW_CONTACT` endpoint.
2. Fix pricing page and price cards so users understand current plan, wallet balance, and capabilities.
3. Update match details and contact reveal because this is where subscription value is most visible.
4. Update discovery filters so users do not apply advanced filters that backend ignores.
5. Gate chat composer by `canMessage`.
6. Add My Profile subscription summary.
7. Coordinate backend additions for plan capability response and chat `shouldBlur`.

