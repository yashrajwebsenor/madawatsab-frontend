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
