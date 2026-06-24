"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { TiHeartFullOutline } from "react-icons/ti";
import routes from "@/app/configs/route-paths";
import useUpgradeModalStore from "@/app/store/useUpgradeModalStore";

// Globally-mounted (Providers.tsx) upgrade prompt. State lives in
// useUpgradeModalStore so the axios interceptor can open it from anywhere
// (e.g. when a basic user hits the daily interest limit).
const UpgradePlanDialog = () => {
  const router = useRouter();
  const { isOpen, message, close } = useUpgradeModalStore();

  const handleViewPlans = () => {
    close();
    router.push(routes.pricing);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-primary">
          <TiHeartFullOutline className="text-xl" />
          Upgrade your plan
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={close}>
            Maybe later
          </Button>
          <Button color="primary" onPress={handleViewPlans}>
            View plans
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpgradePlanDialog;
