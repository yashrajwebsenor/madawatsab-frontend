"use client";

import { useState } from "react";
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useDisclosure,
} from "@heroui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdBlock, MdOutlineReport } from "react-icons/md";
import { FiUnlock } from "react-icons/fi";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import ReportUserDialog from "./ReportUserDialog";

type Props = {
  userId: string;
  isBlockedByMe?: boolean;
  // Called after a block/unblock so the parent can update its local state.
  onBlockChange?: (blocked: boolean) => void;
  iconSize?: number;
  triggerClassName?: string;
};

const UserActionsMenu = ({
  userId,
  isBlockedByMe,
  onBlockChange,
  iconSize = 20,
  triggerClassName,
}: Props) => {
  const [working, setWorking] = useState(false);
  // Whether the open report dialog should also block (Block & Report).
  const [reportWithBlock, setReportWithBlock] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleBlock = async () => {
    try {
      setWorking(true);
      await api.post(ENDPOINTS.BLOCKS.CREATE, { blockedUserId: userId });
      addToast({ color: "success", title: "User blocked" });
      onBlockChange?.(true);
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not block",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setWorking(false);
    }
  };

  const handleUnblock = async () => {
    try {
      setWorking(true);
      await api.delete(ENDPOINTS.BLOCKS.REMOVE(userId));
      addToast({ color: "success", title: "User unblocked" });
      onBlockChange?.(false);
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not unblock",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setWorking(false);
    }
  };

  const openReport = (withBlock: boolean) => {
    setReportWithBlock(withBlock);
    onOpen();
  };

  const onAction = (key: React.Key) => {
    switch (key) {
      case "block":
        return handleBlock();
      case "unblock":
        return handleUnblock();
      case "report":
        return openReport(false);
      case "block-report":
        return openReport(true);
    }
  };

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            isLoading={working}
            aria-label="User actions"
            className={triggerClassName}
          >
            <BsThreeDotsVertical size={iconSize} className="text-gray-600" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="User actions" onAction={onAction}>
          {[
            isBlockedByMe ? (
              <DropdownItem key="unblock" startContent={<FiUnlock size={18} />}>
                Unblock
              </DropdownItem>
            ) : (
              <DropdownItem key="block" startContent={<MdBlock size={18} />}>
                Block
              </DropdownItem>
            ),
            <DropdownItem
              key="report"
              startContent={<MdOutlineReport size={18} />}
            >
              Report
            </DropdownItem>,
            ...(isBlockedByMe
              ? []
              : [
                  <DropdownItem
                    key="block-report"
                    className="text-danger"
                    color="danger"
                    startContent={<MdOutlineReport size={18} />}
                  >
                    Block &amp; Report
                  </DropdownItem>,
                ]),
          ]}
        </DropdownMenu>
      </Dropdown>

      <ReportUserDialog
        isOpen={isOpen}
        onClose={onClose}
        userId={userId}
        withBlock={reportWithBlock}
        onSubmitted={() => {
          if (reportWithBlock) onBlockChange?.(true);
        }}
      />
    </>
  );
};

export default UserActionsMenu;
