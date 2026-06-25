"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "danger" | "primary";
  loading?: boolean;
};

/**
 * Small reusable yes/no confirmation modal for destructive actions (delete a
 * message, clear a chat). Mirrors the HeroUI Modal pattern used across the app.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "danger",
  loading = false,
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      placement="center"
      backdrop="blur"
      size="sm"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
        {description && (
          <ModalBody>
            <p className="text-sm text-foreground-600">{description}</p>
          </ModalBody>
        )}
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            {cancelText}
          </Button>
          <Button color={confirmColor} onPress={onConfirm} isLoading={loading}>
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDialog;
