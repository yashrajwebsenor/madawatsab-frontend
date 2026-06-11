"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { IoFilterOutline } from "react-icons/io5";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import {
  ConnectionFeedItem,
  ContactView,
  GalleryRequestItem,
  Interest,
  ProfileVisit,
  Shortlist,
  User,
} from "@/app/types/types";
import { GalleryRequestStatus, InterestStatus } from "@/app/types/enum";
import usePagination from "@/app/hooks/usePagination";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import { MatchGridSkeleton } from "@/app/components/shared/Skeletons";
import MatchCard from "@/app/components/cards/MatchCard";

type SortKey = "recent" | "oldest";
type Mode = "interest" | "visits" | "contact" | "shortlist" | "gallery";

// Every tab has real data now except `all`, which is still the interests
// feed — the merged received-feed (+ unread counts) is the last milestone.
const TABS = [
  { key: "all", label: "All" },
  { key: "interest", label: "Interest" },
  { key: "profile_visits", label: "Profile Visits" },
  { key: "gallery_requests", label: "Gallery Requests" },
  { key: "contact_views", label: "Contact Views" },
  { key: "shortlisted", label: "Shortlisted" },
];

// Sub-filter pills per tab. Key drives the query; first entry is the default.
const SUB_FILTERS_BY_TAB: Record<string, { key: string; label: string }[]> = {
  all: [
    { key: "received", label: "Received" },
    { key: "sent", label: "Sent" },
    { key: "accepted", label: "Accepted" },
  ],
  interest: [
    { key: "received", label: "Received" },
    { key: "sent", label: "Sent" },
    { key: "accepted", label: "Accepted" },
  ],
  profile_visits: [
    { key: "visited_me", label: "Visited Me" },
    { key: "i_visited", label: "I visited" },
  ],
  gallery_requests: [
    { key: "received", label: "Received" },
    { key: "sent", label: "Sent" },
    { key: "accepted", label: "Accepted" },
  ],
  contact_views: [
    { key: "viewed_mine", label: "Viewed mine" },
    { key: "i_viewed", label: "I viewed" },
  ],
  shortlisted: [{ key: "shortlisted_by_me", label: "Shortlisted by Me" }],
};

// Tabs whose cards show the Shortlist + Message footer (vs Accept/Decline).
const VISITS_TABS = new Set(["profile_visits"]);

// Tabs wired to a real/placeholder card grid. Tabs absent here render their
// EMPTY_STATE copy instead (no endpoint yet).
const DATA_TABS = new Set([
  "all",
  "interest",
  "profile_visits",
  "gallery_requests",
  "contact_views",
  "shortlisted",
]);

const EMPTY_STATES: Record<string, { title: string; subtitle: string }> = {
  contact_views: {
    title: "No views",
    subtitle:
      "No contact views so far. Stay active to increase your chances!",
  },
  shortlisted: {
    title: "No shortlists yet",
    subtitle:
      "Tap the bookmark icon on a profile to save it here for later.",
  },
  profile_visits: {
    title: "No profile visits",
    subtitle:
      "No profile visits so far. Stay active to increase your chances!",
  },
  gallery_requests: {
    title: "No gallery requests",
    subtitle:
      "Photo requests you send to private profiles, and ones you receive, show up here.",
  },
};

const DEFAULT_EMPTY = {
  title: "Nothing here yet",
  subtitle: "There's no activity to show in this section right now.",
};

const EmptyState = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="py-16 text-center">
    <p className="text-lg font-semibold text-primary">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{subtitle}</p>
  </div>
);

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl bg-white/10 px-5 py-3 text-center text-white">
    <p className="text-[11px] uppercase tracking-wide text-white/70">{label}</p>
    <p className="text-2xl font-semibold leading-tight">{value}</p>
  </div>
);

type Row = {
  id: string;
  profile: User;
  interestId?: string;
  galleryRequestId?: string;
  canAcceptDecline: boolean;
  canShortlistMessage: boolean;
  interestStatus?: InterestStatus;
};

// Keyed by `${tab}-${subFilter}` from the parent so it remounts on switch —
// that resets usePagination's page to 1 (avoids landing on an empty page).
const ActivityPanel = ({
  mode,
  subFilter,
  search,
  sort,
  empty,
}: {
  mode: Mode;
  subFilter: string;
  search: string;
  sort: SortKey;
  empty?: { title: string; subtitle: string };
}) => {
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["activity", mode, subFilter, page],
    queryFn: async (): Promise<Row[]> => {
      if (mode === "gallery") {
        const res: any = await api.get(ENDPOINTS.GALLERY_REQUESTS.LIST, {
          params: { page, limit: 12, type: subFilter },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as GalleryRequestItem[]).map((i) => ({
          id: i._id,
          galleryRequestId: i._id,
          // Backend already transformed: `profile` is the other side.
          profile: i.profile,
          canAcceptDecline:
            subFilter === "received" &&
            i.status === GalleryRequestStatus.pending,
          canShortlistMessage: false,
          // Reuses the interest-status chip: a declined sent request shows
          // "Rejected" (same enum string values).
          interestStatus:
            subFilter === "sent"
              ? (i.status as unknown as InterestStatus)
              : undefined,
        }));
      }

      if (mode === "shortlist") {
        const res: any = await api.get(ENDPOINTS.SHORTLISTS.LIST, {
          params: { page, limit: 12 },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as Shortlist[]).map((i) => ({
          id: i._id,
          profile: i.targetId,
          canAcceptDecline: false,
          canShortlistMessage: true,
        }));
      }

      if (mode === "contact") {
        const res: any = await api.get(ENDPOINTS.SUBSCRIPTION.CONTACT_VIEWS, {
          params: { page, limit: 12, type: subFilter },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as ContactView[]).map((i) => ({
          id: i._id,
          // The populated side is the profile shown on the card.
          profile: subFilter === "viewed_mine" ? i.viewerId : i.profileId,
          canAcceptDecline: false,
          canShortlistMessage: false,
        }));
      }

      if (mode === "visits") {
        const res: any = await api.get(ENDPOINTS.PROFILE_VISITS.LIST, {
          params: { page, limit: 12, type: subFilter },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as ProfileVisit[]).map((i) => ({
          id: i._id,
          // The populated side is the profile shown on the card.
          profile: subFilter === "visited_me" ? i.visitorId : i.visitedId,
          canAcceptDecline: false,
          canShortlistMessage: true,
        }));
      }

      if (subFilter === "accepted") {
        const res: any = await api.get(ENDPOINTS.INTERESTS.CONNECTIONS, {
          params: { page, limit: 12 },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as ConnectionFeedItem[])
          .filter((i) => i.cardType === "profile")
          .map((i: any) => ({
            id: i._id,
            profile: i.profile,
            canAcceptDecline: false,
            canShortlistMessage: false,
          }));
      }

      const res: any = await api.get(ENDPOINTS.INTERESTS.LIST, {
        params: { page, type: subFilter, limit: 12 },
      });
      setTotalPages(res?.pagination?.totalPages);
      return ((res?.data || []) as Interest[]).map((i) => ({
        id: i._id,
        interestId: i._id,
        profile: subFilter === "received" ? i.senderId : i.receiverId,
        canAcceptDecline:
          subFilter === "received" && i.status === InterestStatus.pending,
        canShortlistMessage: false,
        interestStatus: subFilter === "sent" ? i.status : undefined,
      }));
    },
  });

  const rows = useMemo(() => {
    let list = data ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => r.profile?.fullName?.toLowerCase().includes(q));
    }
    // Backend returns newest-first; reverse a shallow copy for "oldest".
    return sort === "oldest" ? [...list].reverse() : list;
  }, [data, search, sort]);

  if (isLoading) return <MatchGridSkeleton />;

  if (rows.length === 0) {
    if (search) {
      return (
        <p className="py-10 text-center text-gray-500">
          No profiles match your search.
        </p>
      );
    }
    return <EmptyState {...(empty ?? DEFAULT_EMPTY)} />;
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        {rows.map((row) => (
          <MatchCard
            key={row.id}
            refetch={refetch}
            profile={row.profile}
            interestId={row.interestId}
            galleryRequestId={row.galleryRequestId}
            interestStatus={row.interestStatus}
            canAcceptDecline={row.canAcceptDecline}
            canShortlistMessage={row.canShortlistMessage}
            canInterestSendReceive={false}
          />
        ))}
      </div>
      {renderPagination()}
    </>
  );
};

const page = () => {
  const [activeTab, setActiveTab] = useState("interest");
  const [subFilter, setSubFilter] = useState("received");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const subFilters = SUB_FILTERS_BY_TAB[activeTab];
  const isDataTab = DATA_TABS.has(activeTab);
  const mode: Mode = VISITS_TABS.has(activeTab)
    ? "visits"
    : activeTab === "contact_views"
      ? "contact"
      : activeTab === "shortlisted"
        ? "shortlist"
        : activeTab === "gallery_requests"
          ? "gallery"
          : "interest";

  const onTabChange = (key: string) => {
    setActiveTab(key);
    // Reset the sub-filter to the new tab's first pill (if it has any).
    setSubFilter(SUB_FILTERS_BY_TAB[key]?.[0]?.key ?? "");
  };

  // Stat boxes: total received / sent interest counts (limit 1 — we only read
  // pagination.total, not the rows).
  const { data: counts } = useQuery({
    queryKey: ["activity-counts"],
    queryFn: async () => {
      const [received, sent]: any[] = await Promise.all([
        api.get(ENDPOINTS.INTERESTS.LIST, {
          params: { page: 1, type: "received", limit: 1 },
        }),
        api.get(ENDPOINTS.INTERESTS.LIST, {
          params: { page: 1, type: "sent", limit: 1 },
        }),
      ]);
      return {
        received: received?.pagination?.total ?? 0,
        sent: sent?.pagination?.total ?? 0,
      };
    },
  });

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/60">
              Dashboard / <span className="text-amber-300">Activity</span>
            </p>
            <h2 className="text-3xl font-semibold text-white">Activity</h2>
            <p className="mt-1 text-sm text-gray-300">
              Manage your connections and view profiles who showed interest in
              you.
            </p>
          </div>

          <div className="hidden shrink-0 gap-3 sm:flex">
            <StatBox label="Received" value={counts?.received ?? 0} />
            <StatBox label="Sent" value={counts?.sent ?? 0} />
          </div>
        </div>
      </PageHeaderWrapper>

      <div className="container py-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <Tabs
            aria-label="Activity sections"
            variant="underlined"
            color="primary"
            className="mb-4 overflow-x-auto"
            selectedKey={activeTab}
            onSelectionChange={(key) => onTabChange(key as string)}
          >
            {TABS.map((tab) => (
              <Tab key={tab.key} title={tab.label} />
            ))}
          </Tabs>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              isClearable
              className="sm:max-w-xs"
              placeholder="Search by name..."
              value={search}
              onValueChange={setSearch}
              onClear={() => setSearch("")}
              startContent={<FiSearch className="text-gray-400" />}
            />
            <Select
              aria-label="Sort"
              className="sm:max-w-[180px]"
              selectedKeys={[sort]}
              disallowEmptySelection
              onSelectionChange={(keys) =>
                setSort(Array.from(keys)[0] as SortKey)
              }
              labelPlacement="outside-left"
              label="Sort by"
            >
              <SelectItem key="recent">Most Recent</SelectItem>
              <SelectItem key="oldest">Oldest</SelectItem>
            </Select>
          </div>

          {subFilters && (
            <div className="mb-5 flex items-center gap-3">
              <Button
                isIconOnly
                radius="full"
                variant="bordered"
                aria-label="Filters"
                className="shrink-0"
              >
                <IoFilterOutline />
              </Button>
              {subFilters.map((f) => {
                const active = subFilter === f.key;
                return (
                  <Button
                    key={f.key}
                    size="sm"
                    radius="full"
                    color={active ? "primary" : "default"}
                    variant={active ? "solid" : "bordered"}
                    className={clsx(!active && "bg-white")}
                    onPress={() => setSubFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                );
              })}
            </div>
          )}

          {isDataTab ? (
            <ActivityPanel
              key={`${activeTab}-${subFilter}`}
              mode={mode}
              subFilter={subFilter}
              search={search}
              sort={sort}
              empty={EMPTY_STATES[activeTab]}
            />
          ) : (
            <EmptyState {...(EMPTY_STATES[activeTab] ?? DEFAULT_EMPTY)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
