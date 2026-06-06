import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import usePagination from "@/app/hooks/usePagination";
import { User } from "@/app/types/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/react";
import { FiUser } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { CardListSkeleton } from "../shared/Skeletons";
import useUserStore from "@/app/store/useUserStore";
import AgentRequestCard from "../cards/AgentRequestCard";

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
}

type Agent = User & { isRequestSent?: boolean };

const AgentRequestDrawer = ({ isOpen, onOpenChange }: Props) => {
  const { user } = useUserStore();
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["agents-by-city", page],
    queryFn: async () => {
      const res: any = await api.get(
        ENDPOINTS.AGENTS.GET_BY_CITY(user?.address?.cityId!),
        {
          params: {
            page,
            limit: 10,
          },
        },
      );
      setTotalPages(res?.pagination?.totalPages);
      return (res?.data || []) as Agent[];
    },
  });

  const agents = data ?? [];

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="sm"
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="flex flex-col gap-1 pt-8">
              <h3 className="text-xl font-bold">Request For Agent</h3>
              <p className="text-sm font-normal text-gray-400">
                Get personalized assistance from our expert matchmaking agents.
              </p>
            </DrawerHeader>

            <DrawerBody className="py-2 overflow-y-auto">
              {isLoading ? (
                <CardListSkeleton />
              ) : (
                <div>
                  {agents?.length > 0 ? (
                    <div className="grid gap-4">
                      {agents.map((agent) => (
                        <AgentRequestCard
                          key={agent._id}
                          refetch={refetch}
                          agent={agent as any}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                      <div className="w-20 h-20 mb-4 rounded-full bg-default-100 flex items-center justify-center text-default-300">
                        <FiUser size={40} />
                      </div>
                      <h4 className="text-lg font-bold text-default-700">
                        No Agents Found
                      </h4>
                      <p className="text-sm text-default-400 max-w-[200px] mx-auto">
                        We couldn't find any agents in your city at the moment.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DrawerBody>

            {!isLoading && agents?.length > 0 && (
              <DrawerFooter className="border-t border-default-100 flex justify-center">
                {renderPagination()}
              </DrawerFooter>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default AgentRequestDrawer;
