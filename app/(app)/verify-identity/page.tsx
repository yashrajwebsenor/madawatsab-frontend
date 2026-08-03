"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addToast,
  Alert,
  Button,
  Chip,
  Image,
  Spinner,
} from "@heroui/react";
import { FiCheckCircle, FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import routes from "@/app/configs/route-paths";
import useUserStore from "@/app/store/useUserStore";
import useProfile from "@/app/hooks/useProfile";

const VerifyIdentityPage = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { getMyProfile } = useProfile();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submitted = !!user?.idProof;

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
    e.target.value = "";
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("photo", file);
      await api.post(ENDPOINTS.PROFILE.UPLOAD_ID_PROOF, payload);
      await getMyProfile();
      addToast({
        color: "success",
        title: "ID proof submitted",
        description: "Our team will review it shortly.",
      });
      clearFile();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not submit",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-2xl sm:text-3xl font-semibold">
            Verify your identity
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Upload a government ID so our team can add a verified badge to your
            profile.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-8 pb-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-divider bg-white p-6 sm:p-8">
          {submitted ? (
            /* ---- Already submitted: locked state ---- */
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <FiCheckCircle className="text-4xl text-success" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  You submitted your ID proof
                </h3>
                <p className="text-sm text-foreground-500">
                  Our team will review it and verify your profile. If you need
                  to change it, please contact support to have it removed first.
                </p>
              </div>

              <div className="relative w-52 overflow-hidden rounded-xl border border-divider">
                <Image
                  src={user?.idProof?.url}
                  alt="Submitted ID proof"
                  radius="none"
                  className="aspect-[4/5] w-52 object-cover"
                />
              </div>

              <Chip color="success" variant="flat" startContent={<FiCheckCircle />}>
                Submitted
              </Chip>

              <Button
                variant="flat"
                className="mt-1"
                onPress={() => router.push(routes.home)}
              >
                Back to home
              </Button>
            </div>
          ) : (
            /* ---- Upload flow ---- */
            <div className="flex flex-col gap-6">
              <Alert
                color="primary"
                variant="flat"
                title="How verification works"
                description="Pick one clear photo of your Aadhaar or any government ID. Only our review team can see it — it is never shown to other users."
                className="items-start"
              />

              <div className="flex flex-col items-center gap-4">
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={pickFile}
                />

                {preview ? (
                  <div className="relative w-56 overflow-hidden rounded-xl border border-divider">
                    <Image
                      src={preview}
                      alt="ID proof preview"
                      radius="none"
                      className="aspect-[4/5] w-56 object-cover"
                    />
                    {submitting && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
                        <Spinner size="sm" color="white" variant="gradient" />
                      </div>
                    )}
                    {!submitting && (
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="flat"
                        color="danger"
                        onPress={clearFile}
                        className="absolute right-2 top-2 z-10"
                        aria-label="Remove selected photo"
                      >
                        <IoClose size={18} />
                      </Button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex aspect-[4/5] w-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-default-300 text-default-500 transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <FiUploadCloud className="text-3xl text-primary" />
                    <span className="text-sm font-medium">
                      Choose ID photo
                    </span>
                    <span className="text-xs text-default-400">
                      from your gallery
                    </span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  color="primary"
                  className="w-full font-semibold"
                  isDisabled={!file}
                  isLoading={submitting}
                  onPress={handleSubmit}
                >
                  Submit for verification
                </Button>
                <Button
                  variant="light"
                  className="w-full"
                  isDisabled={submitting}
                  onPress={() => router.push(routes.home)}
                >
                  I&apos;ll do this later
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentityPage;
