"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRazorpay } from "react-razorpay";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiCheckCircle,
  FiClock,
  FiPhoneCall,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import APP_CONFIG from "@/app/configs/app-config";
import useUserStore from "@/app/store/useUserStore";
import useConfigStore from "@/app/store/useConfigStore";
import useProfile from "@/app/hooks/useProfile";
import useCountryCityStates from "@/app/hooks/useCountryCityStates";
import { Gender, PaymentTypes } from "@/app/types/enum";
import CommonUtils from "@/app/utils/common.utils";
import noAutofill from "@/app/utils/no-autofill";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";

type Step = "loading" | "no-subscription" | "has-agent" | "pending" | "intro" | "form" | "done";

const BENEFITS = [
  {
    icon: FiUserCheck,
    title: "Dedicated Matchmaking Agent",
    description: "A personal agent who understands your requirement and finds matches for you.",
  },
  {
    icon: FiPhoneCall,
    title: "Direct Phone Contact",
    description: "Your agent calls you directly to discuss your preferences.",
  },
  {
    icon: FiShield,
    title: "Verified Recommendations",
    description: "Profiles are reviewed and recommended by the admin team, not just algorithms.",
  },
];

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { config } = useConfigStore();
  const { getMyProfile } = useProfile();
  const { Razorpay } = useRazorpay();
  const { countries, states, cities, fetchCountries, fetchStates, fetchCities } =
    useCountryCityStates();

  const [step, setStep] = useState<Step>("loading");
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [preferredAgentGender, setPreferredAgentGender] = useState<string>("");

  const fee = Number(config?.requestAgentFee ?? 0);
  // VVIP gets a dedicated agent as part of the plan: no fee screen, and the
  // ticket is usually already raised (auto-created at plan activation), so the
  // page lands on "pending" straight away.
  const isVvip = !!user?.subscription?.capabilities?.isVvip;

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      if (user.assignedAgent) {
        setStep("has-agent");
        return;
      }

      if (!user.subscription?.hasActivePlan) {
        setStep("no-subscription");
        return;
      }

      try {
        const res: any = await api.get(ENDPOINTS.AGENTS.REQUEST_STATUS);
        // Backend resolves the step so a refresh after paying (but before
        // submitting the form) resumes at "form" instead of charging again.
        const resolved = res?.data?.step;
        if (resolved === "pending" || resolved === "form") {
          setStep(resolved);
        } else {
          setStep(isVvip ? "form" : "intro");
        }
      } catch (error) {
        console.log(error);
        setStep(isVvip ? "form" : "intro");
      }
    };

    init();
  }, [user]);

  useEffect(() => {
    fetchCountries();
  }, []);

  const handlePay = async () => {
    try {
      setPaying(true);
      const res = await api.post(ENDPOINTS.PAYMENTS.CREATE, {
        paymentType: PaymentTypes.request_agent,
      });
      const order = res?.data;

      const options: any = {
        order_id: order?.id,
        amount: order?.amount,
        currency: order?.currency,
        name: APP_CONFIG.APP_NAME,
        key: APP_CONFIG.RAZORPAY_KEY_ID,
        description: "Request an Agent",
        image: user?.profilePhoto?.url || "/assets/images/logo.png",
        prefill: {
          name: user?.fullName || "",
          phone: user?.mobile || "",
        },
        theme: { color: "#1f5c59" },
        handler: (response: any) => handleVerify(response),
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.log(error);
    } finally {
      setPaying(false);
    }
  };

  const handleVerify = async (data: any) => {
    try {
      setPaying(true);
      const res = await api.post(ENDPOINTS.PAYMENTS.VERIFY, {
        razorpayPaymentId: data?.razorpay_payment_id,
        razorpayOrderId: data?.razorpay_order_id,
        razorpaySignature: data?.razorpay_signature,
      });

      if (res?.data?.success) {
        addToast({
          color: "success",
          title: "Payment successful",
          description: "Now tell us your agent preference.",
        });
        setStep("form");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setPaying(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await api.post(ENDPOINTS.AGENTS.REQUEST, {
        pincode: pincode.trim() || undefined,
        countryId: country ? Number(country) : undefined,
        stateId: state ? Number(state) : undefined,
        cityId: city ? Number(city) : undefined,
        preferredAgentGender: preferredAgentGender || undefined,
      });
      await getMyProfile();
      setStep("done");
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            Request For Agent
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            Get a dedicated matchmaking agent to help find your perfect match.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-8 max-w-2xl">
        {step === "has-agent" && (
          <Card shadow="none" className="p-8 text-center">
            <FiCheckCircle className="mx-auto text-success text-4xl mb-3" />
            <h3 className="text-lg font-bold">You already have an agent</h3>
            <p className="text-sm text-gray-500 mt-1">
              Check your profile for your assigned agent's contact details.
            </p>
          </Card>
        )}

        {step === "no-subscription" && (
          <Card shadow="none" className="p-8 text-center">
            <FiShield className="mx-auto text-primary text-4xl mb-3" />
            <h3 className="text-lg font-bold">Subscription Required</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              You need an active subscription plan before requesting an agent.
            </p>
            <Button as={Link} href={routes.pricing} color="primary">
              View Plans
            </Button>
          </Card>
        )}

        {step === "pending" && (
          <Card shadow="none" className="p-8 text-center">
            <FiClock className="mx-auto text-warning text-4xl mb-3" />
            <h3 className="text-lg font-bold">Request Pending</h3>
            <p className="text-sm text-gray-500 mt-1">
              {isVvip
                ? "Your VVIP plan includes a dedicated agent. Your request is already with the admin team and an agent will be assigned soon."
                : "Your request has been received. The admin will assign you an agent soon."}
            </p>
          </Card>
        )}

        {step === "intro" && (
          <Card shadow="none" className="p-6 sm:p-8">
            <div className="grid gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
                    <b.icon size={22} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{b.title}</h4>
                    <p className="text-sm text-gray-500">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-primary text-white rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80 mb-2">
                One-time Fee
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-xl opacity-90">Rs.</span>
                <span className="text-5xl font-bold leading-none">{fee}</span>
              </div>
            </div>

            <Button
              size="lg"
              color="primary"
              className="w-full mt-6 font-bold"
              isLoading={paying}
              onPress={handlePay}
            >
              Pay & Continue
            </Button>
          </Card>
        )}

        {step === "form" && (
          <Card shadow="none" className="p-6 sm:p-8">
            <h3 className="text-lg font-bold mb-1">Almost there</h3>
            <p className="text-sm text-gray-500 mb-6">
              {isVvip
                ? "A dedicated agent is included in your VVIP plan — no extra fee. Every field is optional; submit as is and the admin will pick the best agent for you."
                : "Tell us your preference so we can find the right agent for you. Every field is optional."}
            </p>

            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-3 items-start">
                <Autocomplete
                  label="COUNTRY (OPTIONAL)"
                  labelPlacement="outside"
                  placeholder="Select Country"
                  inputProps={noAutofill("request-agent-country")}
                  selectedKey={country || null}
                  onSelectionChange={(key) => {
                    const val = (key as string) || "";
                    setCountry(val);
                    setState("");
                    setCity("");
                    if (val) fetchStates(Number(val));
                  }}
                >
                  {countries?.map((item) => (
                    <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                  ))}
                </Autocomplete>

                <Autocomplete
                  label="STATE/PROVINCE (OPTIONAL)"
                  labelPlacement="outside"
                  placeholder="Select State"
                  inputProps={noAutofill("request-agent-state")}
                  isDisabled={!country}
                  selectedKey={state || null}
                  onSelectionChange={(key) => {
                    const val = (key as string) || "";
                    setState(val);
                    setCity("");
                    if (val) fetchCities(Number(country), Number(val));
                  }}
                >
                  {states?.map((item) => (
                    <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                  ))}
                </Autocomplete>

                <Autocomplete
                  label="CITY (OPTIONAL)"
                  labelPlacement="outside"
                  placeholder="Select City"
                  inputProps={noAutofill("request-agent-city")}
                  isDisabled={!state}
                  selectedKey={city || null}
                  onSelectionChange={(key) => setCity((key as string) || "")}
                >
                  {cities?.map((item) => (
                    <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>

              <Input
                label="PINCODE (OPTIONAL)"
                labelPlacement="outside"
                placeholder="e.g. 400001"
                description="Prefer an agent from your local area? Enter your pincode."
                {...noAutofill("request-agent-pincode")}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />

              <Select
                label="PREFERRED AGENT GENDER (OPTIONAL)"
                labelPlacement="outside"
                placeholder="No preference"
                selectedKeys={
                  preferredAgentGender ? new Set([preferredAgentGender]) : new Set([])
                }
                onChange={(e) => setPreferredAgentGender(e.target.value)}
              >
                {Object.values(Gender).map((item) => (
                  <SelectItem key={item}>
                    {CommonUtils.formatTitle(item)}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Button
              size="lg"
              color="primary"
              className="w-full mt-8 font-bold"
              isLoading={submitting}
              onPress={handleSubmit}
            >
              Submit Request
            </Button>
          </Card>
        )}

        {step === "done" && (
          <Card shadow="none" className="p-8 text-center">
            <FiCheckCircle className="mx-auto text-success text-4xl mb-3" />
            <h3 className="text-lg font-bold">Request Submitted</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              We'll assign you an agent soon and notify you once they're ready
              to help.
            </p>
            <Button color="primary" onPress={() => router.push(routes.home)}>
              Back to Home
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default page;
