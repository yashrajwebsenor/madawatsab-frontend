"use client";

import { Button } from "@heroui/react";
import { LuEyeOff, LuMessageCircle } from "react-icons/lu";
import { useRouter } from "next/navigation";
import usePauseAccount from "@/app/hooks/usePauseAccount";
import routes from "@/app/configs/route-paths";

/**
 * Full-width placeholder shown on the discover & search screens while the
 * current user has paused their account. Explains why the feed is empty and
 * offers a one-tap resume (plus a shortcut back to existing chats).
 */
const PausedDiscoveryNotice = () => {
  const { pending, setPaused } = usePauseAccount();
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <LuEyeOff size={30} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-default-800">
          Your account is paused
        </h2>
        <p className="mt-2 text-sm text-default-500">
          While paused, your profile is hidden from discovery and search, so you
          can&apos;t browse new profiles. You can still chat with the people
          you&apos;re already connected with. Resume your account to discover more
          profiles.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          color="primary"
          radius="full"
          isLoading={pending}
          onPress={() => setPaused(false)}
        >
          Resume account
        </Button>
        <Button
          variant="flat"
          radius="full"
          startContent={<LuMessageCircle size={18} />}
          onPress={() => router.push(routes.message.index)}
        >
          Go to messages
        </Button>
      </div>
    </div>
  );
};

export default PausedDiscoveryNotice;
