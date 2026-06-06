"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import PhotoGridCard from "@/app/components/cards/PhotoGridCard";
import OnboardingContinueButton from "@/app/components/onboarding/OnboardingContinueButton";
import OnboardingHeader from "@/app/components/onboarding/OnboardingHeader";
import { PhotoGridSkeleton } from "@/app/components/shared/Skeletons";
import OnboardingLeftSection from "@/app/components/shared/OnboardingLeftSection";
import PhotoUploader from "@/app/components/shared/PhotoUploader";
import routes from "@/app/configs/route-paths";
import useProfile from "@/app/hooks/useProfile";
import useUserStore from "@/app/store/useUserStore";
import { Photo } from "@/app/types/types";
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
  const [isPrivate, setIsPrivate] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (user?.photos?.length) {
      setPhotos(user?.photos);
      setIsPrivate(user?.isPrivate);
    }
  }, [user]);

  const handlePhotoSelect = (file: File) => {
    const temp = [...(photos ?? [])];
    temp.push({
      _id: "",
      url: file as any,
    });
    setPhotos(temp);
  };

  const handleRemove = async (photo: Photo, index: number) => {
    try {
      setLoading(true);
      if (photo._id) {
        await api.delete(ENDPOINTS.PROFILE.DELETE_PHOTO(photo._id));
      }
      const temp = [...(photos ?? [])];
      temp.splice(index, 1);
      setPhotos(temp);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const newRecords = photos?.filter((photo) => !photo._id);

    try {
      if (newRecords?.length) {
        const payload = new FormData();

        newRecords.forEach((ev) => {
          payload.append("photos", ev.url);
        });

        setLoading(true);

        await api.post(ENDPOINTS.PROFILE.UPLOAD_MULTIPLE_PHOTOS, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        await updateMyProfile({
          isPrivate,
          isOnboardingCompleted: true,
        });

        addToast({
          title: "Success",
          color: "success",
          description: "Photos uploaded successfully",
        });
      }

      router.push(routes.onboarding.family);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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

          {loading ? (
            <div className="mt-10">
              <PhotoGridSkeleton count={4} />
            </div>
          ) : (
            <div className="text-left mt-10">
              <div className="grid gap-6 grid-cols-2 md:grid-cols-4 w-full mb-6">
                {photos?.map((photo, i) => (
                  <PhotoGridCard
                    key={i}
                    onRemove={() => handleRemove(photo, i)}
                    url={
                      photo._id
                        ? photo.url
                        : URL.createObjectURL(photo.url as any)
                    }
                  />
                ))}
              </div>

              {photos?.length < 5 && (
                <PhotoUploader onChange={handlePhotoSelect} />
              )}

              <Alert
                color="primary"
                variant="flat"
                title="Profile Photo Tip"
                className="items-start mt-3"
                description="The first photo in your list will be your main profile photo."
              />

              {photos?.length > 0 && (
                <div className="mt-8 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <Switch
                    isSelected={isPrivate}
                    onValueChange={setIsPrivate}
                    classNames={{
                      base: clsx(
                        "inline-flex flex-row-reverse w-full max-w-full items-center",
                        "justify-between cursor-pointer rounded-lg gap-2 border-2 border-transparent",
                      ),
                      wrapper: "p-0 h-4 overflow-visible",
                      thumb: clsx(
                        "w-6 h-6 border-2 shadow-lg",
                        "group-data-[selected=true]:ml-6",
                        "group-data-[selected=true]:border-primary",
                        "group-data-[selected=false]:border-default-300",
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

              {photos?.length > 0 && (
                <OnboardingContinueButton
                  title="UPLOAD YOUR PHOTOS"
                  onPress={handleUpload}
                  isLoading={loading}
                  className="mt-5"
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default page;
