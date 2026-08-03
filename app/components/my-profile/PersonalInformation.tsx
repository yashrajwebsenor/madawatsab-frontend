import { FaRegUser } from "react-icons/fa";
import Section from "./Section";
import { Gender, MetadataTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import noAutofill from "@/app/utils/no-autofill";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { personalDetailsSchema } from "@/app/utils/validation.util";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  DatePicker,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import useUserStore from "@/app/store/useUserStore";
import { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import useProfile from "@/app/hooks/useProfile";
import { parseDate } from "@internationalized/date";
import MetadataDropdown from "../shared/MetadataDropdown";

const defaultValues = {
  fullName: "",
  dob: null,
  gender: "",
  country: "",
  state: "",
  city: "",
  maslak: "",
  caste: "",
  community: "",
};

const PersonalInformation = () => {
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

  const schema = useMemo(
    () => personalDetailsSchema(hasStates, hasCities),
    [hasStates, hasCities],
  );

  const {
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ defaultValues, resolver: yupResolver(schema) });

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        dob: user?.dob ? dayjs(user?.dob).format("YYYY-MM-DD") : null,
        gender: user.gender,
        country: String(user?.address?.countryId),
        state: String(user?.address?.stateId),
        city: String(user?.address?.cityId),
        maslak: user?.maslak,
        caste: user?.caste,
        community: user?.community,
      } as any);

      fetchCountries();

      if (user?.address?.countryId) {
        fetchStates(user?.address?.countryId);
      }

      if (user?.address?.countryId && user?.address?.stateId) {
        fetchCities(user?.address?.countryId, user?.address?.stateId);
      }
    }
  }, [user]);

  const onSubmit = handleSubmit(async (data: typeof defaultValues) => {
    await updateMyProfile({
      ...data,
      state: data.state || undefined,
      city: data.city || undefined,
      dob: dayjs(data?.dob).toISOString(),
    } as any);
  });

  return (
    <Section
      title="2. Personal Information"
      description="Basic details for your profile."
      icon={<FaRegUser size={20} className="text-primary" />}
    >
      <div className="grid items-center sm:grid-cols-2 gap-5 w-full">
        {fields.map((field) => {
          const name = field.name as keyof typeof defaultValues;
          const error = errors[name];

          return (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field: inputProps }) => {
                if (field.type === "metadata") {
                  return (
                    <MetadataDropdown
                      label={field.label}
                      isInvalid={!!error}
                      labelPlacement="outside"
                      errorMessage={error?.message}
                      placeholder={field.placeholder}
                      metadataType={field.metadataType!}
                      selectedKey={
                        inputProps.value ? String(inputProps.value) : ""
                      }
                      onSelectionChange={(key) => inputProps.onChange(key)}
                    />
                  );
                }

                if (field.type === "date") {
                  return (
                    <DatePicker
                      {...inputProps}
                      label={field.label}
                      labelPlacement="outside"
                      isInvalid={!!errors.dob}
                      errorMessage={errors.dob?.message}
                      value={
                        inputProps.value ? parseDate(inputProps.value) : null
                      }
                      onChange={(date) =>
                        inputProps.onChange(date ? date.toString() : null)
                      }
                    />
                  );
                }

                if (field.type === "select") {
                  return (
                    <Select
                      label={field.label}
                      isInvalid={!!error}
                      labelPlacement="outside"
                      errorMessage={error?.message}
                      placeholder={field.placeholder}
                      selectedKeys={new Set([inputProps.value ?? ""])}
                      onChange={(e) => inputProps.onChange(e.target.value)}
                    >
                      {(field?.options ?? [])?.map((item) => (
                        <SelectItem key={item.key}>{item.title}</SelectItem>
                      ))}
                    </Select>
                  );
                }

                if (field.type === "autocomplete") {
                  const options = {
                    country: countries,
                    state: states,
                    city: cities,
                  } as any;

                  // A country/state with zero options (e.g. Antarctica has no
                  // states) has nothing to select — don't leave a dead-end
                  // dropdown that looks pickable but isn't.
                  const hasNoOptions =
                    (name === "state" && statesLoaded && states.length === 0) ||
                    (name === "city" && citiesLoaded && cities.length === 0);

                  return (
                    <Autocomplete
                      label={field.label}
                      isInvalid={!!error}
                      labelPlacement="outside"
                      errorMessage={error?.message}
                      placeholder={
                        hasNoOptions ? "Not applicable" : field.placeholder
                      }
                      isDisabled={hasNoOptions}
                      // Only a dropdown selection carries the location id, so
                      // Chrome's saved-address suggestions must never appear.
                      inputProps={noAutofill(`my-profile-${name}`)}
                      selectedKey={
                        inputProps.value ? String(inputProps.value) : ""
                      }
                      onSelectionChange={(key) => {
                        const val = key as string;
                        inputProps.onChange(val);

                        if (name === "country") {
                          fetchStates(Number(val));
                          setValue("state", "");
                          setValue("city", "");
                        }

                        if (name === "state") {
                          fetchCities(
                            Number(watchedValues.country),
                            Number(val),
                          );
                          setValue("city", "");
                        }
                      }}
                    >
                      {(options?.[name] ?? [])?.map((item: any) => (
                        <AutocompleteItem key={item.id}>
                          {item.name}
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  );
                }

                return (
                  <Input
                    {...inputProps}
                    label={field.label}
                    isInvalid={!!error}
                    labelPlacement="outside"
                    errorMessage={error?.message}
                    value={inputProps.value ?? ""}
                    placeholder={field.placeholder}
                  />
                );
              }}
            />
          );
        })}
      </div>

      {!!isDirty && (
        <div className="mt-5 flex justify-end">
          <Button
            size="sm"
            color="primary"
            isLoading={isSubmitting}
            onPress={() => onSubmit()}
          >
            Save Changes
          </Button>
        </div>
      )}
    </Section>
  );
};

export default PersonalInformation;

const fields = [
  {
    name: "fullName",
    label: "FULL NAME",
    type: "text",
    placeholder: "Enter your full name",
  },
  {
    name: "dob",
    label: "DATE OF BIRTH",
    type: "date",
    placeholder: "dd/mm/yyyy",
  },
  {
    name: "gender",
    label: "GENDER",
    type: "select",
    options: Object.values(Gender).map((item) => ({
      key: item,
      title: CommonUtils.formatTitle(item),
    })),
  },
  {
    name: "country",
    label: "COUNTRY",
    type: "autocomplete",
  },
  {
    name: "state",
    label: "STATE",
    type: "autocomplete",
  },
  {
    name: "city",
    label: "CITY",
    type: "autocomplete",
  },
  {
    name: "community",
    label: "COMMUNITY",
    placeholder: "Select or type Community",
    type: "metadata",
    metadataType: MetadataTypes.community,
  },
  {
    name: "maslak",
    label: "MASLAK (OPTIONAL)",
    type: "metadata",
    metadataType: MetadataTypes.maslak,
  },
  {
    name: "caste",
    label: "CASTE (OPTIONAL)",
    placeholder: "Select or type Caste",
    type: "metadata",
    metadataType: MetadataTypes.caste,
  },
];
