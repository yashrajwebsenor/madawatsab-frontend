"use client";

import ProfileForCard from "@/app/components/cards/ProfileForCard";
import OnboardingContinueButton from "@/app/components/onboarding/OnboardingContinueButton";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import useUserStore from "@/app/store/useUserStore";
import { ProfileFor } from "@/app/types/enum";
import { Card } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { loading, updateMyProfile } = useProfile();
  const [selected, setSelected] = useState<ProfileFor | null>(null);

  useEffect(() => {
    if (user) {
      setSelected(user?.profileFor);
    }
  }, [user]);

  const onSubmit = async () => {
    if (!selected) return;
    try {
      await updateMyProfile({ profileFor: selected });
      router.push(routes.onboarding.step2);
    } catch (error) {
      console.log(error);
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
          title="Who is this profile for?"
          description="Select your relationship to the candidate to begin their journey towards a blessed union."
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={1} />
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 w-full my-10 max-w-sm mx-auto">
            {Object.values(ProfileFor).map((value) => (
              <ProfileForCard
                key={value}
                value={value}
                selected={selected === value}
                onSelect={() => setSelected(value)}
              />
            ))}
          </div>

          {selected && (
            <OnboardingContinueButton onPress={onSubmit} isLoading={loading} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default page;
