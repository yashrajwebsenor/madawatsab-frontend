import useUserStore from "@/app/store/useUserStore";
import {
  Card,
  CardHeader,
  CardBody,
  Avatar,
  Chip,
  Divider,
} from "@heroui/react";
import { IoCheckmarkCircle } from "react-icons/io5";
import { LuUser } from "react-icons/lu";
import dayjs from "dayjs";
import CommonUtils from "@/app/utils/common.utils";

const MyProfileDetailsCard = () => {
  const { user } = useUserStore();

  if (!user) return null;

  const age = user.dob ? dayjs().diff(dayjs(user.dob), "year") : null;

  return (
    <Card className="w-full max-w-[650px] mx-auto shadow-sm border-none bg-white rounded-xl overflow-hidden">
      <CardHeader className="h-36 bg-gradient-to-b from-[#0b4d42] to-primary flex flex-col items-center justify-center p-0 relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />

        <div className="absolute -bottom-14 flex flex-col items-center">
          <div className="relative">
            <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20">
              <Avatar
                src={user.profilePhoto?.url}
                className="w-32 h-32 text-large bg-[#f8fafc] rounded-[28px] border-4 border-white"
                fallback={<LuUser className="w-16 h-16 text-default-300" />}
              />
            </div>
            <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-sm border border-default-100">
              <IoCheckmarkCircle className="text-primary text-2xl" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-20 pb-12 px-4 sm:px-10 text-center">
        <h2 className="text-[28px] font-bold text-[#0f172a] tracking-tight">
          {user.fullName}
          {age ? `, ${age}` : ""}
        </h2>

        <p className="text-default-500 font-medium text-[15px]">
          {user.occupation || user.workSector || "Software Engineering"} ·{" "}
          {user.address?.cityName || "Dubai"},{" "}
          {user.address?.countryName || "UAE"}
        </p>

        <div className="flex items-center justify-center gap-4 mt-3">
          <Chip
            variant="bordered"
            classNames={{
              base: "border-[#e0f2f1] bg-[#f0f9f9] px-5 h-10 border-[1.5px]",
              content:
                "text-[#0b4d42] font-extrabold text-[13px] tracking-widest",
            }}
          >
            {CommonUtils.formatTitle(user.community) ||
              CommonUtils.formatTitle(user.maslak)}
          </Chip>
          <Chip
            classNames={{
              base: "bg-[#fef9eb] border border-[#f3e3b7] px-5 h-10",
              content:
                "text-[#b08c2a] font-extrabold text-[13px] tracking-widest",
            }}
          >
            {CommonUtils.formatTitle(user.maritalStatus)}
          </Chip>
        </div>

        <Divider className="my-5 bg-default-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 text-left gap-6 sm:gap-16 px-2">
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold text-default-400 uppercase tracking-[0.15em]">
              Education
            </p>
            <p className="text-primary font-bold text-[17px] leading-tight">
              {user.qualification || "Bachelor's Degree"}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold text-default-400 uppercase tracking-[0.15em]">
              Profession Type
            </p>
            <p className="text-primary font-bold text-[17px] leading-tight">
              {user.occupation || user.workSector || "Software Engineering"}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default MyProfileDetailsCard;
