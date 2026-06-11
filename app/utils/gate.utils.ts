import routes from "../configs/route-paths";
import { User } from "../types/types";

/**
 * Where a fully-onboarded user must go next, given the admin gate toggles and
 * the user's permanent gate flags. Single source for the
 * entry-fee → spin-wheel → home ordering so the onboarding flow, the paywall
 * pages and the app shell can never disagree. A missing/unloaded config
 * defaults to enabled (gate on).
 */
const resolveGateRoute = (
  user: Partial<User> | null | undefined,
  config: Record<string, string> | null | undefined,
): string => {
  const entryFeeEnabled = config?.entryFeeEnabled !== "false";
  const spinWheelEnabled = config?.spinWheelEnabled !== "false";

  // Entry gate: only when the fee is enabled AND the user hasn't been granted
  // access (paid or waived). Users who already have access are never sent back.
  if (entryFeeEnabled && !user?.hasAppAccess) return routes.entryFee;

  // Spin gate: shown after entry, only when enabled AND not yet resolved.
  if (spinWheelEnabled && user?.hasAppAccess && !user?.spinResolved)
    return routes.spinReward;

  return routes.home;
};

export default resolveGateRoute;
