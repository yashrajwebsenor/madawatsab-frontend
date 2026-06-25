"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import OnboardingContinueButton from "@/app/components/onboarding/OnboardingContinueButton";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import { FormSkeleton } from "@/app/components/shared/Skeletons";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import useConfigStore from "@/app/store/useConfigStore";
import useUserStore from "@/app/store/useUserStore";
import resolveGateRoute from "@/app/utils/gate.utils";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import { FamilyTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import { familyDetailsSchema } from "@/app/utils/validation.util";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const defaultValues = {
  familyType: FamilyTypes.joint,
  fatherName: "",
  fatherOccupation: "",
  fatherContact: "",
  motherName: "",
  motherOccupation: "",
  motherContact: "",
  country: "",
  state: "",
  city: "",
  aboutFamily: "",
};

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const [loading, setLoading] = useState(false);

  // Next stop after onboarding: entry fee / spin wheel / home, depending on
  // the admin toggles and the gate flags already stamped on the user. Never
  // hardcode /entry-fee here — when the fee is disabled the user already has
  // access and would just bounce off that page.
  const nextRoute = resolveGateRoute(user, config);

  const {
    cities,
    countries,
    states,
    fetchCities,
    fetchCountries,
    fetchStates,
  } = useCountryCityStates();

  const {
    watch,
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(familyDetailsSchema),
  });

  const getDetails = async () => {
    try {
      setLoading(true);

      const res = await api.get(ENDPOINTS.FAMILY.GET);
      const result = res.data;

      if (result) {
        reset({
          familyType: result?.familyType,
          fatherName: result?.fatherName,
          fatherOccupation: result?.fatherOccupation,
          fatherContact: result?.fatherContact,
          motherName: result?.motherName,
          motherOccupation: result?.motherOccupation,
          motherContact: result?.motherContact,
          aboutFamily: result?.aboutFamily,

          country: result?.country,
          state: result?.state,
          city: result?.city,
        });

        if (result?.country) {
          fetchStates(result.country);
        }
        if (result?.country && result?.state) {
          fetchCities(result.country, result.state);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetails();
    fetchCountries();
  }, []);

  const onSubmit = async (data: typeof defaultValues) => {
    try {
      await api.put(ENDPOINTS.FAMILY.UPDATE, {
        ...data,
        country: Number(data.country),
        state: Number(data.state),
        city: Number(data.city),
      });
      addToast({
        title: "Success",
        color: "success",
        description: "Family details updated successfully",
      });
      router.push(nextRoute);
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
          title="Family Background"
          description="Tell us a bit about your family. This helps potential matches understand your roots and the values you've grown up with."
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={5} />

          {loading ? (
            <div className="mt-10">
              <FormSkeleton />
            </div>
          ) : (
            <form
              className="mt-10 grid gap-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="familyType"
                  render={({ field }) => (
                    <Select
                      label="MARITAL STATUS"
                      placeholder="Select Marital Status"
                      variant="underlined"
                      isInvalid={!!errors.familyType}
                      errorMessage={errors.familyType?.message}
                      selectedKeys={new Set([field.value ?? ""])}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {Object.values(FamilyTypes).map((item) => (
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
                  name="fatherName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="FATHERS NAME"
                      variant="underlined"
                      placeholder="Enter Father Name"
                      isInvalid={!!errors.fatherName}
                      errorMessage={errors.fatherName?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="fatherOccupation"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="FATHERS OCCUPATION"
                      variant="underlined"
                      placeholder="Enter Father Occupation"
                      isInvalid={!!errors.fatherOccupation}
                      errorMessage={errors.fatherOccupation?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="fatherContact"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="FATHERS CONTACT NUMBER (OPTIONAL)"
                      variant="underlined"
                      placeholder="Enter Father Contact Number"
                      isInvalid={!!errors.fatherContact}
                      errorMessage={errors.fatherContact?.message}
                    />
                  )}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="motherName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="MOTHERS NAME"
                      variant="underlined"
                      placeholder="Enter Mother Name"
                      isInvalid={!!errors.motherName}
                      errorMessage={errors.motherName?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="motherOccupation"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="MOTHERS OCCUPATION"
                      variant="underlined"
                      placeholder="Enter Mother Occupation"
                      isInvalid={!!errors.motherOccupation}
                      errorMessage={errors.motherOccupation?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="motherContact"
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="MOTHERS CONTACT NUMBER (OPTIONAL)"
                      variant="underlined"
                      placeholder="Enter Mother Contact Number"
                      isInvalid={!!errors.motherContact}
                      errorMessage={errors.motherContact?.message}
                    />
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
                      inputProps={{ autoComplete: "new-password" }}
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
                      placeholder="Select State"
                      inputProps={{ autoComplete: "new-password" }}
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
                      placeholder="Select City"
                      inputProps={{ autoComplete: "new-password" }}
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
                name="aboutFamily"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label="ABOUT MY FAMILY"
                    variant="underlined"
                    placeholder="Enter about family"
                    isInvalid={!!errors.aboutFamily}
                    errorMessage={errors.aboutFamily?.message}
                  />
                )}
              />

              <div className="flex flex-col items-center gap-5">
                <OnboardingContinueButton
                  type="submit"
                  isLoading={isSubmitting}
                />

                <Button as={Link} href={nextRoute} variant="light">
                  Skip For Now
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default page;
