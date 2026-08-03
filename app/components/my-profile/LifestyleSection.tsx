import { LuHeart } from "react-icons/lu";
import Section from "./Section";
import { DietPreference, YesNo, YesNoSometimes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { lifestyleDetailsSchema } from "@/app/utils/validation.util";
import { Button, Select, SelectItem } from "@heroui/react";
import useUserStore from "@/app/store/useUserStore";
import useProfile from "@/app/hooks/useProfile";
import { useEffect } from "react";
import { hobbiesList, musicTypes, sportsList } from "@/app/configs/data";
import useMetadataOptions from "@/app/hooks/useMetadataOptions";
import { MetadataTypes } from "@/app/types/enum";

const defaultValues = {
  dietPreference: "",
  smoke: "",
  drink: "",
  cookFood: "",
  languagesKnown: [] as string[],
  sports: [] as string[],
  hobbies: [] as string[],
  musics: [] as string[],
};

const toOptions = (enumObj: Record<string, string>) =>
  Object.values(enumObj).map((value) => ({
    key: value,
    title: CommonUtils.formatTitle(value),
  }));

const LifestyleSection = () => {
  const { user } = useUserStore();
  const { updateMyProfile } = useProfile();
  // Languages are admin-managed metadata, not a hard-coded list.
  const { options: languageOptions } = useMetadataOptions(
    MetadataTypes.language,
  );
  const fields = buildFields(languageOptions);

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(lifestyleDetailsSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        dietPreference: user.dietPreference || "",
        smoke: user.smoke || "",
        drink: user.drink || "",
        cookFood: user.cookFood || "",
        languagesKnown: user.languagesKnown || [],
        sports: user.sports || [],
        hobbies: user.hobbies || [],
        musics: user.musics || [],
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (data) => {
    // Drop untouched empty values so a blank single-select never overwrites a
    // stored enum; multi-selects are sent as-is so they can be cleared.
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, value]) =>
        Array.isArray(value) ? true : value !== "",
      ),
    );
    await updateMyProfile(payload);
  });

  return (
    <Section
      icon={<LuHeart size={20} className="text-primary" />}
      title="6. Lifestyle & Interests"
      description="Your habits, languages and what you enjoy (all optional)."
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
                if (field.type === "multiselect") {
                  const selected: string[] = Array.isArray(inputProps.value)
                    ? inputProps.value
                    : [];

                  return (
                    <Select
                      label={field.label}
                      selectionMode="multiple"
                      isInvalid={!!error}
                      labelPlacement="outside"
                      errorMessage={error?.message as string}
                      placeholder={field.placeholder}
                      selectedKeys={new Set(selected)}
                      onSelectionChange={(keys) =>
                        inputProps.onChange(Array.from(keys as Set<string>))
                      }
                    >
                      {field.options.map((item) => (
                        <SelectItem key={item.value}>{item.title}</SelectItem>
                      ))}
                    </Select>
                  );
                }

                return (
                  <Select
                    label={field.label}
                    isInvalid={!!error}
                    labelPlacement="outside"
                    errorMessage={error?.message as string}
                    placeholder={field.placeholder}
                    selectedKeys={new Set([(inputProps.value as string) ?? ""])}
                    onChange={(e) => inputProps.onChange(e.target.value)}
                  >
                    {field.options.map((item) => (
                      <SelectItem key={item.value}>{item.title}</SelectItem>
                    ))}
                  </Select>
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

export default LifestyleSection;

const enumOptions = (enumObj: Record<string, string>) =>
  toOptions(enumObj).map((item) => ({ value: item.key, title: item.title }));

// `languages` is fetched from the metadata API by the component; everything
// else is a fixed enum or a static list, so only that one is passed in.
const buildFields = (languages: { title: string; value: string }[]) => [
  {
    name: "dietPreference",
    label: "DIET PREFERENCE",
    type: "select",
    placeholder: "Select diet preference",
    options: enumOptions(DietPreference),
  },
  {
    name: "languagesKnown",
    label: "LANGUAGES YOU KNOW",
    type: "multiselect",
    placeholder: "Select languages",
    options: languages,
  },
  {
    name: "smoke",
    label: "SMOKE",
    type: "select",
    placeholder: "Select an option",
    options: enumOptions(YesNo),
  },
  {
    name: "drink",
    label: "DRINK",
    type: "select",
    placeholder: "Select an option",
    options: enumOptions(YesNo),
  },
  {
    name: "cookFood",
    label: "COOK FOOD",
    type: "select",
    placeholder: "Select an option",
    options: enumOptions(YesNoSometimes),
  },
  {
    name: "sports",
    label: "SPORTS",
    type: "multiselect",
    placeholder: "Select sports",
    options: sportsList,
  },
  {
    name: "hobbies",
    label: "HOBBIES",
    type: "multiselect",
    placeholder: "Select hobbies",
    options: hobbiesList,
  },
  {
    name: "musics",
    label: "MUSIC",
    type: "multiselect",
    placeholder: "Select music types",
    options: musicTypes,
  },
];
