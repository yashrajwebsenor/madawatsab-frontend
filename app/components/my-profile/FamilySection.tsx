import { MdOutlineFamilyRestroom } from "react-icons/md";
import Section from "./Section";
import SiblingCountFields from "../shared/SiblingCountFields";
import { FamilyTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { aboutFamilySchema } from "@/app/utils/validation.util";
import { useEffect, useState } from "react";
import { FormSkeleton } from "../shared/Skeletons";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";

const defaultValues = {
  familyType: FamilyTypes.joint,
  fatherName: "",
  fatherOccupation: "",
  fatherContact: "",
  motherName: "",
  motherOccupation: "",
  motherContact: "",
  aboutFamily: "",
  brothers: 0,
  marriedBrothers: 0,
  sisters: 0,
  marriedSisters: 0,
};

const FamilySection = () => {
  const [loading, setLoading] = useState(false);

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(aboutFamilySchema),
  });

  const getDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(ENDPOINTS.FAMILY.GET);
      const result = res?.data;
      if (res?.data) {
        reset({
          familyType: result?.familyType,
          fatherName: result?.fatherName,
          fatherOccupation: result?.fatherOccupation,
          fatherContact: result?.fatherContact,
          motherName: result?.motherName,
          motherOccupation: result?.motherOccupation,
          motherContact: result?.motherContact,
          aboutFamily: result?.aboutFamily,
          brothers: result?.brothers ?? 0,
          marriedBrothers: result?.marriedBrothers ?? 0,
          sisters: result?.sisters ?? 0,
          marriedSisters: result?.marriedSisters ?? 0,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  const onSubmit = handleSubmit(async (data: typeof defaultValues) => {
    try {
      await api.put(ENDPOINTS.FAMILY.UPDATE, {
        ...data,
        brothers: Number(data.brothers) || 0,
        marriedBrothers: Number(data.marriedBrothers) || 0,
        sisters: Number(data.sisters) || 0,
        marriedSisters: Number(data.marriedSisters) || 0,
      });
      await getDetails();
    } catch (error) {
      console.log(error);
    }
  });

  return (
    <Section
      icon={<MdOutlineFamilyRestroom size={20} className="text-primary" />}
      title="4. Family Background"
      description="Information about your family origins."
    >
      {loading ? (
        <FormSkeleton />
      ) : (
        <div className="grid gap-5">
          <div className="grid items-center sm:grid-cols-2 gap-5 w-full">
            {fields.map((field) => {
              const name = field.name as Exclude<
                keyof typeof defaultValues,
                "brothers" | "marriedBrothers" | "sisters" | "marriedSisters"
              >;
              const error = errors[name];

              return (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field: inputProps }) => {
                    if (field.type === "select") {
                      return (
                        <Select
                          {...inputProps}
                          label={field.label}
                          labelPlacement="outside"
                          isInvalid={!!error?.message}
                          errorMessage={error?.message}
                          placeholder={field.placeholder}
                          selectedKeys={new Set([inputProps.value ?? ""])}
                          onChange={(e) => inputProps.onChange(e.target.value)}
                        >
                          {(field.options ?? []).map((option) => (
                            <SelectItem key={option.value}>
                              {option.title}
                            </SelectItem>
                          ))}
                        </Select>
                      );
                    }

                    return (
                      <Input
                        {...inputProps}
                        label={field.label}
                        labelPlacement="outside"
                        isInvalid={!!error?.message}
                        errorMessage={error?.message}
                        placeholder={field.placeholder}
                      />
                    );
                  }}
                />
              );
            })}
          </div>

          <Controller
            name="aboutFamily"
            control={control}
            render={({ field: inputProps }) => (
              <Textarea
                minRows={8}
                {...inputProps}
                label="ABOUT FAMILY"
                labelPlacement="outside"
                placeholder="Enter About Family"
                isInvalid={!!errors.aboutFamily?.message}
                errorMessage={errors.aboutFamily?.message}
              />
            )}
          />

          <SiblingCountFields control={control} />
        </div>
      )}

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

export default FamilySection;

const fields = [
  {
    name: "familyType",
    label: "FAMILY TYPE",
    type: "select",
    options: Object.values(FamilyTypes).map((item) => ({
      value: item,
      title: CommonUtils.formatTitle(item),
    })),
    placeholder: "Select Family Type",
  },
  {
    name: "fatherName",
    label: "FATHERS NAME",
    type: "text",
    placeholder: "Enter Father Name",
  },
  {
    name: "fatherOccupation",
    label: "FATHERS OCCUPATION",
    type: "text",
    placeholder: "Enter Father Occupation",
  },
  {
    name: "fatherContact",
    label: "FATHERS CONTACT NUMBER (OPTIONAL)",
    type: "text",
    placeholder: "Enter Father Contact Number",
  },
  {
    name: "motherName",
    label: "MOTHERS NAME",
    type: "text",
    placeholder: "Enter Mother Name",
  },
  {
    name: "motherOccupation",
    label: "MOTHERS OCCUPATION",
    type: "text",
    placeholder: "Enter Mother Occupation",
  },
  {
    name: "motherContact",
    label: "MOTHERS CONTACT NUMBER (OPTIONAL)",
    type: "text",
    placeholder: "Enter Mother Contact Number",
  },
];
