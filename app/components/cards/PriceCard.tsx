import { Plan } from "@/app/types/types";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
} from "@heroui/react";
import { HiCheck } from "react-icons/hi2";
import clsx from "clsx";

interface PriceCardProps extends Plan {
  onActivate?: (plan: Plan) => void;
  isActivating?: boolean;
  isDisabled?: boolean;
  // True when this exact plan is the user's currently active subscription.
  isCurrentPlan?: boolean;
  // True when the user already has *any* active plan (blocks re-purchase).
  hasActivePlan?: boolean;
}

const PriceCard = (props: PriceCardProps) => {
  const {
    name,
    tagline,
    features,
    pricing,
    hasAdvancedFilters,
    canMessage,
    canBlock,
    hasProfileBoost,
    hasRelationshipManager,
    onActivate,
    isActivating,
    isDisabled,
    isCurrentPlan,
    hasActivePlan,
  } = props;

  // Runtime capabilities that actually control access — shown separately from
  // marketing copy so the user sees exactly what the plan unlocks. Only the
  // capabilities a plan includes are listed (no crossed-out "not included" rows).
  const capabilities = [
    { label: "Send messages (chat)", enabled: canMessage },
    { label: "Advanced matching filters", enabled: hasAdvancedFilters },
    { label: "Profile boost", enabled: hasProfileBoost },
    { label: "Relationship manager", enabled: hasRelationshipManager },
    { label: "Block users", enabled: canBlock },
  ].filter((cap) => cap.enabled);

  // Buy disabled while any plan is active (backend rejects re-purchase anyway).
  const buyDisabled = !!hasActivePlan || !!isDisabled;

  return (
    <Card
      className={clsx(
        "relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
        isCurrentPlan
          ? "border-2 border-success/40 shadow-success/10"
          : "border border-divider shadow-sm",
      )}
    >
      {isCurrentPlan ? (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-success text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
            Current Plan
          </div>
        </div>
      ) : (
        pricing.badgeText && (
          <div className="absolute top-0 right-0 z-20">
            <div className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
              {pricing.badgeText}
            </div>
          </div>
        )
      )}

      <CardHeader className="flex flex-col items-start px-6 pt-10 pb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {name}
          </h3>
        </div>
        <p className="text-default-500 text-sm mt-2 leading-relaxed font-medium">
          {tagline}
        </p>
      </CardHeader>

      <CardBody className="px-6 py-0 flex flex-col gap-8">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-foreground tracking-tighter">
              ₹{pricing.discountedPrice}
            </span>
            {pricing.originalPrice > pricing.discountedPrice && (
              <span className="text-default-400 line-through text-lg font-medium ml-2">
                ₹{pricing.originalPrice}
              </span>
            )}
          </div>
          <span className="text-default-400 text-xs font-bold uppercase mt-1 tracking-widest">
            Per{" "}
            {pricing.duration === "quarterly"
              ? "3 Months"
              : pricing.duration === "half_yearly"
                ? "6 Months"
                : "User"}
          </span>
        </div>

        <Divider className="opacity-60" />

        {/* Runtime capabilities — these control real access. */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-default-400">
            Plan Includes
          </p>
          <ul className="space-y-3">
            {pricing.contactViewLimit > 0 && (
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-primary/10 p-1 rounded-full text-primary">
                  <HiCheck className="text-[10px]" />
                </div>
                <p className="text-sm text-default-600 leading-tight">
                  View{" "}
                  <span className="font-bold text-foreground">
                    {pricing.contactViewLimit}
                  </span>{" "}
                  Verified Contacts
                </p>
              </li>
            )}

            {capabilities.map((cap) => (
              <li key={cap.label} className="flex items-start gap-3">
                <div className="mt-0.5 bg-primary/10 p-1 rounded-full text-primary">
                  <HiCheck className="text-[10px]" />
                </div>
                <p className="text-sm leading-tight text-default-600">
                  {cap.label}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Marketing features stay, kept visually distinct from capabilities. */}
        {features.length > 0 && (
          <div className="space-y-4 mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-default-400">
              Highlights
            </p>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <div className="mt-0.5 bg-primary/10 p-1 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <HiCheck className="text-[10px]" />
                  </div>
                  <p className="text-sm text-default-600 leading-tight">
                    {feature}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>

      <CardFooter className="px-6 pb-10 pt-4">
        <Button
          fullWidth
          color={isCurrentPlan ? "success" : "primary"}
          isLoading={isActivating}
          isDisabled={buyDisabled}
          variant="flat"
          onPress={() => onActivate?.(props)}
          className={clsx(
            "font-bold text-xs uppercase tracking-widest h-14",
            isCurrentPlan
              ? "bg-success/10 text-success"
              : "bg-primary/5 text-primary hover:bg-primary hover:text-white",
          )}
          size="lg"
        >
          {isCurrentPlan
            ? "Active Plan"
            : hasActivePlan
              ? "Plan Already Running"
              : `Activate ${name}`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PriceCard;
