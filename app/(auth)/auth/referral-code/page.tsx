"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import routes from "@/app/configs/route-paths";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { addToast, Button, Card, Input } from "@heroui/react";
import AuthWidgetSection from "../AuthWidgetSection";

const page = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goToOnboarding = () => router.replace(routes.onboarding.step1);

  const handleApply = async () => {
    if (!code.trim()) return;

    try {
      setSubmitting(true);
      await api.post(ENDPOINTS.AGENTS.APPLY_REFERRAL, { code: code.trim() });
      addToast({
        title: "Success",
        color: "success",
        description: "Referral code applied",
      });
      goToOnboarding();
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card radius="lg" shadow="none" className="text-center p-5 sm:p-10">
      <h3 className="font-medium text-2xl">Have an Agent's Referral Code?</h3>
      <p className="text-sm text-gray-400">
        If an agent referred you to Madawatsab, enter their code below. You
        can only do this once, before completing your profile.
      </p>

      <div className="my-7">
        <Input
          size="lg"
          autoFocus
          labelPlacement="outside"
          label="Referral Code"
          placeholder="e.g. AGENT2024"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <Button
          size="lg"
          fullWidth
          radius="full"
          color="primary"
          isDisabled={!code.trim()}
          isLoading={submitting}
          className="mt-5 font-medium"
          onPress={handleApply}
        >
          Apply Referral Code
        </Button>

        <Button
          size="lg"
          fullWidth
          radius="full"
          variant="light"
          className="mt-2 font-medium"
          isDisabled={submitting}
          onPress={goToOnboarding}
        >
          Skip
        </Button>
      </div>

      <AuthWidgetSection />
    </Card>
  );
};

export default page;
