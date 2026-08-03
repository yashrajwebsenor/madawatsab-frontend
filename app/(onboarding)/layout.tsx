"use client";

import { usePathname, useRouter } from "next/navigation";
import useUserStore from "../store/useUserStore";
import { useEffect } from "react";
import routes from "../configs/route-paths";
import { User } from "../types/types";

const stepPaths = [
  routes.onboarding.step1,
  routes.onboarding.step2,
  routes.onboarding.step3,
  routes.onboarding.step4,
];

// Whether the data captured by a given onboarding step is already present.
// Used to stop users from jumping ahead (e.g. via the URL) past steps they
// haven't actually filled in.
const isStepComplete = (step: number, user?: User | null): boolean => {
  switch (step) {
    case 1:
      return !!user?.profileFor;
    case 2:
      return !!user?.gender && !!user?.fullName && !!user?.dob;
    case 3:
      return !!user?.qualification && !!user?.occupation && !!user?.annualIncome;
    case 4:
      return !!user?.profilePhoto;
    default:
      return true;
  }
};

const layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    // Already onboarded — leave the flow (family is the one allowed extra step).
    if (user.isOnboardingCompleted && pathname !== routes.onboarding.family) {
      router.replace(routes.home);
      return;
    }

    if (user.isOnboardingCompleted) return;

    // Enforce step order: you may only sit on a step once every earlier step's
    // data exists. Landing on a later step redirects to the first incomplete one.
    const currentStep = stepPaths.indexOf(pathname) + 1; // 0 when not a step page
    if (currentStep === 0) return;

    let firstIncompleteStep = stepPaths.length;
    for (let step = 1; step <= stepPaths.length; step++) {
      if (!isStepComplete(step, user)) {
        firstIncompleteStep = step;
        break;
      }
    }

    if (currentStep > firstIncompleteStep) {
      // replace: corrective bounce, not a user nav — must not grow history.
      router.replace(stepPaths[firstIncompleteStep - 1]);
    }
  }, [user, pathname, router]);

  return <>{children}</>;
};

export default layout;
