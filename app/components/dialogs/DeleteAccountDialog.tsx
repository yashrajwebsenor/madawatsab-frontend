"use client";

import { useState } from "react";
import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { LuTriangleAlert } from "react-icons/lu";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import CommonUtils from "@/app/utils/common.utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// The user must type this exact word to arm the irreversible delete button.
const CONFIRM_WORD = "DELETE";

const DeleteAccountDialog = ({ isOpen, onClose }: Props) => {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleClose = () => {
    if (submitting) return;
    setConfirmText("");
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    try {
      setSubmitting(true);
      await api.delete(ENDPOINTS.PROFILE.DELETE_ACCOUNT);
      // Account is gone — tear down the session and bounce to login. logout()
      // unsubscribes FCM, disconnects the socket, clears storage + user store,
      // then redirects.
      await CommonUtils.logout();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not delete account",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      placement="center"
      backdrop="blur"
      isDismissable={!submitting}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-danger">
          <LuTriangleAlert className="text-xl" />
          Delete account
        </ModalHeader>
        <ModalBody className="gap-4">
          <p className="text-sm text-default-600">
            This permanently deletes your account. Your profile, matches, and
            chats will be removed and you will be signed out. This action
            <span className="font-semibold"> cannot be undone</span>.
          </p>
          <p className="text-sm text-default-600">
            If you sign up again later with the same number, a brand-new empty
            account is created — none of your current data carries over.
          </p>

          <Input
            label={`Type ${CONFIRM_WORD} to confirm`}
            placeholder={CONFIRM_WORD}
            variant="bordered"
            labelPlacement="outside"
            value={confirmText}
            onValueChange={setConfirmText}
            autoComplete="off"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={submitting}>
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
            isLoading={submitting}
            isDisabled={!canDelete}
          >
            Delete my account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteAccountDialog;
