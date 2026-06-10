import { IoCameraOutline, IoClose } from "react-icons/io5";
import Section from "./Section";
import useUserStore from "@/app/store/useUserStore";
import { Alert, Button, Chip, Image, Spinner, Switch } from "@heroui/react";
import { AttachmentStatus } from "@/app/types/enum";
import { useRef, useState } from "react";
import PhotoUploadPlaceholder from "../shared/PhotoUploadPlaceholder";
import useProfile from "@/app/hooks/useProfile";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";

const UploadingOverlay = () => (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-lg">
    <Spinner size="sm" color="white" variant="gradient" />
  </div>
);

const ProfilePhotoSection = () => {
  const { user } = useUserStore();
  const profilePhoto = user?.profilePhoto;
  const photos = user?.photos ?? [];
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const changeInputRef = useRef<HTMLInputElement>(null);
  const { getMyProfile, updateMyProfile } = useProfile();

  const uploadProfilePhoto = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setProfilePreview(preview);

    const payload = new FormData();
    payload.append("photo", file);

    try {
      await api.post(ENDPOINTS.PROFILE.UPLOAD_PROFILE_PHOTO, payload);
      await getMyProfile();
    } catch (error) {
      console.log(error);
    } finally {
      setProfilePreview(null);
      URL.revokeObjectURL(preview);
    }
  };

  const uploadPhoto = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPhotoPreviews((prev) => [...prev, preview]);

    const payload = new FormData();
    payload.append("photo", file);

    try {
      await api.post(ENDPOINTS.PROFILE.UPLOAD_PHOTO, payload);
      await getMyProfile();
    } catch (error) {
      console.log(error);
    } finally {
      setPhotoPreviews((prev) => prev.filter((p) => p !== preview));
      URL.revokeObjectURL(preview);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await api.delete(ENDPOINTS.PROFILE.DELETE_PHOTO(id));
      await getMyProfile();
    } catch (error) {
      console.log(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangeProfilePhoto = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) uploadProfilePhoto(file);
    e.target.value = "";
  };

  return (
    <Section
      title="1. Photos"
      icon={<IoCameraOutline size={20} className="text-primary" />}
      description="Your photos will be visible after admin verification."
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
      <div className="flex flex-col gap-8">
        {/* Main profile photo (single) */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Profile Photo
          </h3>

          {profilePreview ? (
            <div className="relative w-[200px] overflow-hidden rounded-lg animate-pulse">
              <Image
                src={profilePreview}
                alt="Uploading profile photo"
                className="w-[200px] aspect-[4/5] object-cover rounded-lg scale-105 blur-[1px]"
              />
              <UploadingOverlay />
            </div>
          ) : profilePhoto?.url ? (
            <div className="flex flex-col gap-2">
              <div className="relative w-[200px] overflow-hidden rounded-lg">
                <Image
                  src={profilePhoto.url}
                  alt="Profile photo"
                  className="w-[200px] aspect-[4/5] object-cover rounded-lg"
                  isZoomed
                />
              </div>
              <input
                type="file"
                ref={changeInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleChangeProfilePhoto}
              />
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="w-[200px]"
                onPress={() => changeInputRef.current?.click()}
              >
                Change Photo
              </Button>
            </div>
          ) : (
            <PhotoUploadPlaceholder onChange={uploadProfilePhoto} />
          )}
        </div>

        {/* Other photos (gallery) */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Other Photos
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            New photos are reviewed by our team before other users can see
            them. Only you can see photos marked “Pending review”.
          </p>

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
                {photo.status === AttachmentStatus.pending && (
                  <Chip
                    size="sm"
                    color="warning"
                    variant="solid"
                    className="absolute left-2 top-2 z-20"
                  >
                    Pending review
                  </Chip>
                )}
                {deletingId === photo?._id && <UploadingOverlay />}
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
              </div>
            ))}

            {/* Photos currently uploading */}
            {photoPreviews.map((preview, index) => (
              <div
                key={`uploading-${index}`}
                className="relative overflow-hidden rounded-lg animate-pulse"
              >
                <Image
                  src={preview}
                  alt="Uploading photo"
                  className="w-[200px] aspect-[4/5] object-cover rounded-lg scale-105 blur-[1px]"
                />
                <UploadingOverlay />
              </div>
            ))}

            {photos?.length + photoPreviews.length < 5 && (
              <PhotoUploadPlaceholder onChange={uploadPhoto} />
            )}
          </div>
        </div>
      </div>

      <Alert
        color="primary"
        variant="flat"
        title="Profile Photo Tip"
        className="items-start mt-3"
        description="Your profile photo is the main picture shown across the app. Add more photos to give a fuller picture of yourself."
      />
    </Section>
  );
};

export default ProfilePhotoSection;
