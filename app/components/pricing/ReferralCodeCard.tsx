"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { MdCheckCircle, MdOutlineLocalOffer } from "react-icons/md";

export type AppliedReferral = {
  code: string;
  agentName?: string | null;
};

type Props = {
  applied: AppliedReferral | null;
  onApply: (referral: AppliedReferral) => void;
  onClear: () => void;
  /** Hidden once a plan is running — there is nothing left to buy. */
  isDisabled?: boolean;
};

/**
 * Agent referral code, entered before buying a plan.
 *
 * This is the ONLY thing that credits an agent: the code travels with the order
 * and decides who earns commission on it. Being registered by or assigned to an
 * agent does not credit them, and the code may belong to any agent — so it is
 * verified here, before payment, and the agent's name is shown back as
 * confirmation that the right person will be credited.
 */
const ReferralCodeCard = ({ applied, onApply, onClear, isDisabled }: Props) => {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a referral code first.");
      return;
    }

    try {
      setChecking(true);
      setError(null);

      const res: any = await api.get(ENDPOINTS.PAYMENTS.VALIDATE_REFERRAL, {
        params: { code: trimmed },
      });

      onApply({
        code: res?.data?.referralCode ?? trimmed,
        agentName: res?.data?.agentName ?? null,
      });
      setCode("");
    } catch (err: any) {
      setError(err?.message || "That referral code is not valid.");
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
                Referral code {applied.code} applied
              </p>
              <p className="text-xs text-default-500">
                {applied.agentName
                  ? `${applied.agentName} will be credited for this purchase.`
                  : "Your agent will be credited for this purchase."}
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
            <MdOutlineLocalOffer
              className="mt-0.5 shrink-0 text-primary"
              size={20}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Have an agent referral code?
              </p>
              <p className="text-xs text-default-500">
                Enter it before you pay so your agent is credited for this
                purchase. Optional.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <Input
              size="sm"
              className="max-w-[240px]"
              placeholder="e.g. AGENT2024"
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

export default ReferralCodeCard;
