"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import routes from "@/app/configs/route-paths";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { otpSchema } from "@/app/utils/validation.util";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { Button, Card, InputOtp } from "@heroui/react";
import ResendOTP from "@/app/components/shared/ResendOTP";
import useUserStore from "@/app/store/useUserStore";
import AuthWidgetSection from "../AuthWidgetSection";

const defaultValues = {
  otp: "",
  mobile: "",
};

const page = () => {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [mobile, setMobile] = useState("");
  const otpWrapRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(otpSchema),
  });

  useEffect(() => {
    const storedMobile = sessionStorage.getItem("pending_mobile");
    if (storedMobile) {
      setMobile(storedMobile);
    } else {
      router.push(routes.auth.login);
    }
  }, []);

  // Focus the first OTP segment on mount (autoFocus alone is unreliable here).
  useEffect(() => {
    const t = setTimeout(() => {
      otpWrapRef.current?.querySelector("input")?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    data.mobile = mobile;
    try {
      const response = await api.post(ENDPOINTS.AUTH.VERIFY_OTP, data);
      const result = response?.data;
      setUser(result?.user);
      localStorage.setItem("token", result?.accessToken);
      if (result?.user?.isOnboardingCompleted) {
        router.replace(routes.home);
      } else {
        router.replace(routes.onboarding.step1);
      }
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
          name="otp"
          render={({ field }) => (
            <div ref={otpWrapRef} className="w-full flex flex-col items-center">
              <label className="text-sm font-medium">Enter OTP</label>

              <InputOtp
                {...field}
                size="lg"
                length={6}
                autoFocus={true}
                isInvalid={!!errors?.otp}
                errorMessage={errors?.otp?.message}
                variant="flat"
                classNames={{
                  base: "justify-center",
                  wrapper: "w-full flex justify-between gap-2",
                  segment: "w-full",
                  input: "w-full",
                }}
              />
            </div>
          )}
        />
        <ResendOTP mobile={mobile} />

        <Button
          size="lg"
          fullWidth
          type="submit"
          radius="full"
          color="primary"
          isLoading={isSubmitting}
          className="mt-5 font-medium"
        >
          Verify OTP
        </Button>
      </form>

      <AuthWidgetSection />
    </Card>
  );
};

export default page;
