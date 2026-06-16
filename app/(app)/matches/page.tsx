"use client";

import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import { Tab, Tabs } from "@heroui/react";
import { useState } from "react";
import InterestList from "./InterestList";
import usePagination from "@/app/hooks/usePagination";
import ENDPOINTS from "@/app/api/endpoints";
import api from "@/app/api/api";
import { useQuery } from "@tanstack/react-query";
import { ConnectionFeedItem } from "@/app/types/types";
import { MatchGridSkeleton } from "@/app/components/shared/Skeletons";
import MatchCard from "@/app/components/cards/MatchCard";
import AdvertisementCard from "@/app/components/cards/AdvertisementCard";

const page = () => {
  const [activeTab, setActiveTab] = useState("connections");
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, isLoading } = useQuery({
    queryKey: [`connections`, page],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.INTERESTS.CONNECTIONS, {
        params: {
          page,
          limit: 10,
        },
      });
      setTotalPages(res?.pagination?.totalPages);
      return (res?.data || []) as ConnectionFeedItem[];
    },
  });

  const connections = data ?? [];

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <h2 className="text-white text-2xl sm:text-3xl font-semibold">
            Interests & Requests
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Manage your connections and view profiles who showed interest in
            you.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="py-5 container">
        <Tabs
          className="mb-5 max-w-full overflow-x-auto"
          selectedKey={activeTab}
          onSelectionChange={setActiveTab as any}
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} title={tab.label} />
          ))}
        </Tabs>

        {activeTab === "connections" && (
          <div>
            {isLoading ? (
              <MatchGridSkeleton />
            ) : connections?.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-3">
                {connections?.map((item) =>
                  item.cardType === "profile" ? (
                    <MatchCard
                      key={item._id}
                      canInterestSendReceive={false}
                      profile={item.profile}
                    />
                  ) : (
                    <AdvertisementCard key={item._id} {...item} />
                  ),
                )}
              </div>
            ) : (
              <p className="text-center">No connections found.</p>
            )}

            {connections?.length > 0 && renderPagination()}
          </div>
        )}

        {(activeTab === "request_received" || activeTab === "request_sent") && (
          <InterestList
            type={activeTab === "request_received" ? "received" : "sent"}
          />
        )}
      </div>
    </div>
  );
};

export default page;

const tabs = [
  {
    key: "connections",
    label: "Connections",
  },
  {
    key: "request_received",
    label: "Requests Received",
  },
  {
    key: "request_sent",
    label: "Requests Sent",
  },
];
