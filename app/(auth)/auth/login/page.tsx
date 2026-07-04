"use client";

import { FiArrowRight } from "react-icons/fi";
import { addToast, Button, Card, Input } from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/app/utils/validation.util";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { useRouter } from "next/navigation";
import routes from "@/app/configs/route-paths";
import AuthWidgetSection from "../AuthWidgetSection";
import { FaPhoneAlt } from "react-icons/fa";
import { fetchToken } from "@/app/utils/firebase";

const defaultValues = {
  mobile: "",
};

const page = () => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGIN, data);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending_mobile", data.mobile);

        // Prompt for notification permission now (user just acted) and stash the
        // token so verify-otp can persist it server-side. Fire-and-forget: the
        // user spends time entering the OTP, so the token is usually ready by
        // submit; if not, the post-login sync in (app)/layout registers it.
        fetchToken()
          .then((token) => {
            if (token) localStorage.setItem("pendingFcmToken", token);
          })
          .catch(() => {});
      }

      addToast({
        title: "Success",
        color: "success",
        description: "OTP sent successfully",
      });

      router.push(routes.auth.verifyOtp);
    } catch (error) {
      console.log(error);
    }
  });

  return (
    <Card radius="lg" shadow="none" className="text-center p-5 sm:p-10">
      <h3 className="font-medium text-2xl">Sign in</h3>
      <p className="text-sm text-gray-400">Secure access to your account</p>

      <form onSubmit={onSubmit} className="my-7">
        <Controller
          control={control}
          name="mobile"
          render={({ field }) => (
            <Input
              {...field}
              size="lg"
              autoFocus
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="987432103"
              labelPlacement="outside"
              label="Enter Mobile Number"
              isInvalid={!!errors?.mobile}
              errorMessage={errors?.mobile?.message}
              startContent={<FaPhoneAlt className="text-gray-400" />}
              onChange={(ev) =>
                field.onChange(ev.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
          )}
        />

        <Button
          size="lg"
          fullWidth
          type="submit"
          radius="full"
          color="primary"
          isLoading={isSubmitting}
          endContent={<FiArrowRight />}
          className="mt-5 font-medium border-2 border-secondary"
        >
          Send OTP
        </Button>
      </form>

      <AuthWidgetSection />
    </Card>
  );
};

export default page;
