"use client";

import { Input } from "@heroui/react";
import { Control, Controller, FieldValues, Path, useWatch } from "react-hook-form";

type SiblingCountFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  /** "underlined" matches the onboarding forms; omit for the profile forms. */
  variant?: "flat" | "underlined";
};

const countFields = [
  {
    key: "brothers",
    label: "NUMBER OF BROTHERS",
    placeholder: "Enter number of brothers",
  },
  {
    key: "marriedBrothers",
    label: "MARRIED BROTHERS",
    placeholder: "Enter married brothers",
  },
  {
    key: "sisters",
    label: "NUMBER OF SISTERS",
    placeholder: "Enter number of sisters",
  },
  {
    key: "marriedSisters",
    label: "MARRIED SISTERS",
    placeholder: "Enter married sisters",
  },
] as const;

/**
 * Siblings are captured as counts only — totals plus how many are married.
 * Unmarried is never entered; it is shown as a hint derived from the pair.
 */
const SiblingCountFields = <T extends FieldValues>({
  control,
  variant,
}: SiblingCountFieldsProps<T>) => {
  const values = useWatch({
    control,
    name: countFields.map((item) => item.key) as unknown as Path<T>[],
  });

  const [brothers, marriedBrothers, sisters, marriedSisters] = (
    (values ?? []) as unknown[]
  ).map((value) => Number(value) || 0);

  return (
    <div className="grid gap-4">
      <h3 className="text-sm font-semibold text-slate-700">Siblings</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {countFields.map((countField) => (
          <Controller
            key={countField.key}
            control={control}
            name={countField.key as Path<T>}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type="number"
                min={0}
                label={countField.label}
                variant={variant}
                labelPlacement={variant === "underlined" ? undefined : "outside"}
                placeholder={countField.placeholder}
                value={field.value === undefined ? "" : String(field.value)}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Unmarried brothers: {Math.max(brothers - marriedBrothers, 0)} · Unmarried
        sisters: {Math.max(sisters - marriedSisters, 0)}
      </p>
    </div>
  );
};

export default SiblingCountFields;
