import routes from "@/app/configs/route-paths";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";
import { PlanDurationTypes } from "@/app/types/enum";
import { Button, Card, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { IoIosLock } from "react-icons/io";
import { IoReceiptOutline } from "react-icons/io5";
import { MdWorkspacePremium } from "react-icons/md";

const MembershipCard = () => {
  const router = useRouter();
  const { hasActivePlan, subscription, contactViewBalance, capabilities } =
    useSubscriptionAccess();

  const isUnlimited =
    subscription?.planDuration === PlanDurationTypes.unlimited;

  // Only the capabilities the active plan includes are shown as chips.
  const capabilityChips = [
    { label: "VVIP Status", enabled: capabilities?.isVvip },
    { label: "Messaging", enabled: capabilities?.canMessage },
    { label: "Advanced Filters", enabled: capabilities?.hasAdvancedFilters },
    { label: "Profile Boost", enabled: capabilities?.hasProfileBoost },
    {
      label: "Relationship Manager",
      enabled: capabilities?.hasRelationshipManager,
    },
    { label: "Block Users", enabled: capabilities?.canBlock },
  ].filter((c) => c.enabled);

  return (
    <Card shadow="sm" className="w-full p-5 border border-default-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 text-primary p-2 rounded-lg">
          <MdWorkspacePremium size={20} />
        </div>
        <div>
          <p className="font-semibold">Membership</p>
          <p className="text-xs text-default-400">Your current plan & wallet</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-default-50 p-3 mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-default-400">
            Plan
          </span>
          <span className="font-bold text-foreground">
            {hasActivePlan ? subscription?.planName : "No active plan"}
          </span>
          {hasActivePlan &&
            (isUnlimited ? (
              <span className="text-xs text-success font-medium">
                Lifetime • Never expires
              </span>
            ) : (
              subscription?.expiryDate && (
                <span className="text-xs text-default-500">
                  Expires{" "}
                  {new Date(subscription.expiryDate).toLocaleDateString()}
                </span>
              )
            ))}
        </div>
        <Chip
          size="sm"
          variant="flat"
          color={hasActivePlan ? "success" : "default"}
        >
          {hasActivePlan ? "Active" : "Inactive"}
        </Chip>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-default-50 p-3 mb-4">
        <span className="text-sm text-default-600">Contact Views Remaining</span>
        <span className="text-xl font-black text-primary">
          {contactViewBalance}
        </span>
      </div>

      {capabilityChips.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
            Includes
          </p>
          <div className="flex flex-wrap gap-2">
            {capabilityChips.map((c) => (
              <Chip key={c.label} size="sm" variant="flat" color="primary">
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <Button
        fullWidth
        color="primary"
        variant={hasActivePlan ? "flat" : "solid"}
        startContent={!hasActivePlan && <IoIosLock size={16} />}
        onPress={() => router.push(routes.pricing)}
      >
        {hasActivePlan ? "View Plans" : "Subscribe Now"}
      </Button>

      <Button
        fullWidth
        variant="light"
        className="mt-2"
        startContent={<IoReceiptOutline size={16} />}
        onPress={() => router.push(routes.billing)}
      >
        Billing &amp; Invoices
      </Button>

      {!hasActivePlan && contactViewBalance > 0 && (
        <p className="text-xs text-default-500 text-center mt-2">
          You still have {contactViewBalance} contact view
          {contactViewBalance === 1 ? "" : "s"} from a past plan.
        </p>
      )}
    </Card>
  );
};

export default MembershipCard;
