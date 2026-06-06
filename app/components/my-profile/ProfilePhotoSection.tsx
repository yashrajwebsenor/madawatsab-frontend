import { IoCameraOutline, IoClose } from "react-icons/io5";
import Section from "./Section";
import useUserStore from "@/app/store/useUserStore";
import { Alert, Button, Image, Switch } from "@heroui/react";
import { useState } from "react";
import { PhotoGridSkeleton } from "../shared/Skeletons";
import PhotoUploadPlaceholder from "../shared/PhotoUploadPlaceholder";
import useProfile from "@/app/hooks/useProfile";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";

const ProfilePhotoSection = () => {
  const { user } = useUserStore();
  const photos = user?.photos ?? [];
  const [loading, setLoading] = useState(false);
  const {
    loading: profileLoading,
    getMyProfile,
    updateMyProfile,
  } = useProfile();

  const uploadPhoto = async (file: File) => {
    const payload = new FormData();
    payload.append("photo", file);

    try {
      setLoading(true);
      await api.post(ENDPOINTS.PROFILE.UPLOAD_PHOTO, payload);
      getMyProfile();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(ENDPOINTS.PROFILE.DELETE_PHOTO(id));
      getMyProfile();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="1. Profile Photo"
      icon={<IoCameraOutline size={20} className="text-primary" />}
      description="Your photo will be visible after admin verification."
      extra={
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">
            Profile Private
          </span>
          <Switch
            size="sm"
            color="primary"
            defaultSelected={user?.isPrivate}
            aria-label="Profile Private Toggle"
            onChange={(ev) => updateMyProfile({ isPrivate: ev.target.checked })}
          />
        </div>
      }
    >
      {loading || profileLoading ? (
        <PhotoGridSkeleton />
      ) : (
        <div className="grid sm:grid-cols-3 gap-5">
          {photos?.map((photo, index) => (
            <div
              key={index}
              className="relative group overflow-hidden rounded-lg"
            >
              <Image
                src={photo.url}
                alt={`Gallery photo ${index + 1}`}
                className="w-[200px] aspect-[4/5] object-cover rounded-lg"
                isZoomed
              />
              {photos?.length > 1 && (
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="flat"
                  color="danger"
                  onPress={() => handleDelete(photo?._id)}
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IoClose size={18} />
                </Button>
              )}
            </div>
          ))}

          {photos?.length < 5 && (
            <PhotoUploadPlaceholder onChange={uploadPhoto} />
          )}
        </div>
      )}

      <Alert
        color="primary"
        variant="flat"
        title="Profile Photo Tip"
        className="items-start mt-3"
        description="The first photo in your list will be your main profile photo."
      />
    </Section>
  );
};

export default ProfilePhotoSection;
