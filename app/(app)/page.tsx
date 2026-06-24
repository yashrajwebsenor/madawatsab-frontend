"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import MatchCard from "../components/cards/MatchCard";
import FilterSection from "../components/home/FilterSection";
import HomeHeadSection from "../components/home/HomeHeadSection";
import ENDPOINTS from "../api/endpoints";
import api from "../api/api";
import { Match } from "../types/types";
import { MatchGridSkeleton } from "../components/shared/Skeletons";
import AdvertisementCard from "../components/cards/AdvertisementCard";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Spinner, Tab, Tabs } from "@heroui/react";

type DiscoverTab = "discover" | "online";

const page = () => {
  const searchParams = useSearchParams();
  const filters = Object.fromEntries(searchParams.entries());
  const [tab, setTab] = useState<DiscoverTab>("discover");

  const {
    data,
    refetch,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // tab is part of the key so each tab keeps its own snapshot and refetches
    // when switched — the Online list is intentionally not live-updated.
    queryKey: ["discover", tab, filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res: any = await api.get(ENDPOINTS.PROFILE.DISCOVER, {
        params: {
          page: pageParam,
          limit: 10,
          ...filters,
          ...(tab === "online" ? { online: "true" } : {}),
        },
      });
      return {
        items: (res?.data || []) as Match[],
        currentPage: pageParam,
        totalPages: res?.pagination?.totalPages ?? 1,
        total: res?.pagination?.total ?? 0,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined,
  });

  const matches = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const totalProfiles = data?.pages[0]?.total ?? 0;

  // Keep latest paging state in a ref so the observer callback always reads
  // fresh values without needing to be re-created on every render.
  const pagingRef = useRef({ hasNextPage, isFetchingNextPage, fetchNextPage });
  pagingRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage };

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref: fires whenever the trigger node mounts/unmounts (including
  // after background refetches replace the node), so the observer never ends
  // up watching a stale, detached element.
  const triggerRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const { hasNextPage, isFetchingNextPage, fetchNextPage } =
          pagingRef.current;
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observerRef.current.observe(node);
  }, []);

  return (
    <div>
      <HomeHeadSection />

      <div className="container flex gap-7 py-5">
        <FilterSection />

        {/* pb clearance on mobile so the last row isn't hidden under the
            floating Filters button (the desktop sidebar replaces it at lg+). */}
        <div className="flex-1 pb-20 lg:pb-0">
          <Tabs
            aria-label="Discover sections"
            color="primary"
            radius="full"
            selectedKey={tab}
            onSelectionChange={(key) => setTab(key as DiscoverTab)}
            className="mb-4"
          >
            <Tab key="discover" title="Discover" />
            <Tab key="online" title="Online" />
          </Tabs>

          {matches?.length > 0 && (
            <p className="mb-3 text-sm text-gray-700">
              Showing <b>{totalProfiles}</b>{" "}
              {tab === "online" ? "online" : "matches"}
            </p>
          )}

          {isLoading ? (
            <MatchGridSkeleton />
          ) : matches.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-3">
              {matches.map((item, i) => {
                const isTrigger = i === Math.max(matches.length - 6, 0);
                // Ads are injected by the server via random pick, so the same
                // ad _id can recur in the feed. Key on the flattened index
                // (stable for this append-only list) to keep keys unique.
                const key = `${item.cardType}-${item._id}-${i}`;
                const card =
                  item.cardType === "profile" ? (
                    <MatchCard
                      profile={item}
                      refetch={refetch}
                      canInterestSendReceive
                    />
                  ) : (
                    <AdvertisementCard {...item} />
                  );
                return isTrigger ? (
                  <div key={key} ref={triggerRef}>
                    {card}
                  </div>
                ) : (
                  <div key={key}>{card}</div>
                );
              })}
            </div>
          ) : (
            <p className="text-center">
              {tab === "online"
                ? "No users online right now."
                : "No matches found."}
            </p>
          )}

          {isFetchingNextPage && (
            <div className="flex h-16 items-center justify-center">
              <Spinner size="md" color="primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
