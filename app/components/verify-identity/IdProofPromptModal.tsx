"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@heroui/react";
import { FiShield } from "react-icons/fi";
import useUserStore from "@/app/store/useUserStore";
import routes from "@/app/configs/route-paths";
import IdCardAnimation from "./IdCardAnimation";

// Re-prompt cadence: after the user dismisses ("Maybe later"), wait this long
// before showing the nudge again. Persisted in localStorage so a reload/return
// doesn't reset the timer.
const REPROMPT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const DISMISS_KEY = "idProofPromptDismissedAt";

const readDismissedAt = () => {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
};

/**
 * Global "verify your identity" nudge. Mounted once in the (app) layout (only
 * for users fully past onboarding + gates). Shows an animated ID-card modal
 * inviting the user to upload an Aadhaar/ID proof, then re-appears every 10 min
 * until they submit one. Submission truth is server-side (`user.idProof`).
 */
const IdProofPromptModal = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();
  const [open, setOpen] = useState(false);

  // Already submitted -> never nag. Suppress on the upload screen itself.
  const hasSubmitted = !!user?.idProof;
  const onUploadScreen = pathname === routes.verifyIdentity;
  // Only nag paying members: the nudge comes AFTER the entry fee (enforced by
  // the (app) layout's gate redirect) and after a subscription is bought.
  // Un-subscribed users never see it.
  const hasActivePlan = !!user?.subscription?.hasActivePlan;
  const eligible = !!user && hasActivePlan && !hasSubmitted && !onUploadScreen;

  useEffect(() => {
    if (!eligible) {
      setOpen(false);
      return;
    }

    const evaluate = () => {
      if (Date.now() - readDismissedAt() >= REPROMPT_INTERVAL_MS) {
        setOpen(true);
      }
    };

    evaluate();
    const timer = window.setInterval(evaluate, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [eligible]);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  const goVerify = () => {
    // Stamp the timer too so it doesn't immediately re-open if the user lands
    // back in the app without submitting.
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
    router.push(routes.verifyIdentity);
  };

  if (!eligible) return null;

  return (
    <Modal
      isOpen={open}
      onClose={dismiss}
      placement="center"
      backdrop="blur"
      hideCloseButton
      size="sm"
    >
      <ModalContent>
        <ModalBody className="items-center gap-5 pt-8 text-center">
          <IdCardAnimation />

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-foreground">
              Get your profile verified
            </h2>
            <p className="mx-auto max-w-xs text-sm text-foreground-500">
              Upload your Aadhaar or any government ID and our team will add a
              trusted <span className="font-semibold text-primary">verified
              badge</span> to your profile. It only takes a moment and builds
              trust with your matches.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-default-100 px-3 py-1.5 text-xs text-foreground-500">
            <FiShield className="text-success" />
            Your ID is private and only reviewed by our team.
          </div>
        </ModalBody>
        <ModalFooter className="flex-col gap-2 pb-6">
          <Button
            color="primary"
            className="w-full font-semibold"
            onPress={goVerify}
          >
            Verify now
          </Button>
          <Button variant="light" className="w-full" onPress={dismiss}>
            Maybe later
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default IdProofPromptModal;
