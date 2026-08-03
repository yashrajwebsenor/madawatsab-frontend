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
import { MdOutlineDiscount } from "react-icons/md";
import clsx from "clsx";
import {
  AppliedCoupon,
  couponSavingFor,
  formatInr,
} from "@/app/components/pricing/CouponCodeCard";

interface PriceCardProps extends Plan {
  onActivate?: (plan: Plan) => void;
  isActivating?: boolean;
  isDisabled?: boolean;
  // True when this exact plan is the user's currently active subscription.
  isCurrentPlan?: boolean;
  // True when the user already has *any* active plan (blocks re-purchase).
  hasActivePlan?: boolean;
  // Coupon applied on the pricing page, if any — the card prices it in so the
  // buyer sees the reduced amount here, not only in the Razorpay sheet.
  coupon?: AppliedCoupon | null;
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
    isVvip,
    onActivate,
    isActivating,
    isDisabled,
    isCurrentPlan,
    hasActivePlan,
    coupon,
  } = props;

  // Coupon preview for *this* plan's price. The server recomputes it on the
  // order — this only keeps the card honest about what will be charged.
  const saving = coupon
    ? couponSavingFor(coupon, pricing.discountedPrice)
    : null;
  const payablePrice = saving ? saving.payableAmount : pricing.discountedPrice;

  // Runtime capabilities that actually control access — shown separately from
  // marketing copy so the user sees exactly what the plan unlocks. Only the
  // capabilities a plan includes are listed (no crossed-out "not included" rows).
  const capabilities = [
    { label: "VVIP status & gold profile card", enabled: isVvip },
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
          : isVvip
            ? "border-2 border-[#E9C349] bg-gradient-to-b from-[#fdf7e6] to-[#f5e6b8] shadow-sm"
            : "border border-divider shadow-sm",
      )}
    >
      {/* Same gold sheen as the VVIP profile card, so the tier is recognisable
          from the pricing page onward. */}
      {isVvip && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
        >
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent motion-safe:animate-vvip-sheen" />
        </div>
      )}
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
              ₹{formatInr(payablePrice)}
            </span>
            {/* With a coupon the struck-out price is the plan's own price —
                that is the number the discount is measured against. */}
            {saving ? (
              <span className="text-default-400 line-through text-lg font-medium ml-2">
                ₹{formatInr(pricing.discountedPrice)}
              </span>
            ) : (
              pricing.originalPrice > pricing.discountedPrice && (
                <span className="text-default-400 line-through text-lg font-medium ml-2">
                  ₹{formatInr(pricing.originalPrice)}
                </span>
              )
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

          {saving && coupon && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-success">
              <MdOutlineDiscount size={14} className="shrink-0" />
              <span className="text-xs font-semibold">
                {coupon.code} applied — you save ₹
                {formatInr(saving.discountAmount)}
              </span>
            </div>
          )}
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
