"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import LoadingProgress from "@/app/components/shared/LoadingProgress";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import routes from "@/app/configs/route-paths";
import { addToast, Avatar, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiUnlock } from "react-icons/fi";

type BlockedUser = {
  _id: string;
  fullName?: string;
  userId?: string;
  occupation?: string;
  isPrivate?: boolean;
  profilePhoto?: { url?: string };
};

type BlockEntry = {
  _id: string;
  blockedId: BlockedUser | null;
};

const BlockedUsersPage = () => {
  const router = useRouter();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const { data: blocks = [], isLoading, refetch } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.BLOCKS.LIST);
      return (res?.data || res || []) as BlockEntry[];
    },
  });

  const handleUnblock = async (userId: string) => {
    try {
      setUnblockingId(userId);
      await api.delete(ENDPOINTS.BLOCKS.REMOVE(userId));
      addToast({ color: "success", title: "User unblocked" });
      refetch();
    } catch (error: any) {
      addToast({
        color: "danger",
        title: "Could not unblock",
        description:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-2xl sm:text-3xl font-semibold">Blocked Users</h2>
          <p className="text-gray-300 text-sm mt-1">
            People you blocked can&apos;t message you. Unblock anytime.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-8 pb-20">
        {isLoading ? (
          <LoadingProgress />
        ) : blocks.length === 0 ? (
          <div className="rounded-2xl border border-divider bg-white p-12 text-center">
            <p className="text-default-500">You haven&apos;t blocked anyone.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {blocks
              .filter((b) => b.blockedId)
              .map((b) => {
                const u = b.blockedId as BlockedUser;
                return (
                  <div
                    key={b._id}
                    className="flex flex-col gap-3 rounded-2xl border border-divider bg-white p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar
                        isBordered
                        color="primary"
                        name={u.fullName}
                        src={u.profilePhoto?.url}
                        className={u.isPrivate ? "blur-[2px]" : undefined}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">
                          {u.fullName || "Unknown"}
                        </p>
                        <p className="truncate text-xs text-default-500">
                          {u.occupation || u.userId || ""}
                        </p>
                      </div>
                    </div>
                    {/* Buttons split the row on mobile, shrink to content on sm+. */}
                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        variant="flat"
                        className="flex-1 sm:flex-none"
                        onPress={() => router.push(routes.matches.details(u._id))}
                      >
                        View profile
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        className="flex-1 sm:flex-none"
                        isLoading={unblockingId === u._id}
                        onPress={() => handleUnblock(u._id)}
                        startContent={
                          unblockingId !== u._id && <FiUnlock size={16} />
                        }
                      >
                        Unblock
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedUsersPage;
