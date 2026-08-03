"use client";

import { Card, CardBody, Radio, RadioGroup } from "@heroui/react";
import { useState } from "react";
import { LuPhone } from "react-icons/lu";
import useProfile from "@/app/hooks/useProfile";
import useUserStore from "@/app/store/useUserStore";
import { ContactPrivacy } from "@/app/types/enum";

/**
 * "Phone number privacy" control on the My Profile sidebar.
 *
 * Sits alongside the profile/gallery privacy switches but covers a different
 * surface: those hide the profile and photos, never the contact.
 */
const ContactPrivacyCard = () => {
  const user = useUserStore((s) => s.user);
  const { updateMyProfile } = useProfile();
  const [pending, setPending] = useState(false);

  // Legacy users have no field yet — they are on the purchasable default.
  const value = user?.contactPrivacy ?? ContactPrivacy.premium;

  const handleChange = async (next: string) => {
    if (pending || next === value) return;
    try {
      setPending(true);
      await updateMyProfile({ contactPrivacy: next as ContactPrivacy });
    } catch {
      // updateMyProfile toasts on failure; the radio falls back to the store
      // value on the next render, so nothing to undo here.
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full max-w-[650px] mx-auto shadow-sm border-none bg-white rounded-xl">
      <CardBody className="gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LuPhone size={18} />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-default-800">
              Phone number privacy
            </h3>
            <p className="mt-1 text-sm text-default-500">
              Choose who can see your mobile number and email.
            </p>

            <RadioGroup
              className="mt-4"
              value={value}
              isDisabled={pending}
              onValueChange={handleChange}
              aria-label="Phone number privacy"
            >
              <Radio
                value={ContactPrivacy.premium}
                description="Members with contact views can spend one to see your number. This is the default."
              >
                Premium members
              </Radio>
              <Radio
                value={ContactPrivacy.interest}
                description="Only people you've sent an interest to, or whose interest you've accepted, can see it — for free. Nobody else can unlock it, even with contact views."
              >
                Only my interests
              </Radio>
            </RadioGroup>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ContactPrivacyCard;
