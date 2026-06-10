"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import PriceCard from "@/app/components/cards/PriceCard";
import { PriceGridSkeleton } from "@/app/components/shared/Skeletons";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import APP_CONFIG from "@/app/configs/app-config";
import useProfile from "@/app/hooks/useProfile";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";
import useUserStore from "@/app/store/useUserStore";
import { PaymentTypes, PlanDurationTypes } from "@/app/types/enum";
import { Plan } from "@/app/types/types";
import { addToast, Tab, Tabs } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRazorpay } from "react-razorpay";

const planTypeLabels: Record<string, string> = {
  basic: "Basic",
  silver: "Silver",
  gold: "Gold",
  assisted: "Assisted",
  unlimited: "Till You Marry",
};

const durationOptions = [
  {
    value: PlanDurationTypes.quarterly,
    title: "3 months",
  },
  {
    value: PlanDurationTypes.half_yearly,
    title: "6 months",
  },
  {
    value: PlanDurationTypes.unlimited,
    title: "Unlimited",
  },
];

const page = () => {
  const [duration, setDuration] = useState(PlanDurationTypes.quarterly);
  const { Razorpay } = useRazorpay();
  const { user } = useUserStore();
  const { getMyProfile } = useProfile();
  const { hasActivePlan, subscription, contactViewBalance } =
    useSubscriptionAccess();
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);

  const currentPlanName = hasActivePlan
    ? subscription?.planName &&
      subscription.planName !== "Active Plan" &&
      subscription.planName !== "No Plan"
      ? subscription.planName
      : planTypeLabels[subscription?.planType ?? ""] || "Active Plan"
    : "No active plan";

  const expiryTerm =
    subscription?.planDuration === PlanDurationTypes.unlimited
      ? "Lifetime \u2022 Never expires"
      : subscription?.expiryDate
        ? `Expires ${new Date(subscription.expiryDate).toLocaleDateString()}`
        : "-";

  // Refresh subscription state on mount so a lazily-expired plan reflects here
  // (persisted store can still claim an active plan after server expiry).
  useEffect(() => {
    getMyProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["plans", duration],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.PLANS.GET_ALL, {
        params: {
          duration,
        },
      });
      return (res?.data || []) as Plan[];
    },
  });

  const handleVerifyPayment = async (response: any) => {
    try {
      const res = await api.post(ENDPOINTS.PAYMENTS.VERIFY, {
        razorpayPaymentId: response?.razorpay_payment_id,
        razorpayOrderId: response?.razorpay_order_id,
        razorpaySignature: response?.razorpay_signature,
      });

      if (res.data.success) {
        addToast({
          color: "success",
          title: "Success",
          description: res.data.message || "Plan activated successfully",
        });
        await getMyProfile();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setActivatingPlanId(null);
    }
  };

  const handleActivate = async (plan: Plan) => {
    // Backend rejects re-purchase while a plan is active; guard the UI too.
    if (hasActivePlan) {
      addToast({
        color: "warning",
        title: "Plan already active",
        description: "You already have an active plan running.",
      });
      return;
    }

    try {
      setActivatingPlanId(plan._id);
      // Amount is derived server-side from the plan + duration; we only send ids.
      const res = await api.post(ENDPOINTS.PAYMENTS.CREATE, {
        paymentType: PaymentTypes.plan,
        planId: plan._id,
        planDuration: duration,
      });

      const order = res?.data;

      const options: any = {
        order_id: order?.id,
        amount: order?.amount,
        currency: order?.currency,
        name: APP_CONFIG.APP_NAME,
        key: APP_CONFIG.RAZORPAY_KEY_ID,
        description: `${plan.name} Plan`,
        image: user?.profilePhoto?.url || "/assets/images/logo.png",
        prefill: {
          name: user?.fullName || "",
          phone: user?.mobile || "",
        },
        theme: {
          color: "#1f5c59",
        },
        handler: (response: any) => handleVerifyPayment(response),
        modal: {
          ondismiss: () => setActivatingPlanId(null),
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.log(error);
      addToast({
        color: "danger",
        title: "Could not start payment",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
      setActivatingPlanId(null);
    }
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-3xl font-semibold">Plans & Pricing</h2>
          <p className="text-gray-300 text-sm mt-1">
            Manage your connections and view profiles who showed interest in
            you.
          </p>
        </div>
      </PageHeaderWrapper>

      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PriceGridSkeleton />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-7 items-center">
            {/* Membership summary band */}
            <div className="w-full rounded-2xl border border-default-100 bg-content1 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                      Current Membership
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {currentPlanName}
                    </span>
                  </div>

                  {hasActivePlan && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                        Expiry Term
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          subscription?.planDuration ===
                          PlanDurationTypes.unlimited
                            ? "text-success"
                            : "text-default-500"
                        }`}
                      >
                        {expiryTerm}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                    Contact Views Remaining
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {contactViewBalance}
                  </span>
                  {!hasActivePlan && contactViewBalance > 0 && (
                    <span className="text-xs text-default-500">
                      You still have {contactViewBalance} contact view
                      {contactViewBalance === 1 ? "" : "s"} available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <h1 className="text-4xl font-black text-foreground text-center">
                Choose the perfect plan for you
              </h1>
              <Tabs
                radius="full"
                className="mt-4"
                selectedKey={duration}
                onSelectionChange={(key) =>
                  setDuration(key as PlanDurationTypes)
                }
              >
                {durationOptions.map((item) => (
                  <Tab key={item.value} title={item.title} className="px-8" />
                ))}
              </Tabs>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
              {data?.map((item) => (
                <PriceCard
                  key={item._id}
                  {...item}
                  isActivating={activatingPlanId === item._id}
                  isDisabled={
                    activatingPlanId !== null && activatingPlanId !== item._id
                  }
                  hasActivePlan={hasActivePlan}
                  isCurrentPlan={
                    hasActivePlan &&
                    subscription?.planType === item.type &&
                    subscription?.planDuration === duration
                  }
                  onActivate={() => handleActivate(item)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
