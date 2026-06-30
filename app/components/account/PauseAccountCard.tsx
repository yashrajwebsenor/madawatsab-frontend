"use client";

import { Card, CardBody, Switch } from "@heroui/react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import usePauseAccount from "@/app/hooks/usePauseAccount";

/**
 * "Account visibility" control on the My Profile sidebar. Pausing hides the
 * member from discovery & search while keeping existing chats alive; resuming
 * restores visibility. Shares state with the discover/search "paused" screen
 * via usePauseAccount (both read user.isPaused).
 */
const PauseAccountCard = () => {
  const { isPaused, pending, setPaused } = usePauseAccount();

  return (
    <Card className="w-full max-w-[650px] mx-auto shadow-sm border-none bg-white rounded-xl">
      <CardBody className="gap-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isPaused
                ? "bg-amber-100 text-amber-600"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isPaused ? <LuEyeOff size={18} /> : <LuEye size={18} />}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-default-800">
                Account visibility
              </h3>
              <Switch
                size="sm"
                color="warning"
                isSelected={isPaused}
                isDisabled={pending}
                onValueChange={(next) => setPaused(next)}
                aria-label="Pause account"
              />
            </div>

            <p className="mt-1 text-sm text-default-500">
              {isPaused ? (
                <>
                  Your account is <span className="font-medium text-amber-600">paused</span>.
                  You won&apos;t appear in discovery or search, and you can&apos;t
                  browse new profiles. People you&apos;re already connected with can
                  still see your profile and message you. Turn this off to resume.
                </>
              ) : (
                <>
                  Pause your account to hide your profile from discovery and search.
                  Your existing connections can still see your profile and keep
                  chatting — you just stop appearing to new people.
                </>
              )}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PauseAccountCard;
