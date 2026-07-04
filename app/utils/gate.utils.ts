import routes from "../configs/route-paths";
import { User } from "../types/types";

/**
 * Where a fully-onboarded user must go next, given the admin gate toggles and
 * the user's permanent gate flags. Single source for the
 * spin-wheel → entry-fee → home ordering so the onboarding flow, the paywall
 * pages and the app shell can never disagree. A missing/unloaded config
 * defaults to enabled (gate on).
 *
 * The wheel exists only to discount/waive the entry fee, so it runs BEFORE the
 * entry-fee screen (its outcome decides what that screen charges, or skips it
 * entirely on a free-entry win) and is only ever shown while the fee is also
 * enabled — disabling the fee disables the wheel too.
 */
const resolveGateRoute = (
  user: Partial<User> | null | undefined,
  config: Record<string, string> | null | undefined,
): string => {
  const entryFeeEnabled = config?.entryFeeEnabled !== "false";
  const spinWheelEnabled = entryFeeEnabled && config?.spinWheelEnabled !== "false";

  // Spin gate: mandatory first step once the fee is on, until resolved (spun,
  // or waived because a toggle was off at some point).
  if (spinWheelEnabled && !user?.spinResolved) return routes.spinReward;

  // Entry gate: only when the fee is enabled AND the user hasn't been granted
  // access (paid, waived, or already covered by a spin win).
  if (entryFeeEnabled && !user?.hasAppAccess) return routes.entryFee;

  return routes.home;
};

export default resolveGateRoute;
