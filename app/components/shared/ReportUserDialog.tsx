"use client";

import { useState } from "react";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { IoClose } from "react-icons/io5";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { AttachmentTypes, ReportReason } from "@/app/types/enum";
import PhotoUploader from "./PhotoUploader";

const reasonOptions = Object.entries(ReportReason).map(([key, value]) => ({
  label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
  value,
}));

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  // When true this is a "Block & Report" — the backend blocks in the same call.
  withBlock?: boolean;
  // Fired after a successful submit (e.g. so the caller can flip blocked state).
  onSubmitted?: () => void;
};

const ReportUserDialog = ({
  isOpen,
  onClose,
  userId,
  withBlock,
  onSubmitted,
}: Props) => {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason("");
    setDescription("");
    setPhoto(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const uploadEvidence = async (): Promise<string[]> => {
    if (!photo) return [];
    const payload = new FormData();
    payload.append("file", photo);
    payload.append("type", AttachmentTypes.report_evidence);
    const res: any = await api.post(ENDPOINTS.ATTACHMENTS.UPLOAD, payload);
    const id = res?.data?._id;
    return id ? [id] : [];
  };

  const handleSubmit = async () => {
    if (!reason) {
      addToast({ color: "danger", title: "Please select a reason" });
      return;
    }
    if (!description.trim()) {
      addToast({ color: "danger", title: "Please add a description" });
      return;
    }

    try {
      setSubmitting(true);
      const attachmentIds = await uploadEvidence();
      await api.post(ENDPOINTS.REPORTS.CREATE, {
        reportedUserId: userId,
        reason,
        description: description.trim(),
        attachmentIds,
        block: !!withBlock,
      });
      addToast({
        color: "success",
        title: withBlock ? "Blocked & reported" : "Report submitted",
        description: "Thanks — our team will review this profile.",
      });
      reset();
      onSubmitted?.();
      onClose();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not submit report",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {withBlock ? "Block & Report user" : "Report user"}
        </ModalHeader>
        <ModalBody className="gap-4">
          <Select
            label="Reason"
            placeholder="Select a reason"
            variant="bordered"
            labelPlacement="outside"
            selectedKeys={reason ? [reason] : []}
            onSelectionChange={(keys) =>
              setReason((Array.from(keys)[0] as string) ?? "")
            }
          >
            {reasonOptions.map((r) => (
              <SelectItem key={r.value} textValue={r.label}>
                {r.label}
              </SelectItem>
            ))}
          </Select>

          <Textarea
            label="Description"
            placeholder="Tell us what's wrong with this profile..."
            variant="bordered"
            labelPlacement="outside"
            minRows={4}
            value={description}
            onValueChange={setDescription}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground-600">
              Evidence (optional)
            </span>
            {photo ? (
              <div className="flex items-center gap-3 rounded-xl border border-divider p-2 pr-3">
                <img
                  src={URL.createObjectURL(photo)}
                  alt="evidence"
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                  {photo.name}
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setPhoto(null)}
                  aria-label="Remove photo"
                >
                  <IoClose size={18} />
                </Button>
              </div>
            ) : (
              <PhotoUploader onChange={(file) => setPhoto(file)} />
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={submitting}>
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={handleSubmit}
            isLoading={submitting}
          >
            {withBlock ? "Block & Report" : "Submit report"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReportUserDialog;
