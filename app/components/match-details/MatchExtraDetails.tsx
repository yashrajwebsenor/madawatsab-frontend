import { User } from "@/app/types/types";
import CommonUtils from "@/app/utils/common.utils";
import { Chip, Image, Tab, Tabs } from "@heroui/react";
import dayjs from "dayjs";
import { useState } from "react";
import ViewPhotosDialog from "../dialogs/ViewPhotosDialog";
import { IoIosLock } from "react-icons/io";
import LockedContent from "../shared/LockedContent";
import { AttachmentStatus } from "@/app/types/enum";

// `locked` = the viewer has no active subscription, so the backend returned a
// basic-only payload. Show deliberate locked states instead of "Not Specified".
const MatchExtraDetails = ({
  profile,
  locked,
}: {
  profile: User;
  locked?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState("1");
  const [photoModal, setPhotoModal] = useState<any>({
    isOpen: false,
    photos: [],
    initialIndex: 0,
  });

  const photos = profile?.photos || [];
  // True for a fully private profile OR a public profile with just its
  // gallery locked — either way the gallery-request flow gates the photos.
  const isGalleryLockedProfile = !!(
    profile?.isPrivate || profile?.isGalleryPrivate
  );
  // Photos stay blurred whenever the backend says so (no sub, or private/gallery-locked target).
  const photosBlurred = profile?.shouldBlur ?? isGalleryLockedProfile;
  const galleryLocked = locked || photosBlurred;

  const aboutProfileData = {
    annualIncome: profile?.annualIncome,
    caste: profile?.caste,
    community: profile?.community,
    dob: profile?.dob
      ? dayjs(profile.dob).format("DD MMMM YYYY")
      : "Not Specified",
    gender: profile?.gender,
    height: profile?.height,
    isFamilyLivingWithUser: profile?.isFamilyLivingWithUser,
    language: profile?.language,
    maritalStatus: profile?.maritalStatus,
    maslak: profile?.maslak,
    workSector: profile?.workSector,
  };

  const familyData = {
    aboutFamily: profile?.family?.aboutFamily ?? "",
    familyType: profile?.family?.familyType ?? "",
    fatherName: profile?.family?.fatherName ?? "",
    fatherOccupation: profile?.family?.fatherOccupation ?? "",
    motherName: profile?.family?.motherName ?? "",
    motherOccupation: profile?.family?.motherOccupation ?? "",
  };

  // Siblings are counts only; unmarried is derived, never stored.
  const siblingCounts = [
    {
      label: "Brothers",
      total: profile?.family?.brothers ?? 0,
      married: profile?.family?.marriedBrothers ?? 0,
    },
    {
      label: "Sisters",
      total: profile?.family?.sisters ?? 0,
      married: profile?.family?.marriedSisters ?? 0,
    },
  ];

  const hasSiblings = siblingCounts.some((item) => item.total > 0);

  return (
    <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-gray-100">
      <Tabs
        color="primary"
        className="w-full"
        variant="underlined"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab as any}
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent:
            "group-data-[selected=true]:text-primary font-semibold text-medium",
        }}
      >
        <Tab key="1" title="About Profile">
          {locked ? (
            <LockedContent
              className="my-4"
              title="Subscribe to view full profile details"
              reason="Get an active plan to see profession, education, family background, and more."
            />
          ) : (
          <div className="space-y-0">
            {Object.entries(aboutProfileData).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-400 text-sm md:text-base font-medium">
                  {CommonUtils.formatTitle(key)}
                </span>
                <span className="text-slate-800 text-sm md:text-base font-bold text-right">
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : value
                      ? CommonUtils.formatTitle(value as any)
                      : "Not Specified"}
                  {key === "height" && value ? " cm" : ""}
                </span>
              </div>
            ))}
          </div>
          )}
        </Tab>
        <Tab
          key="2"
          title={
            <div className="flex items-center gap-2">
              <span>Family Background</span>
              {locked && <IoIosLock className="text-default-400" size={16} />}
            </div>
          }
        >
          {locked ? (
            <LockedContent
              className="my-4"
              title="Family details are locked"
              reason="Subscribe to a plan to view this member's family background."
            />
          ) : (
          <div className="space-y-0">
            {Object.keys(familyData).length > 0 ? (
              Object.entries(familyData).map(([key, value]) => {
                if (key === "aboutFamily") {
                  return (
                    <div
                      key={key}
                      className="py-4 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-400 text-sm md:text-base font-medium block mb-2">
                        {CommonUtils.formatTitle(key)}
                      </span>
                      <p className="text-slate-800 text-sm md:text-base font-semibold leading-relaxed">
                        {value as string}
                      </p>
                    </div>
                  );
                }
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-gray-400 text-sm md:text-base font-medium">
                      {CommonUtils.formatTitle(key)}
                    </span>
                    <span className="text-slate-800 text-sm md:text-base font-bold text-right">
                      {value
                        ? CommonUtils.formatTitle(value as any)
                        : "Not Specified"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-5 text-center text-gray-400">
                No family details provided.
              </div>
            )}

            {hasSiblings && (
              <div className="mt-4 grid gap-3">
                <span className="text-gray-400 text-sm md:text-base font-medium">
                  Siblings
                </span>
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-50 p-4">
                  {siblingCounts.map((item) => (
                    <div key={item.label}>
                      <span className="text-gray-400 text-xs block">
                        {item.label}
                      </span>
                      <span className="text-slate-800 text-sm font-bold">
                        {item.total}
                      </span>
                      <span className="text-gray-400 text-xs block mt-1">
                        {item.married} married ·{" "}
                        {Math.max(item.total - item.married, 0)} unmarried
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </Tab>

        <Tab
          key="3"
          title={
            <div className="flex items-center gap-2">
              <span>Photo Gallery</span>
              {galleryLocked && (
                <IoIosLock className="text-default-400" size={16} />
              )}
            </div>
          }
        >
          {galleryLocked ? (
            <LockedContent
              className="my-4"
              title={
                isGalleryLockedProfile
                  ? "Private photo gallery"
                  : "Photo gallery is locked"
              }
              reason={
                isGalleryLockedProfile
                  ? "This member keeps their gallery private."
                  : "Subscribe to a plan to view the full photo gallery."
              }
            />
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.length > 0 ? (
              photos.map((photo: any, index: number) => (
                <div
                  key={index}
                  className="relative aspect-[4/5] overflow-hidden"
                >
                  <Image
                    src={photo?.url}
                    alt={`Gallery photo ${index + 1}`}
                    radius="none"
                    className="w-full h-full object-cover cursor-pointerw"
                    isZoomed
                    onClick={() =>
                      setPhotoModal({
                        isOpen: true,
                        photos: photos,
                        initialIndex: index,
                      })
                    }
                  />
                  {photo?.status === AttachmentStatus.pending && (
                    <Chip
                      size="sm"
                      color="warning"
                      variant="solid"
                      className="absolute left-2 top-2 z-20"
                    >
                      Pending review
                    </Chip>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-5 text-center text-gray-400">
                No photos available.
              </div>
            )}
          </div>
          )}
        </Tab>
      </Tabs>

      {photoModal?.isOpen && (
        <ViewPhotosDialog
          isOpen={photoModal.isOpen}
          photos={photoModal.photos}
          initialIndex={photoModal.initialIndex}
          onClose={() =>
            setPhotoModal({ isOpen: false, photos: [], initialIndex: 0 })
          }
        />
      )}
    </div>
  );
};

export default MatchExtraDetails;
