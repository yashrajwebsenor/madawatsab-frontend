"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import PhotoGridCard from "@/app/components/cards/PhotoGridCard";
import OnboardingContinueButton from "@/app/components/onboarding/OnboardingContinueButton";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import PhotoUploader from "@/app/components/shared/PhotoUploader";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import useUserStore from "@/app/store/useUserStore";
import { Photo } from "@/app/types/types";
import { AttachmentStatus } from "@/app/types/enum";
import { addToast, Alert, Card, Switch } from "@heroui/react";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const page = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { updateMyProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<Photo | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.profilePhoto) setProfilePhoto(user.profilePhoto);
    if (user.photos?.length) setOtherPhotos(user.photos);
    setIsPrivate(user.isPrivate);
  }, [user]);

  const previewUrl = (photo: Photo) =>
    photo._id ? photo.url : URL.createObjectURL(photo.url as any);

  const handleProfileSelect = (file: File) => {
    setProfilePhoto({ _id: "", url: file as any });
  };

  const handleRemoveProfile = async () => {
    try {
      setLoading(true);
      if (profilePhoto?._id) {
        await api.delete(ENDPOINTS.PROFILE.DELETE_PHOTO(profilePhoto._id));
      }
      setProfilePhoto(null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const MAX_OTHER_PHOTOS = 5;

  const handleOtherSelect = (files: File[]) => {
    setOtherPhotos((prev) => {
      const remaining = MAX_OTHER_PHOTOS - prev.length;
      if (remaining <= 0) return prev;
      const additions = files
        .slice(0, remaining)
        .map((file) => ({ _id: "", url: file as any }));
      return [...prev, ...additions];
    });
  };

  const handleRemoveOther = async (photo: Photo, index: number) => {
    try {
      setLoading(true);
      if (photo._id) {
        await api.delete(ENDPOINTS.PROFILE.DELETE_PHOTO(photo._id));
      }
      setOtherPhotos((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!profilePhoto) {
      addToast({
        title: "Profile photo required",
        color: "warning",
        description: "Please add a profile photo to continue.",
      });
      return;
    }

    try {
      setLoading(true);
      setUploading(true);

      // Upload (replace) the main profile photo if a new file was picked.
      if (!profilePhoto._id) {
        const payload = new FormData();
        payload.append("photo", profilePhoto.url as any);
        await api.post(ENDPOINTS.PROFILE.UPLOAD_PROFILE_PHOTO, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Upload any newly added gallery photos.
      const newOthers = otherPhotos.filter((photo) => !photo._id);
      if (newOthers.length) {
        const payload = new FormData();
        newOthers.forEach((photo) => payload.append("photos", photo.url as any));
        await api.post(ENDPOINTS.PROFILE.UPLOAD_MULTIPLE_PHOTOS, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await updateMyProfile({
        isPrivate,
        isOnboardingCompleted: true,
      });

      addToast({
        title: "Success",
        color: "success",
        description: "Photos uploaded successfully",
      });

      router.push(routes.onboarding.family);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="inset-0 bg-white/10 absolute z-10" />

      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/images/onboarding-bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative w-full flex flex-col lg:flex-row min-h-screen items-start justify-center gap-10 py-10 z-40 mx-auto container px-4">
        <OnboardingLeftSection
          goBack
          title="Add your photos to get matches"
          description="Profiles with photos receive significantly more interest. Choose a clear, recent picture where your face is visible to make a great first impression."
        />

        <Card
          shadow="none"
          className="max-w-[600px] w-full p-5 sm:p-10 text-center"
        >
          <OnboardingHeader step={4} />

          <div className="text-left mt-10">
              {/* Profile photo (single, required) */}
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Profile Photo
              </h3>
              <div className="grid gap-6 grid-cols-2 md:grid-cols-4 w-full mb-6">
                {profilePhoto ? (
                  <PhotoGridCard
                    onRemove={handleRemoveProfile}
                    url={previewUrl(profilePhoto)}
                    uploading={uploading && !profilePhoto._id}
                  />
                ) : (
                  <div className="col-span-2 md:col-span-4">
                    <PhotoUploader onChange={handleProfileSelect} />
                  </div>
                )}
              </div>

              {/* Other photos (gallery, optional) */}
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Other Photos
              </h3>
              <div className="grid gap-6 grid-cols-2 md:grid-cols-4 w-full mb-6">
                {otherPhotos?.map((photo, i) => (
                  <PhotoGridCard
                    key={i}
                    onRemove={() => handleRemoveOther(photo, i)}
                    url={previewUrl(photo)}
                    pending={photo.status === AttachmentStatus.pending}
                    uploading={uploading && !photo._id}
                  />
                ))}
              </div>

              {otherPhotos?.length < MAX_OTHER_PHOTOS && (
                <PhotoUploader multiple onChangeMultiple={handleOtherSelect} />
              )}

              <Alert
                color="primary"
                variant="flat"
                title="Profile Photo Tip"
                className="items-start mt-3"
                description="Your profile photo is the main picture shown across the app. Other photos give matches a fuller picture of you."
              />

              {profilePhoto && (
                <div className="mt-8 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <Switch
                    isSelected={isPrivate}
                    onValueChange={setIsPrivate}
                    classNames={{
                      base: clsx(
                        "inline-flex flex-row-reverse w-full max-w-full items-center",
                        "justify-between cursor-pointer rounded-lg gap-2 border-2 border-transparent",
                      ),
                      wrapper: "h-7 w-[52px] p-1 overflow-visible",
                      thumb: clsx(
                        "w-5 h-5 shadow-md",
                        "group-data-[selected=true]:ml-6",
                      ),
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-medium font-semibold">
                        Make profile private
                      </p>
                      <p className="text-tiny text-default-400">
                        Only people you match with or like can see your full
                        profile.
                      </p>
                    </div>
                  </Switch>
                </div>
              )}

              {profilePhoto && (
                <OnboardingContinueButton
                  title="UPLOAD YOUR PHOTOS"
                  onPress={handleUpload}
                  isLoading={loading}
                  className="mt-5"
                />
              )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default page;
