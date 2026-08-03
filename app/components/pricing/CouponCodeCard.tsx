"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { MdCheckCircle, MdOutlineDiscount } from "react-icons/md";

export type AppliedCoupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
};

type Props = {
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onClear: () => void;
  /** Hidden once a plan is running — there is nothing left to discount. */
  isDisabled?: boolean;
};

/** "10% off" / "₹500 off" — how the coupon's terms read before a plan is picked. */
export const couponDiscountLabel = (coupon: AppliedCoupon) =>
  coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off`
    : `₹${coupon.discountValue.toLocaleString("en-IN")} off`;

/** Rupees, the way a price reads on a card — no trailing ".00" on whole amounts. */
export const formatInr = (value: number) =>
  value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

/**
 * What this coupon does to a given plan price.
 *
 * Mirrors the server's rule (coupon.service.ts `computeDiscount`): the saving
 * is capped so at least ₹1 stays payable, because Razorpay rejects a zero-rupee
 * order. The server still prices the order — this is the preview that lets the
 * buyer see the reduced amount before the payment sheet opens.
 */
export const couponSavingFor = (coupon: AppliedCoupon, price: number) => {
  const raw =
    coupon.discountType === "percentage"
      ? (price * coupon.discountValue) / 100
      : coupon.discountValue;

  const toMoney = (value: number) => Math.round(value * 100) / 100;
  const discountAmount = toMoney(Math.max(0, Math.min(raw, price - 1)));

  return { discountAmount, payableAmount: toMoney(price - discountAmount) };
};

/**
 * Discount coupon, applied before buying a plan.
 *
 * The code is verified here so an expired or already-used one fails before the
 * payment sheet opens. The rupee saving is computed server-side when the order
 * is created — the buyer sees the reduced amount in the Razorpay sheet — so
 * this card only states the terms.
 *
 * Each code works exactly once, across all users.
 */
const CouponCodeCard = ({ applied, onApply, onClear, isDisabled }: Props) => {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a coupon code first.");
      return;
    }

    try {
      setChecking(true);
      setError(null);

      const res: any = await api.get(ENDPOINTS.PAYMENTS.VALIDATE_COUPON, {
        params: { code: trimmed },
      });

      onApply({
        code: res?.data?.code ?? trimmed.toUpperCase(),
        discountType: res?.data?.discountType,
        discountValue: res?.data?.discountValue,
      });
      setCode("");
    } catch (err: any) {
      setError(err?.message || "That coupon code is not valid.");
    } finally {
      setChecking(false);
    }
  };

  if (isDisabled) return null;

  return (
    <div className="w-full rounded-2xl border border-default-100 bg-content1 p-5 shadow-sm">
      {applied ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <MdCheckCircle className="mt-0.5 shrink-0 text-success" size={20} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Coupon {applied.code} applied — {couponDiscountLabel(applied)}
              </p>
              <p className="text-xs text-default-500">
                Plan prices below now show your discounted amount. The same
                amount is charged on the payment screen.
              </p>
            </div>
          </div>

          <Button size="sm" variant="light" onPress={onClear}>
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <MdOutlineDiscount
              className="mt-0.5 shrink-0 text-primary"
              size={20}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Have a coupon code?
              </p>
              <p className="text-xs text-default-500">
                Apply it before you pay to get your discount. Each code can be
                used once. Optional.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <Input
              size="sm"
              className="max-w-[240px]"
              placeholder="e.g. SAVE7K3M9"
              value={code}
              onValueChange={(value) => {
                setCode(value);
                if (error) setError(null);
              }}
              isInvalid={Boolean(error)}
              errorMessage={error}
            />
            <Button
              size="sm"
              color="primary"
              className="font-medium"
              isLoading={checking}
              onPress={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponCodeCard;
