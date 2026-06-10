"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Card } from "@heroui/react";
import { spinWheelData } from "@/app/configs/data";
import routes from "@/app/configs/route-paths";
import { useRouter } from "next/navigation";
import SpinResultDialog from "@/app/components/dialogs/SpinResultDialog";
import useUserStore from "@/app/store/useUserStore";
import useConfigStore from "@/app/store/useConfigStore";
import useProfile from "@/app/hooks/useProfile";
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
  const { updateMyProfile } = useProfile();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const spinWheelEnabled = config?.spinWheelEnabled !== "false";

  useEffect(() => {
    // Leave the spin screen once it has been resolved (spun/skipped/waived) or
    // the admin disabled the wheel.
    if (user?.spinResolved || !spinWheelEnabled) {
      router.push(routes.home);
    }
  }, [user?.spinResolved, spinWheelEnabled]);

  const handleCloseDialog = () => {
    setResult(null);
    router.push(routes.home);
  };

  // Skipping still resolves the spin step so the wheel is never shown again.
  const handleSkip = async () => {
    await updateMyProfile({ spinResolved: true });
    router.push(routes.home);
  };

  const handleSpinClick = () => {
    if (!mustSpin) {
      const newPrizeNumber = Math.floor(Math.random() * spinWheelData.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setResult(null);
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
              onStopSpinning={async () => {
                setMustSpin(false);
                setResult(spinWheelData[prizeNumber].option);
                await updateMyProfile({
                  spinReward: spinWheelData[prizeNumber].key,
                });
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
