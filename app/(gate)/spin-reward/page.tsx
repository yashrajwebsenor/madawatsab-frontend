"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Card } from "@heroui/react";
import { spinWheelData } from "@/app/configs/data";
import routes from "@/app/configs/route-paths";
import resolveGateRoute from "@/app/utils/gate.utils";
import { useRouter } from "next/navigation";
import SpinResultDialog from "@/app/components/dialogs/SpinResultDialog";
import useUserStore from "@/app/store/useUserStore";
import useConfigStore from "@/app/store/useConfigStore";
import useProfile from "@/app/hooks/useProfile";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import Image from "next/image";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";

const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false },
);

const Page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const { getMyProfile } = useProfile();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Leave the spin screen unless it is actually the pending gate: resolved
    // (spun/skipped/waived) or wheel disabled → home; entry fee still unpaid
    // → back to the paywall (the wheel comes after the entry gate).
    const next = resolveGateRoute(user, config);
    if (next !== routes.spinReward) {
      router.push(next);
    }
  }, [user, config]);

  const handleCloseDialog = async () => {
    setResult(null);
    // Refresh the user so the store picks up spinResolved before leaving.
    await getMyProfile();
    router.push(routes.home);
  };

  // Skipping still resolves the spin step so the wheel is never shown again.
  const handleSkip = async () => {
    try {
      await api.post(ENDPOINTS.PROFILE.SPIN_WHEEL_SKIP);
      await getMyProfile();
      router.push(routes.home);
    } catch (error) {
      console.log(error);
    }
  };

  // The reward is decided server-side; the wheel only animates to the prize
  // the backend already saved.
  const handleSpinClick = async () => {
    if (mustSpin) return;

    try {
      const res = await api.post(ENDPOINTS.PROFILE.SPIN_WHEEL);
      const rewardKey = res?.data?.spinReward;
      const rewardIndex = spinWheelData.findIndex((d) => d.key === rewardKey);

      // Unknown segment (frontend wheel out of sync with the backend list):
      // the spin is already saved, so just refresh and leave.
      if (rewardIndex === -1) {
        await getMyProfile();
        router.push(routes.home);
        return;
      }

      setPrizeNumber(rewardIndex);
      setResult(null);
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
          <OnboardingHeader step={7} />

          <div className="mt-10 pointer-events-none drop-shadow-xl mb-6 flex justify-center w-[260px] md:w-[300px] mx-auto">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={spinWheelData}
              spinDuration={0.6}
              onStopSpinning={() => {
                // Reward already persisted by the spin endpoint — only reveal it.
                setMustSpin(false);
                setResult(spinWheelData[prizeNumber].option);
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
          >
            {mustSpin ? "SPINNING..." : "SPIN THE WHEEL"}
          </Button>

          <Button variant="light" onPress={handleSkip} isDisabled={mustSpin}>
            Skip For Now
          </Button>
        </Card>
      </div>

      {result && (
        <SpinResultDialog
          isOpen={!!result}
          onClose={handleCloseDialog}
          data={result}
        />
      )}
    </div>
  );
};

export default Page;
