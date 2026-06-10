"use client";

import useConfigStore from "@/app/store/useConfigStore";
import { MdLock, MdLockOpen } from "react-icons/md";
import { addToast, Button, Card } from "@heroui/react";
import { useRazorpay } from "react-razorpay";
import { useEffect, useState } from "react";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { PaymentTypes } from "@/app/types/enum";
import APP_CONFIG from "@/app/configs/app-config";
import useUserStore from "@/app/store/useUserStore";
import { useRouter } from "next/navigation";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import Image from "next/image";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { Razorpay } = useRazorpay();
  const { config } = useConfigStore();
  const { getMyProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const amount = Number(config?.appEntryFee ?? 0);
  const entryFeeEnabled = config?.entryFeeEnabled !== "false";

  useEffect(() => {
    // Leave the paywall if the user already has access, or the admin turned the
    // entry fee off (free entry).
    if (user?.hasAppAccess || !entryFeeEnabled) {
      router.push(routes.home);
    }
  }, [user?.hasAppAccess, entryFeeEnabled]);

  const handleCreateOrder = async () => {
    if (amount < 1) {
      addToast({
        color: "danger",
        title: "Error",
        description: "Amount must be greater than 1",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(ENDPOINTS.PAYMENTS.CREATE, {
        amount,
        paymentType: PaymentTypes.entry_fee,
      });

      const order = res?.data;

      const options: any = {
        order_id: order?.id,
        amount: order?.amount,
        currency: order?.currency,
        name: APP_CONFIG.APP_NAME,
        key: APP_CONFIG.RAZORPAY_KEY_ID,
        description: "Platform Entry Fee",
        image: user?.profilePhoto?.url || "/assets/images/logo.png",
        prefill: {
          name: user?.fullName || "",
          phone: user?.mobile || "",
        },
        theme: {
          color: "#1f5c59",
        },
        handler: (response: any) => handleVerifyPayment(response),
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (data: any) => {
    try {
      setLoading(true);
      const res = await api.post(ENDPOINTS.PAYMENTS.VERIFY, {
        razorpayPaymentId: data?.razorpay_payment_id,
        razorpayOrderId: data?.razorpay_order_id,
        razorpaySignature: data?.razorpay_signature,
      });

      if (res.data.success) {
        addToast({
          color: "success",
          title: "Success",
          description: "Payment successful",
        });
        await getMyProfile();
        router.push(routes.spinReward);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="inset-0 bg-white/10 absolute z-10" />

      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/images/onboarding-bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative w-full flex flex-col lg:flex-row min-h-screen items-start justify-center gap-10 py-10 z-40 mx-auto container px-4">
        <OnboardingLeftSection
          title="Unlock Your Full  Potential"
          description="Pay a small platform fee to gain permanent access."
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={6} />

          <div className="mt-10 flex flex-col items-center w-full">
            <div className="bg-[#eefcf4] p-3 rounded-xl mb-6">
              <MdLock size={40} className="text-primary" />
            </div>

            <div className="bg-primary text-white px-10 py-5 rounded-[40px] w-full max-w-sm flex flex-col items-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80 mb-2">
                Total Amount
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-medium opacity-90">Rs.</span>
                <span className="text-6xl font-bold leading-none">
                  {amount}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              color="primary"
              isLoading={loading}
              onPress={handleCreateOrder}
              endContent={<MdLockOpen size={20} />}
              className="w-full max-w-xs font-bold text-lg h-14 shadow-lg shadow-primary/30"
            >
              Pay Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default page;
