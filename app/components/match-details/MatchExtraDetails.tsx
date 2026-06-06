import { User } from "@/app/types/types";
import CommonUtils from "@/app/utils/common.utils";
import { Image, Tab, Tabs } from "@heroui/react";
import dayjs from "dayjs";
import { useState } from "react";
import ViewPhotosDialog from "../dialogs/ViewPhotosDialog";
import { IoIosLock } from "react-icons/io";
import LockedContent from "../shared/LockedContent";

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
  // Photos stay blurred whenever the backend says so (no sub, or private target).
  const photosBlurred = profile?.shouldBlur ?? profile?.isPrivate;
  const galleryLocked = locked || photosBlurred;

  const aboutProfileData = {
    annualIncome: profile?.annualIncome,
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

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
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
                profile.isPrivate
                  ? "Private photo gallery"
                  : "Photo gallery is locked"
              }
              reason={
                profile.isPrivate
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
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl"
                >
                  <Image
                    src={photo?.url}
                    alt={`Gallery photo ${index + 1}`}
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
