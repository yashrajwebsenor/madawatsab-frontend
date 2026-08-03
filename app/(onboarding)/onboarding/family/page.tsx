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
import SiblingCountFields from "@/app/components/shared/SiblingCountFields";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import { FamilyTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import noAutofill from "@/app/utils/no-autofill";
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
import { useEffect, useMemo, useState } from "react";
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
  brothers: 0,
  marriedBrothers: 0,
  sisters: 0,
  marriedSisters: 0,
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
    statesLoaded,
    citiesLoaded,
    fetchCities,
    fetchCountries,
    fetchStates,
  } = useCountryCityStates();

  // A country/state with zero options (e.g. Antarctica has no states) must
  // not force a selection the user can never make.
  const hasStates = !statesLoaded || states.length > 0;
  const hasCities = !citiesLoaded || cities.length > 0;

  const schema = useMemo(
    () => familyDetailsSchema(hasStates, hasCities),
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
          brothers: result?.brothers ?? 0,
          marriedBrothers: result?.marriedBrothers ?? 0,
          sisters: result?.sisters ?? 0,
          marriedSisters: result?.marriedSisters ?? 0,
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
        state: data.state ? Number(data.state) : undefined,
        city: data.city ? Number(data.city) : undefined,
        brothers: Number(data.brothers) || 0,
        marriedBrothers: Number(data.marriedBrothers) || 0,
        sisters: Number(data.sisters) || 0,
        marriedSisters: Number(data.marriedSisters) || 0,
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
              className="mt-10 grid gap-8 text-left"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="familyType"
                  render={({ field }) => (
                    <Select
                      label="FAMILY TYPE"
                      placeholder="Select Family Type"
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

              <div className="grid gap-5 rounded-2xl border border-gray-100 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-700">
                  Father&apos;s Details
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="fatherName"
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="FATHER'S NAME"
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
                        label="FATHER'S OCCUPATION"
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
                        label="FATHER'S CONTACT NUMBER (OPTIONAL)"
                        variant="underlined"
                        placeholder="Enter Father Contact Number"
                        isInvalid={!!errors.fatherContact}
                        errorMessage={errors.fatherContact?.message}
                        className="sm:col-span-2"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-5 rounded-2xl border border-gray-100 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-700">
                  Mother&apos;s Details
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="motherName"
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="MOTHER'S NAME"
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
                        label="MOTHER'S OCCUPATION"
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
                        label="MOTHER'S CONTACT NUMBER (OPTIONAL)"
                        variant="underlined"
                        placeholder="Enter Mother Contact Number"
                        isInvalid={!!errors.motherContact}
                        errorMessage={errors.motherContact?.message}
                        className="sm:col-span-2"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-5 rounded-2xl border border-gray-100 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-700">
                  Location
                </h3>
                <div className="grid gap-x-5 gap-y-6 sm:grid-cols-3 items-start">
                  <Controller
                    control={control}
                    name="country"
                    render={({ field }) => (
                      <Autocomplete
                        label="COUNTRY"
                        labelPlacement="outside"
                        placeholder="Select Country"
                        inputProps={noAutofill("family-country")}
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
                        inputProps={noAutofill("family-state")}
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
                        inputProps={noAutofill("family-city")}
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

              <SiblingCountFields control={control} variant="underlined" />

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
