"use client";

import OnboardingContinueButton from "@/app/components/onboarding/OnboardingContinueButton";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import MetadataDropdown from "@/app/components/shared/MetadataDropdown";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import useUserStore from "@/app/store/useUserStore";
import { MaritalStatus, MetadataTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import { onboardingStep3Schema } from "@/app/utils/validation.util";
import { Card, Select, SelectItem } from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const defaultValues = {
  maritalStatus: MaritalStatus.never_married,
  language: "",
  maslak: "",
  caste: "",
  community: "",
  qualification: "",
  workSector: "",
  occupation: "",
  annualIncome: "",
};

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { updateMyProfile } = useProfile();

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(onboardingStep3Schema),
  });

  useEffect(() => {
    if (user) {
      reset(user as any);
    }
  }, [user]);

  const onSubmit = async (data: typeof defaultValues) => {
    try {
      await updateMyProfile(data as any);
      router.push(routes.onboarding.step4);
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
          goBack
          title="Professional Details & Background"
          description="Your career and education play a big role in your life. Sharing these helps matches understand your daily world and future goals."
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={3} />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="text-left grid gap-10 mt-10"
          >
            <div className="grid gap-7 sm:grid-cols-2">
              <Controller
                control={control}
                name="maritalStatus"
                render={({ field }) => (
                  <Select
                    label="MARITAL STATUS"
                    placeholder="Select Marital Status"
                    variant="underlined"
                    isInvalid={!!errors.maritalStatus}
                    errorMessage={errors.maritalStatus?.message}
                    selectedKeys={new Set([field.value ?? ""])}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {Object.values(MaritalStatus).map((maritalStatus) => (
                      <SelectItem key={maritalStatus}>
                        {CommonUtils.formatTitle(maritalStatus)}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <MetadataDropdown
                    variant="underlined"
                    label="MOTHER TONGUE"
                    placeholder="Select Mother Tongue"
                    isInvalid={!!errors.language}
                    errorMessage={errors.language?.message}
                    metadataType={MetadataTypes.language}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key ?? "")}
                  />
                )}
              />

              <Controller
                control={control}
                name="maslak"
                render={({ field }) => (
                  <MetadataDropdown
                    variant="underlined"
                    label="MASLAK (OPTIONAL)"
                    isInvalid={!!errors.maslak}
                    errorMessage={errors.maslak?.message}
                    placeholder="Enter Maslak"
                    metadataType={MetadataTypes.maslak}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />

              <Controller
                control={control}
                name="caste"
                render={({ field }) => (
                  <MetadataDropdown
                    allowsCustomValue
                    variant="underlined"
                    label="CASTE (OPTIONAL)"
                    isInvalid={!!errors.caste}
                    errorMessage={errors.caste?.message}
                    placeholder="Select or type Caste"
                    metadataType={MetadataTypes.caste}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />

              <Controller
                control={control}
                name="community"
                render={({ field }) => (
                  <MetadataDropdown
                    allowsCustomValue
                    variant="underlined"
                    label="COMMUNITY (OPTIONAL)"
                    isInvalid={!!errors.community}
                    errorMessage={errors.community?.message}
                    placeholder="Select or type Community"
                    metadataType={MetadataTypes.community}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />

              <Controller
                control={control}
                name="qualification"
                render={({ field }) => (
                  <MetadataDropdown
                    variant="underlined"
                    label="HIGHEST QUALIFICATION"
                    isInvalid={!!errors.qualification}
                    errorMessage={errors.qualification?.message}
                    placeholder="Enter Highest Qualification"
                    metadataType={MetadataTypes.qualification}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />

              <Controller
                control={control}
                name="workSector"
                render={({ field }) => (
                  <MetadataDropdown
                    variant="underlined"
                    label="EMPLOYED IN"
                    isInvalid={!!errors.workSector}
                    errorMessage={errors.workSector?.message}
                    placeholder="Select Work Sector"
                    metadataType={MetadataTypes.employed_in}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />

              <Controller
                control={control}
                name="occupation"
                render={({ field }) => (
                  <MetadataDropdown
                    allowsCustomValue
                    variant="underlined"
                    label="OCCUPATION"
                    isInvalid={!!errors.occupation}
                    errorMessage={errors.occupation?.message}
                    placeholder="Select or type your occupation"
                    metadataType={MetadataTypes.occupation}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />

              <Controller
                control={control}
                name="annualIncome"
                render={({ field }) => (
                  <MetadataDropdown
                    variant="underlined"
                    label="ANNUAL INCOME"
                    isInvalid={!!errors.annualIncome}
                    errorMessage={errors.annualIncome?.message}
                    placeholder="Select Annual Income"
                    metadataType={MetadataTypes.annual_income}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => field.onChange(key)}
                  />
                )}
              />
            </div>

            <OnboardingContinueButton type="submit" isLoading={isSubmitting} />
          </form>
        </Card>
      </div>
    </div>
  );
};

export default page;
