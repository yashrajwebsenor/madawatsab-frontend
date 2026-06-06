import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { SupportType } from "@/app/types/enum";
import { helpSupportSchema } from "@/app/utils/validation.util";
import { addToast, Button, Select, SelectItem, Textarea } from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";

const defaultValues = {
  description: "",
  type: SupportType.other,
};

const supportTypes = Object.entries(SupportType).map(([key, value]) => ({
  label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
  value: value,
}));

const HelpSupportForm = ({ refetch }: { refetch: () => void }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(helpSupportSchema),
  });

  const onSubmit = handleSubmit(async (data: typeof defaultValues) => {
    try {
      await api.post(ENDPOINTS.HELP_SUPPORT.CREATE, data);
      addToast({
        color: "success",
        title: "Request Submitted",
        description: "Our support team will get back to you soon.",
      });
      reset();
      refetch?.();
    } catch (error) {
      console.log(error);
    }
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-divider">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">Submit New Request</h3>
        <p className="text-default-500 text-sm">Fill out the form below to contact our support team.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="Support Type"
                placeholder="Select category"
                variant="bordered"
                labelPlacement="outside"
                errorMessage={errors.type?.message}
                isInvalid={!!errors.type}
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  field.onChange(value);
                }}
                classNames={{
                  trigger: "h-12 border-medium rounded-xl",
                  label: "font-semibold text-foreground-600 mb-1",
                }}
              >
                {supportTypes.map((type) => (
                  <SelectItem key={type.value} textValue={type.label}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
            )}
          />

          <div className="md:col-span-2">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  label="Description"
                  placeholder="Tell us more about your issue..."
                  variant="bordered"
                  labelPlacement="outside"
                  errorMessage={errors.description?.message}
                  isInvalid={!!errors.description}
                  minRows={4}
                  classNames={{
                    inputWrapper: "border-medium rounded-xl p-4",
                    label: "font-semibold text-foreground-600 mb-1",
                  }}
                />
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={isSubmitting}
            className="font-bold px-12 rounded-xl shadow-lg shadow-primary/20"
          >
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HelpSupportForm;
