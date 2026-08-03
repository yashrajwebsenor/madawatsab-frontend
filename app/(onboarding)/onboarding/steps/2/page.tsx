"use client";

import OnboardingContinueButton from "@/app/components/onboarding/OnboardingContinueButton";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import useUserStore from "@/app/store/useUserStore";
import noAutofill from "@/app/utils/no-autofill";
import { onboardingStep2Schema } from "@/app/utils/validation.util";
import {
  Autocomplete,
  AutocompleteItem,
  Card,
  DatePicker,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { parseDate } from "@internationalized/date";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import { heights } from "@/app/configs/data";
import useProfile from "@/app/hooks/useProfile";
import { useRouter } from "next/navigation";
import routes from "@/app/configs/route-paths";
import { Gender, ProfileFor } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import Image from "next/image";

const defaultValues = {
  fullName: "",
  gender: "",
  dob: null,
  height: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  isFamilyLivingWithUser: false,
};

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { updateMyProfile } = useProfile();

  const {
    countries,
    states,
    cities,
    statesLoaded,
    citiesLoaded,
    fetchCountries,
    fetchStates,
    fetchCities,
  } = useCountryCityStates();

  // A country/state with zero options (e.g. Antarctica has no states) must
  // not force a selection the user can never make.
  const hasStates = !statesLoaded || states.length > 0;
  const hasCities = !citiesLoaded || cities.length > 0;

  const isGenderLocked =
    user?.profileFor === ProfileFor.son ||
    user?.profileFor === ProfileFor.brother ||
    user?.profileFor === ProfileFor.sister ||
    user?.profileFor === ProfileFor.daughter;

  const schema = useMemo(
    () => onboardingStep2Schema(hasStates, hasCities),
    [hasStates, hasCities],
  );

  const {
    watch,
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({
        ...user,
        country: String(user?.address?.countryId),
        state: String(user?.address?.stateId),
        city: String(user?.address?.cityId),
        pincode: user?.address?.pincode ? String(user.address.pincode) : "",
        gender:
          user?.profileFor === ProfileFor.son ||
          user?.profileFor === ProfileFor.brother
            ? Gender.male
            : user?.profileFor === ProfileFor.sister ||
                user?.profileFor === ProfileFor.daughter
              ? Gender.female
              : user?.gender || "",
        dob: user?.dob ? dayjs(user?.dob).format("YYYY-MM-DD") : null,
      } as any);

      if (user?.address?.countryId) fetchStates(user?.address?.countryId);
      if (user?.address?.countryId && user?.address?.stateId)
        fetchCities(user?.address?.countryId, user?.address?.stateId);
    }
  }, [user]);

  useEffect(() => {
    fetchCountries();
  }, []);

  const onSubmit = async (data: typeof defaultValues) => {
    try {
      await updateMyProfile({
        ...data,
        state: data.state || undefined,
        city: data.city || undefined,
        dob: dayjs(data?.dob).toISOString(),
        pincode: data.pincode ? Number(data.pincode) : undefined,
      } as any);
      router.push(routes.onboarding.step3);
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
          title="Tell us about yourself"
          description="Share your basic details to help us find matches that truly resonate with your personality and lifestyle."
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={2} />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="text-left grid gap-10 mt-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="fullName"
                render={({ field }) => (
                  <Input
                    autoFocus
                    {...field}
                    label="FULL NAME"
                    variant="underlined"
                    isInvalid={!!errors.fullName}
                    placeholder="e.g. Abdullah Rahman"
                    errorMessage={errors.fullName?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    label="GENDER"
                    placeholder="Select Gender"
                    variant="underlined"
                    isInvalid={!!errors.gender}
                    errorMessage={errors.gender?.message}
                    isDisabled={isGenderLocked}
                    selectedKeys={new Set([field.value?.toString() ?? ""])}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {Object.values(Gender).map((item) => (
                      <SelectItem key={item}>
                        {CommonUtils.formatTitle(item)}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="dob"
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="DATE OF BIRTH"
                    variant="underlined"
                    isInvalid={!!errors.dob}
                    errorMessage={errors.dob?.message}
                    value={field.value ? parseDate(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.toString() : null)
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="height"
                render={({ field }) => (
                  <Select
                    label="HEIGHT"
                    placeholder="Select Height"
                    variant="underlined"
                    isInvalid={!!errors.height}
                    errorMessage={errors.height?.message}
                    selectedKeys={new Set([field.value?.toString() ?? ""])}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {heights.map((item) => (
                      <SelectItem key={item.value}>{item.title}</SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3 items-start">
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <Autocomplete
                    label="COUNTRY"
                    labelPlacement="outside"
                    placeholder="Select Country"
                    inputProps={noAutofill("onboarding-country")}
                    isInvalid={!!errors.country}
                    errorMessage={errors.country?.message}
                    selectedKey={field.value ? String(field.value) : ""}
                    onSelectionChange={(key) => {
                      const val = key as string;
                      field.onChange(val);

                      setValue("state", "");
                      setValue("city", "");
                      if (val) fetchStates(Number(val));
                    }}
                  >
                    {countries?.map((item) => (
                      <AutocompleteItem key={item.id}>
                        {item.name}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                )}
              />
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <Autocomplete
                    label="STATE/PROVINCE"
                    labelPlacement="outside"
                    placeholder={
                      statesLoaded && states.length === 0
                        ? "Not applicable"
                        : "Select State"
                    }
                    isDisabled={statesLoaded && states.length === 0}
                    inputProps={noAutofill("onboarding-state")}
                    isInvalid={!!errors.state}
                    errorMessage={errors.state?.message}
                    selectedKey={field.value ?? ""}
                    onSelectionChange={(key) => {
                      const val = key as string;
                      field.onChange(val);
                      setValue("city", "");
                      fetchCities(Number(watch("country")), Number(val));
                    }}
                  >
                    {states?.map((item) => (
                      <AutocompleteItem key={item.id}>
                        {item.name}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                )}
              />
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <Autocomplete
                    label="CITY"
                    labelPlacement="outside"
                    placeholder={
                      citiesLoaded && cities.length === 0
                        ? "Not applicable"
                        : "Select City"
                    }
                    isDisabled={citiesLoaded && cities.length === 0}
                    inputProps={noAutofill("onboarding-city")}
                    isInvalid={!!errors.city}
                    errorMessage={errors.city?.message}
                    selectedKey={field.value ?? ""}
                    onSelectionChange={(key) => {
                      field.onChange(key as string);
                    }}
                  >
                    {cities?.map((item) => (
                      <AutocompleteItem key={item.id}>
                        {item.name}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                )}
              />
            </div>

            <Controller
              control={control}
              name="pincode"
              render={({ field }) => (
                <Input
                  {...field}
                  label="PINCODE (OPTIONAL)"
                  labelPlacement="outside"
                  variant="underlined"
                  placeholder="e.g. 400001"
                  description="Helps us show you the office and agents nearest to you."
                  {...noAutofill("onboarding-pincode")}
                  isInvalid={!!errors.pincode}
                  errorMessage={errors.pincode?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="isFamilyLivingWithUser"
              render={({ field }) => (
                <div className="flex items-center justify-between p-6 bg-[#F8F9F8] rounded-xl border-l-4 border-primary">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-primary font-semibold text-lg">
                      Does family live with you?
                    </h4>
                    <p className="text-gray-500 text-sm">
                      This helps matches understand your household dynamics.
                    </p>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                      />
                      <span className="font-bold text-primary text-sm">
                        YES
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                      />
                      <span className="font-bold text-primary text-sm">NO</span>
                    </label>
                  </div>
                </div>
              )}
            />

            <OnboardingContinueButton type="submit" isLoading={isSubmitting} />
          </form>
        </Card>
      </div>
    </div>
  );
};

export default page;
