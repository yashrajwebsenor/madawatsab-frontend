import useUserStore from "../store/useUserStore";

// A profile is "subscription-locked" (blurred only because the viewer has no
// active plan) vs "privacy-locked" (the target's own profile is private).
type LockableProfile = {
  shouldBlur?: boolean;
  isPrivate?: boolean;
};

/**
 * Central read of the current user's subscription state + wallet. Every gated
 * component should consume this instead of inventing its own checks so UI
 * labels stay consistent.
 *
 * NOTE: these are UX hints only. The backend is the authority and returns 403
 * on disallowed actions — never treat these flags as a security boundary.
 */
const useSubscriptionAccess = () => {
  const { user } = useUserStore();
  const subscription = user?.subscription;
  const capabilities = subscription?.capabilities;

  const hasActivePlan = !!subscription?.hasActivePlan;
  const contactViewBalance = subscription?.contactViewBalance ?? 0;

  return {
    hasActivePlan,
    // Full profile + family details require an active subscription.
    canViewFullProfile: hasActivePlan,
    canUseAdvancedFilters: hasActivePlan && !!capabilities?.hasAdvancedFilters,
    canSendMessages: hasActivePlan && !!capabilities?.canMessage,
    hasContactCredits: contactViewBalance > 0,
    contactViewBalance,
    contactViewLifetime: subscription?.contactViewLifetime ?? 0,
    capabilities,
    subscription,
    // Photo is blurred because the viewer lacks a subscription (target public).
    isSubscriptionPhotoLocked: (profile?: LockableProfile) =>
      !!profile?.shouldBlur && !profile?.isPrivate,
    // Photo is blurred because the target's profile is private.
    isPrivatePhotoLocked: (profile?: LockableProfile) => !!profile?.isPrivate,
  };
};

export default useSubscriptionAccess;
