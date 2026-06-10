import { LuMoonStar } from "react-icons/lu";
import Section from "./Section";
import {
  ReligiousFrequency,
  YesNo,
  YesNoSometimes,
} from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { religiousDetailsSchema } from "@/app/utils/validation.util";
import { Button, Select, SelectItem } from "@heroui/react";
import useUserStore from "@/app/store/useUserStore";
import useProfile from "@/app/hooks/useProfile";
import { useEffect } from "react";

const defaultValues = {
  offerNamaz: "",
  reciteQuran: "",
  keepRoza: "",
  giveZakat: "",
  performedHajjUmrah: "",
  wearHijab: "",
};

const toOptions = (enumObj: Record<string, string>) =>
  Object.values(enumObj).map((value) => ({
    key: value,
    title: CommonUtils.formatTitle(value),
  }));

const ReligiousSection = () => {
  const { user } = useUserStore();
  const { updateMyProfile } = useProfile();

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(religiousDetailsSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        offerNamaz: user.offerNamaz || "",
        reciteQuran: user.reciteQuran || "",
        keepRoza: user.keepRoza || "",
        giveZakat: user.giveZakat || "",
        performedHajjUmrah: user.performedHajjUmrah || "",
        wearHijab: user.wearHijab || "",
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (data) => {
    // Only send fields the user actually set, so untouched enum fields are
    // never overwritten with an empty value.
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== ""),
    );
    await updateMyProfile(payload);
  });

  // Hijab is only relevant for female profiles.
  const visibleFields = fields.filter(
    (field) => field.name !== "wearHijab" || user?.gender === "female",
  );

  return (
    <Section
      icon={<LuMoonStar size={20} className="text-primary" />}
      title="5. Religious Practice"
      description="Share how you observe your faith (all optional)."
    >
      <div className="grid items-center sm:grid-cols-2 gap-5 w-full">
        {visibleFields.map((field) => {
          const name = field.name as keyof typeof defaultValues;
          const error = errors[name];

          return (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field: inputProps }) => (
                <Select
                  label={field.label}
                  isInvalid={!!error}
                  labelPlacement="outside"
                  errorMessage={error?.message}
                  placeholder={field.placeholder}
                  selectedKeys={new Set([inputProps.value ?? ""])}
                  onChange={(e) => inputProps.onChange(e.target.value)}
                >
                  {field.options.map((item) => (
                    <SelectItem key={item.key}>{item.title}</SelectItem>
                  ))}
                </Select>
              )}
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

export default ReligiousSection;

const fields = [
  {
    name: "offerNamaz",
    label: "OFFER NAMAZ",
    placeholder: "Select frequency",
    options: toOptions(ReligiousFrequency),
  },
  {
    name: "reciteQuran",
    label: "RECITE QURAN",
    placeholder: "Select frequency",
    options: toOptions(ReligiousFrequency),
  },
  {
    name: "keepRoza",
    label: "KEEP ROZA",
    placeholder: "Select an option",
    options: toOptions(YesNo),
  },
  {
    name: "giveZakat",
    label: "GIVE ZAKAT",
    placeholder: "Select frequency",
    options: toOptions(ReligiousFrequency),
  },
  {
    name: "performedHajjUmrah",
    label: "PERFORMED HAJJ / UMRAH",
    placeholder: "Select an option",
    options: toOptions(YesNo),
  },
  {
    name: "wearHijab",
    label: "WEAR HIJAB",
    placeholder: "Select an option",
    options: toOptions(YesNoSometimes),
  },
];
