import { LuGraduationCap } from "react-icons/lu";
import Section from "./Section";
import { MetadataTypes } from "@/app/types/enum";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { educationDetailsSchema } from "@/app/utils/validation.util";
import { Button, Input } from "@heroui/react";
import useUserStore from "@/app/store/useUserStore";
import useProfile from "@/app/hooks/useProfile";
import { useEffect } from "react";
import MetadataDropdown from "../shared/MetadataDropdown";

const defaultValues = {
  qualification: "",
  occupation: "",
  workSector: "",
  annualIncome: "",
};

const EducationSection = () => {
  const { user } = useUserStore();
  const { updateMyProfile } = useProfile();

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(educationDetailsSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        qualification: user.qualification || "",
        occupation: user.occupation || "",
        workSector: user.workSector || "",
        annualIncome: user.annualIncome || "",
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await updateMyProfile(data);
  });

  return (
    <Section
      icon={<LuGraduationCap size={20} className="text-primary" />}
      title="3. Education & Profession"
      description="Your academic and career background."
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
                if (field.component === "metadata") {
                  return (
                    <MetadataDropdown
                      label={field.label}
                      isInvalid={!!error}
                      labelPlacement="outside"
                      errorMessage={error?.message}
                      placeholder={field.placeholder}
                      metadataType={field.metadataType!}
                      // Occupation is the one list a user may fill with a value
                      // we don't carry in metadata.
                      allowsCustomValue={
                        field.metadataType === MetadataTypes.occupation
                      }
                      selectedKey={
                        inputProps.value ? String(inputProps.value) : ""
                      }
                      onSelectionChange={(key) => inputProps.onChange(key)}
                    />
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

export default EducationSection;

const fields = [
  {
    name: "qualification",
    label: "EDUCATION LEVEL",
    placeholder: "Enter your highest education",
    component: "metadata",
    metadataType: MetadataTypes.qualification,
  },
  {
    name: "occupation",
    label: "OCCUPATION",
    placeholder: "Select or type your occupation",
    component: "metadata",
    metadataType: MetadataTypes.occupation,
  },
  {
    name: "annualIncome",
    label: "ANNUAL INCOME",
    placeholder: "Select your annual income",
    component: "metadata",
    metadataType: MetadataTypes.annual_income,
  },
  {
    name: "workSector",
    label: "WORK SECTOR",
    placeholder: "Select your work sector",
    component: "metadata",
    metadataType: MetadataTypes.employed_in,
  },
];
