"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import PriceCard from "@/app/components/cards/PriceCard";
import ReferralCodeCard, {
  AppliedReferral,
} from "@/app/components/pricing/ReferralCodeCard";
import CouponCodeCard, {
  AppliedCoupon,
} from "@/app/components/pricing/CouponCodeCard";
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
import { BsGem } from "react-icons/bs";
import clsx from "clsx";

const planTypeLabels: Record<string, string> = {
  basic: "Basic",
  silver: "Silver",
  gold: "Gold",
  assisted: "Assisted",
  unlimited: "Till You Marry",
  vvip: "VVIP",
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

// VVIP is a tier, not a duration — it gets its own tab rather than a card in the
// duration grids (where, as a 5th plan, it stranded itself on its own row).
// The tab key is a sentinel: it is never a valid PlanDurationTypes, so every
// duration the API needs is read from the plan's own `pricing.duration`.
const VVIP_TAB = "vvip" as const;
type TabKey = PlanDurationTypes | typeof VVIP_TAB;

// The durations VVIP is sold in. The VVIP tab shows one card per duration.
const VVIP_DURATIONS = [
  PlanDurationTypes.quarterly,
  PlanDurationTypes.half_yearly,
];

// Identifies a purchasable row = plan + billing cycle. The VVIP tab renders one
// plan twice (once per duration), so the plan id alone is not unique on screen.
const planKey = (plan: Plan) => `${plan._id}-${plan.pricing.duration}`;

const VvipTabTitle = () => (
  <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#8a6d1f] via-[#E9C349] to-[#8a6d1f] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow ring-1 ring-white/40">
    <BsGem size={10} className="shrink-0" />
    VVIP
    {/* Gold sheen sweep — same treatment as the VVIP profile/plan cards. */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <span className="block h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-safe:animate-vvip-sheen" />
    </span>
  </span>
);

const page = () => {
  const [activeTab, setActiveTab] = useState<TabKey>(PlanDurationTypes.quarterly);
  const isVvipTab = activeTab === VVIP_TAB;
  const { Razorpay } = useRazorpay();
  const { user } = useUserStore();
  const { getMyProfile } = useProfile();
  const { hasActivePlan, subscription, contactViewBalance } =
    useSubscriptionAccess();
  // Keyed by plan + duration, not plan id: the VVIP tab lists the *same* plan
  // once per billing cycle, so an id alone would spin both cards at once.
  const [activatingPlanKey, setActivatingPlanKey] = useState<string | null>(
    null,
  );
  // Verified agent referral code for this purchase. It is what credits an agent
  // with commission — an assigned agent earns nothing without their code here.
  const [referral, setReferral] = useState<AppliedReferral | null>(null);
  // Single-use discount code. Verified on apply; the actual rupee saving is
  // computed server-side when the order is created.
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

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
    queryKey: ["plans", activeTab],
    queryFn: async () => {
      // VVIP tab: the API is keyed by duration, so gather the tier across each
      // duration it's sold in and keep only the VVIP plans.
      if (isVvipTab) {
        const responses = await Promise.all(
          VVIP_DURATIONS.map((d) =>
            api.get(ENDPOINTS.PLANS.GET_ALL, { params: { duration: d } }),
          ),
        );
        return responses
          .flatMap((res: any) => (res?.data || []) as Plan[])
          .filter((plan) => plan.isVvip);
      }

      const res: any = await api.get(ENDPOINTS.PLANS.GET_ALL, {
        params: {
          duration: activeTab,
        },
      });
      // VVIP lives on its own tab — keep it out of the duration grids.
      return ((res?.data || []) as Plan[]).filter((plan) => !plan.isVvip);
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
        // The coupon is spent and the referral is per-purchase — clear both so
        // neither carries into a later checkout.
        setCoupon(null);
        setReferral(null);
        await getMyProfile();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setActivatingPlanKey(null);
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
      setActivatingPlanKey(planKey(plan));
      // Duration comes from the plan's own pricing, not the selected tab — the
      // VVIP tab isn't a duration and shows both of VVIP's billing cycles.
      const res = await api.post(ENDPOINTS.PAYMENTS.CREATE, {
        paymentType: PaymentTypes.plan,
        planId: plan._id,
        planDuration: plan.pricing.duration,
        // Attribution is fixed on the order, before any money moves.
        ...(referral?.code && { referralCode: referral.code }),
        // The server prices the discount in and returns the reduced order.
        ...(coupon?.code && { couponCode: coupon.code }),
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
          ondismiss: () => setActivatingPlanKey(null),
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
      setActivatingPlanKey(null);
    }
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-2xl sm:text-3xl font-semibold">Plans & Pricing</h2>
          <p className="text-gray-300 text-sm mt-1">
            Manage your connections and view profiles who showed interest in
            you.
          </p>
        </div>
      </PageHeaderWrapper>

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

                <div className="flex flex-col items-start gap-1 sm:items-end">
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

            <ReferralCodeCard
              applied={referral}
              onApply={setReferral}
              onClear={() => setReferral(null)}
              isDisabled={hasActivePlan}
            />

            <CouponCodeCard
              applied={coupon}
              onApply={setCoupon}
              onClear={() => setCoupon(null)}
              isDisabled={hasActivePlan}
            />

            <div className="flex w-full flex-col items-center gap-4">
              <h1 className="w-full text-2xl sm:text-4xl font-black text-foreground text-center">
                Choose the perfect plan for you
              </h1>
              <Tabs
                radius="full"
                className="mt-4 max-w-full overflow-x-auto"
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as TabKey)}
              >
                {durationOptions.map((item) => (
                  <Tab key={item.value} title={item.title} className="px-8" />
                ))}
                <Tab
                  key={VVIP_TAB}
                  className="px-2"
                  aria-label="VVIP plans"
                  title={<VvipTabTitle />}
                />
              </Tabs>
            </div>

            {isLoading ? (
              <div className="w-full">
                <PriceGridSkeleton />
              </div>
            ) : !data?.length ? (
              // Every plan on this billing cycle can be switched off by admin,
              // which would otherwise leave a bare tab under the heading.
              <div className="w-full rounded-2xl border border-dashed border-default-200 py-16 text-center">
                <p className="font-semibold text-foreground">
                  No plans available right now
                </p>
                <p className="mt-1 text-sm text-default-500">
                  {isVvipTab
                    ? "VVIP membership is not open for purchase at the moment."
                    : "This billing cycle is not open for purchase. Try another one."}
                </p>
              </div>
            ) : (
              // VVIP tab shows only its billing cycles (2 cards) — keep them
              // centred and readable instead of stretched across 4 columns.
              <div
                className={clsx(
                  "grid gap-6 w-full sm:grid-cols-2",
                  isVvipTab ? "mx-auto max-w-3xl" : "lg:grid-cols-4",
                )}
              >
                {data?.map((item) => (
                  <PriceCard
                    key={planKey(item)}
                    {...item}
                    isActivating={activatingPlanKey === planKey(item)}
                    isDisabled={
                      activatingPlanKey !== null &&
                      activatingPlanKey !== planKey(item)
                    }
                    hasActivePlan={hasActivePlan}
                    coupon={coupon}
                    isCurrentPlan={
                      hasActivePlan &&
                      subscription?.planType === item.type &&
                      subscription?.planDuration === item.pricing.duration
                    }
                    onActivate={() => handleActivate(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default page;
