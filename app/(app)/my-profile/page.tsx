"use client";

import EducationSection from "@/app/components/my-profile/EducationSection";
import FamilySection from "@/app/components/my-profile/FamilySection";
import LifestyleSection from "@/app/components/my-profile/LifestyleSection";
import MembershipCard from "@/app/components/my-profile/MembershipCard";
import MyProfileDetailsCard from "@/app/components/my-profile/MyProfileDetails";
import PauseAccountCard from "@/app/components/account/PauseAccountCard";
import PersonalInformation from "@/app/components/my-profile/PersonalInformation";
import ProfilePhotoSection from "@/app/components/my-profile/ProfilePhotoSection";
import ReligiousSection from "@/app/components/my-profile/ReligiousSection";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import { IoSettingsOutline } from "react-icons/io5";

const page = () => {
  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-2xl sm:text-3xl font-semibold">My Profile</h2>
          <p className="text-gray-300 text-sm mt-1">
            Stay updated on your professional reach and manage your growing
            network.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-6">
        <div className="flex gap-2">
          <IoSettingsOutline size={20} className="mt-2" />
          <div>
            <h2 className="text-2xl font-semibold">Edit Profile</h2>
            <p className="text-sm text-gray-500">
              Updates here are reflected in real-time on your public profile
              preview.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-7 lg:flex-row lg:items-start">
          <div className="flex flex-col gap-7 lg:flex-[2]">
            <ProfilePhotoSection />
            <PersonalInformation />
            <EducationSection />
            <FamilySection />
            <ReligiousSection />
            <LifestyleSection />
          </div>
          <div className="flex flex-col gap-7 lg:flex-1 lg:sticky lg:top-24">
            <MembershipCard />
            <PauseAccountCard />
            <MyProfileDetailsCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
