import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import MatchCard from "@/app/components/cards/MatchCard";
import { MatchGridSkeleton } from "@/app/components/shared/Skeletons";
import usePagination from "@/app/hooks/usePagination";
import { Interest } from "@/app/types/types";
import { useQuery } from "@tanstack/react-query";

const InterestList = ({ type }: { type: "sent" | "received" }) => {
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, refetch, isLoading } = useQuery({
    queryKey: [`interest-${type}`, page, type],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.INTERESTS.LIST, {
        params: {
          page,
          type,
          limit: 10,
        },
      });
      setTotalPages(res?.pagination?.totalPages);
      return (res?.data || []) as Interest[];
    },
  });

  const interests = data ?? [];

  return (
    <div>
      {isLoading ? (
        <MatchGridSkeleton />
      ) : interests?.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-3">
          {interests?.map((item) => (
            <MatchCard
              key={item?._id}
              refetch={refetch}
              interestId={item?._id}
              interestStatus={item?.status}
              canAcceptDecline={
                type === "received" && item?.status === "pending"
              }
              profile={
                type === "received" ? item?.senderId : (item?.receiverId as any)
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-center">No interests found.</p>
      )}

      {interests?.length > 0 && renderPagination()}
    </div>
  );
};

export default InterestList;
