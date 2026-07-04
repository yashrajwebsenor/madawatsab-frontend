"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Card } from "@heroui/react";
import { fallbackSpinSegments } from "@/app/configs/data";
import routes from "@/app/configs/route-paths";
import resolveGateRoute from "@/app/utils/gate.utils";
import { useRouter } from "next/navigation";
import SpinResultDialog from "@/app/components/dialogs/SpinResultDialog";
import useUserStore from "@/app/store/useUserStore";
import useConfigStore from "@/app/store/useConfigStore";
import useProfile from "@/app/hooks/useProfile";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { SpinSegment } from "@/app/types/types";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import Image from "next/image";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import { playSpinSound } from "@/app/utils/spinWheelSound.utils";

const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false },
);

// react-custom-roulette's `spinDuration` prop — despite the name, NOT
// literal seconds, it's a multiplier over the library's internal phase
// timings (see spinWheelSound.utils.ts). Kept in one const so the wheel and
// the tick sound are always driven by the same value.
const SPIN_DURATION_PROP = 0.6;

type SpinOutcome = { freeEntry: boolean; amount: number };

const Page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const { getMyProfile } = useProfile();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<SpinOutcome | null>(null);
  const stopSpinSoundRef = useRef<() => void>(() => {});

  // Cancel any pending ticks if the user navigates away mid-spin.
  useEffect(() => () => stopSpinSoundRef.current(), []);

  // The wheel always renders the admin-configured segments; the static list is
  // only a fallback until the config has loaded.
  const segments: SpinSegment[] = useMemo(() => {
    try {
      const parsed = config?.spinWheelSegments
        ? JSON.parse(config.spinWheelSegments)
        : null;
      return Array.isArray(parsed) && parsed.length
        ? parsed
        : fallbackSpinSegments;
    } catch {
      return fallbackSpinSegments;
    }
  }, [config]);

  const wheelData = segments.map((segment) => ({
    option: segment.label,
    style: { backgroundColor: segment.color || "#3b82f6", textColor: "white" },
  }));

  useEffect(() => {
    // Leave the spin screen unless it is actually the pending gate: resolved
    // (spun or waived) or the wheel is disabled → home/entry-fee as decided by
    // resolveGateRoute.
    const next = resolveGateRoute(user, config);
    if (next !== routes.spinReward) {
      router.push(next);
    }
  }, [user, config]);

  const handleCloseDialog = async () => {
    setResult(null);
    // Refresh the user so the store picks up spinResolved/hasAppAccess/
    // entryFeeDiscount, then route by the fresh flags — a free-entry win goes
    // straight home, a partial discount goes on to the (now discounted)
    // entry-fee screen.
    await getMyProfile();
    const freshUser = useUserStore.getState().user;
    router.push(resolveGateRoute(freshUser, config));
  };

  // The reward is decided server-side; the wheel only animates to the prize
  // the backend already saved.
  const handleSpinClick = async () => {
    if (mustSpin) return;

    try {
      const res = await api.post(ENDPOINTS.PROFILE.SPIN_WHEEL);
      const { segmentIndex, freeEntry, amount } = res?.data ?? {};

      // Out-of-range segment (frontend wheel out of sync with the backend
      // config): the spin is already saved, so just refresh and leave.
      if (
        typeof segmentIndex !== "number" ||
        segmentIndex < 0 ||
        segmentIndex >= segments.length
      ) {
        await getMyProfile();
        router.push(resolveGateRoute(useUserStore.getState().user, config));
        return;
      }

      setPrizeNumber(segmentIndex);
      setResult({ freeEntry: !!freeEntry, amount: Number(amount) || 0 });
      // Pass the prop value itself, not a millisecond guess — the wheel's real
      // total spin time is a multi-phase formula derived from it (see util).
      stopSpinSoundRef.current = playSpinSound(SPIN_DURATION_PROP);
      setMustSpin(true);
    } catch (error) {
      // Most likely "already spun" — refresh so the redirect effect kicks in.
      console.log(error);
      await getMyProfile();
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="inset-0 bg-white/10 absolute z-10" />

      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/images/onboarding-bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative w-full flex flex-col lg:flex-row min-h-screen items-start justify-center gap-10 py-10 z-40 mx-auto container px-4">
        <OnboardingLeftSection
          title="Spinwheel"
          description="A little luck can lead to something big"
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={6} />

          <div className="mt-10 pointer-events-none drop-shadow-xl mb-6 flex justify-center w-[260px] md:w-[300px] mx-auto">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              spinDuration={SPIN_DURATION_PROP}
              onStopSpinning={() => {
                // Reward already persisted by the spin endpoint — only reveal it.
                setMustSpin(false);
              }}
              outerBorderColor="#e5e7eb"
              outerBorderWidth={5}
              innerBorderColor="#ffffff"
              innerBorderWidth={2}
              radiusLineColor="#ffffff"
              radiusLineWidth={1}
              textColors={["#ffffff"]}
              fontSize={22}
            />
          </div>

          <Button
            color="primary"
            size="lg"
            className="font-bold text-lg px-8 py-5 rounded-full w-full"
            onPress={handleSpinClick}
            isLoading={mustSpin}
            isDisabled={mustSpin || !!result}
          >
            {mustSpin ? "SPINNING..." : "SPIN THE WHEEL"}
          </Button>
        </Card>
      </div>

      {result && !mustSpin && (
        <SpinResultDialog
          isOpen={!mustSpin}
          onClose={handleCloseDialog}
          freeEntry={result.freeEntry}
          amount={result.amount}
        />
      )}
    </div>
  );
};

export default Page;
