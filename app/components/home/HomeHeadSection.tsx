"use client";

import { Avatar, Button, Chip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { GoPersonAdd } from "react-icons/go";
import { FiPhone, FiUserCheck } from "react-icons/fi";
import PageHeaderWrapper from "../shared/PageHeaderWrapper";
import useUserStore from "@/app/store/useUserStore";
import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";

const HomeHeadSection = () => {
  const router = useRouter();
  const { user } = useUserStore();

  const { data: assignedAgent } = useQuery({
    queryKey: ["assigned-agent"],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.AGENTS.ASSIGNED);
      return res?.data ?? null;
    },
    enabled: !!user?.assignedAgent,
  });

  return (
    <PageHeaderWrapper>
      <div className="container flex gap-5 flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-5 flex-col sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h2 className="text-white text-2xl sm:text-3xl font-semibold">
              Browse <span className="text-secondary">Matches</span>
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              Discover compatible profiles tailored to your preferences and
              values.
              <br />
              Your perfect match is just a click away.
            </p>
          </div>

          {user?.assignedAgent ? (
            assignedAgent && (
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                {assignedAgent.profilePhoto?.url ? (
                  <Avatar
                    size="md"
                    name={assignedAgent.fullName}
                    src={assignedAgent.profilePhoto.url}
                  />
                ) : (
                  <div className="bg-secondary/20 text-secondary p-2 rounded-lg">
                    <FiUserCheck size={18} />
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-semibold">
                    {assignedAgent.fullName}
                  </p>
                  <p className="text-gray-300 text-xs flex items-center gap-1">
                    <FiPhone size={11} /> {assignedAgent.mobile}
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="solid"
                  className="bg-white text-primary font-semibold"
                >
                  Your Agent
                </Chip>
              </div>
            )
          ) : (
            <Button
              onPress={() => router.push(routes.requestAgent)}
              color="secondary"
              variant="bordered"
              className="font-medium"
              startContent={<GoPersonAdd size={20} />}
            >
              Request For Agent
            </Button>
          )}
        </div>
      </div>
    </PageHeaderWrapper>
  );
};

export default HomeHeadSection;
