"use client";

import { use } from "react";
import MatchCapability from "@/app/components/match-details/MatchCapability";
import MatchExtraDetails from "@/app/components/match-details/MatchExtraDetails";
import MatchProfileSection from "@/app/components/match-details/MatchProfileSection";
import { User } from "@/app/types/types";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import { MatchDetailSkeleton } from "@/app/components/shared/Skeletons";
import LockedContent from "@/app/components/shared/LockedContent";
import useSubscriptionAccess from "@/app/hooks/useSubscriptionAccess";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@heroui/react";
import { LuUserX } from "react-icons/lu";

const page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  // Access state decided once and passed down. Unsubscribed viewers get a
  // basic-only payload from the backend, so detail sections must lock.
  const { canViewFullProfile } = useSubscriptionAccess();
  const locked = !canViewFullProfile;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`matchProfile-${id}`, id],
    queryFn: async () => {
      const res = await api.get(ENDPOINTS.PROFILE.GET_BY_ID(id));
      return res?.data as User;
    },
  });

  return (
    <div className="container py-5 space-y-8">
      {isLoading ? (
        <MatchDetailSkeleton />
      ) : data?.isDeleted ? (
        // The member self-deleted their account: show a neutral tombstone with
        // no fields or actions instead of the full profile.
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Avatar
            size="lg"
            radius="full"
            icon={<LuUserX className="text-3xl" />}
            classNames={{ base: "bg-default-200 text-default-500 w-20 h-20" }}
          />
          <div>
            <p className="text-lg font-semibold">Deleted User</p>
            <p className="mt-1 text-sm text-default-500">
              This profile is no longer available.
            </p>
          </div>
        </div>
      ) : data ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="lg:flex-[2] lg:min-w-0">
              <MatchProfileSection profile={data} refetch={refetch} />
            </div>
            <div className="lg:flex-1 lg:min-w-0 lg:h-[580px]">
              {locked ? (
                <LockedContent
                  className="h-full"
                  title="Match insights are a premium feature"
                  reason="Subscribe to unlock compatibility insights for this member."
                />
              ) : (
                <MatchCapability profile={data} />
              )}
            </div>
          </div>
          <MatchExtraDetails profile={data} locked={locked} />
        </>
      ) : (
        <p className="text-center">No match profile found.</p>
      )}
    </div>
  );
};

export default page;
