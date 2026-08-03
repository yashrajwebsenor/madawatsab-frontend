"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addToast,
  Avatar,
  Button,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  IoCallOutline,
  IoEyeOutline,
  IoImagesOutline,
} from "react-icons/io5";
import { TiHeartFullOutline } from "react-icons/ti";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import routes from "@/app/configs/route-paths";
import {
  ActivityFeedItem,
  ActivityFeedType,
  ActivityUnreadCounts,
  ConnectionFeedItem,
  ContactView,
  GalleryRequestItem,
  Interest,
  PartnerRecommendation,
  ProfileVisit,
  Shortlist,
  User,
} from "@/app/types/types";
import { GalleryRequestStatus, InterestStatus } from "@/app/types/enum";
import usePagination from "@/app/hooks/usePagination";
import CommonUtils from "@/app/utils/common.utils";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import { MatchGridSkeleton } from "@/app/components/shared/Skeletons";
import MatchCard from "@/app/components/cards/MatchCard";
import PrivateBadge from "@/app/components/shared/PrivateBadge";

dayjs.extend(relativeTime);

type SortKey = "recent" | "oldest";
type Mode =
  | "all"
  | "interest"
  | "visits"
  | "contact"
  | "shortlist"
  | "gallery"
  | "recommendations";

// Per-type presentation for the merged All feed: a colored icon badge + the
// line describing what happened. Keeps the feed a single chronological list
// (so the Sort dropdown stays correct) while still distinguishing types.
const FEED_TYPE_META: Record<
  ActivityFeedType,
  { action: string; Icon: React.ComponentType<{ size?: number }>; iconClass: string }
> = {
  interest: {
    action: "sent you an interest",
    Icon: TiHeartFullOutline,
    iconClass: "bg-pink-100 text-pink-600",
  },
  profile_visit: {
    action: "visited your profile",
    Icon: IoEyeOutline,
    iconClass: "bg-blue-100 text-blue-600",
  },
  gallery_request: {
    action: "requested your photos",
    Icon: IoImagesOutline,
    iconClass: "bg-purple-100 text-purple-600",
  },
  contact_view: {
    action: "viewed your contact",
    Icon: IoCallOutline,
    iconClass: "bg-green-100 text-green-600",
  },
};

// Maps a tab key to its unread-count field (badge). Shortlisted is private →
// no badge; All shows the total.
const TAB_UNREAD_FIELD: Record<string, keyof ActivityUnreadCounts | undefined> =
  {
    all: "total",
    interest: "interest",
    profile_visits: "profile_visits",
    gallery_requests: "gallery_requests",
    contact_views: "contact_views",
    shortlisted: undefined,
  };

// Tab keys that mark their type read on open (backend tab name). All +
// Shortlisted never mark read.
const MARK_READ_TAB: Record<string, string | undefined> = {
  interest: "interest",
  profile_visits: "profile_visits",
  gallery_requests: "gallery_requests",
  contact_views: "contact_views",
};

// The received-side sub-filter pill that carries the unread badge (the others
// — sent / accepted / i_viewed — are never "unread").
const SUBFILTER_UNREAD_PILL: Record<string, string | undefined> = {
  interest: "received",
  profile_visits: "visited_me",
  gallery_requests: "received",
  contact_views: "viewed_mine",
};

// Every tab has real data now except `all`, which is still the interests
// feed — the merged received-feed (+ unread counts) is the last milestone.
const TABS = [
  { key: "all", label: "All" },
  { key: "interest", label: "Interest" },
  { key: "profile_visits", label: "Profile Visits" },
  { key: "gallery_requests", label: "Gallery Requests" },
  { key: "contact_views", label: "Contact Views" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "recommendations", label: "Recommendations" },
];

// Sub-filter pills per tab. Key drives the query; first entry is the default.
const SUB_FILTERS_BY_TAB: Record<string, { key: string; label: string }[]> = {
  // `all` has no sub-filters — it's a merged feed of every received activity.
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
  "recommendations",
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
  recommendations: {
    title: "No recommendations yet",
    subtitle:
      "Profiles the admin hand-picks for you will show up here.",
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

type Row = {
  id: string;
  profile: User;
  interestId?: string;
  galleryRequestId?: string;
  canAcceptDecline: boolean;
  canShortlistMessage: boolean;
  // Shortlisted tab: Shortlist button only, no Message (no connection yet).
  canMessage?: boolean;
  interestStatus?: InterestStatus;
  // ISO timestamp for the notification-style Profile Visits list.
  createdAt?: string;
  // Set on merged All-feed rows so the card can show a type chip.
  feedType?: ActivityFeedType;
};

// Profile Visits render as a vertical notification feed (like a phone's
// notification screen) instead of the MatchCard grid — avatar, name, what
// happened, and a relative timestamp ("2h ago", "3d ago").
const VisitListItem = ({
  row,
  subFilter,
}: {
  row: Row;
  subFilter: string;
}) => {
  const router = useRouter();
  const { profile, createdAt } = row;
  // Backend decides blur via subscription + privacy; fall back to isPrivate.
  const blurred = profile.shouldBlur ?? profile.isPrivate;
  const action =
    subFilter === "visited_me" ? "visited your profile" : "you visited";

  return (
    <button
      type="button"
      onClick={() => router.push(routes.matches.details(profile._id!))}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="relative shrink-0">
        <Avatar
          size="lg"
          src={profile.profilePhoto?.url}
          name={profile.fullName}
          className={clsx(blurred && "blur-[6px]")}
        />
        {profile.isPrivate && blurred && (
          <span className="absolute -bottom-1 -right-1">
            <PrivateBadge />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {CommonUtils.formatNameWithUserId({
            fullName: profile.fullName,
            userId: profile.userId,
          })}
        </p>
        <p className="truncate text-xs text-gray-500">{action}</p>
      </div>

      {createdAt && (
        <span className="shrink-0 self-start text-[11px] text-gray-400">
          {dayjs(createdAt).fromNow()}
        </span>
      )}
    </button>
  );
};

// A single row in the merged All feed: same notification-list look as Profile
// Visits, with a colored per-type icon + action line so the mixed types are
// distinguishable. Actionable rows (pending interest/gallery received) carry
// inline Accept/Decline; the row itself opens the profile.
const ActivityFeedRow = ({
  row,
  refetch,
}: {
  row: Row;
  refetch: () => void;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [respondingTo, setRespondingTo] = useState<
    "accepted" | "declined" | null
  >(null);

  const { profile, feedType, createdAt, canAcceptDecline, galleryRequestId } =
    row;
  const meta = feedType ? FEED_TYPE_META[feedType] : undefined;
  const blurred = profile.shouldBlur ?? profile.isPrivate;

  const respond = async (status: "accepted" | "declined") => {
    const isGallery = !!galleryRequestId;
    try {
      setRespondingTo(status);
      await api.patch(
        isGallery
          ? ENDPOINTS.GALLERY_REQUESTS.RESPOND(galleryRequestId!)
          : ENDPOINTS.INTERESTS.RESPOND(row.interestId!),
        { status },
      );
      addToast({
        color: "success",
        title: `${isGallery ? "Request" : "Interest"} ${status}`,
        description: `${isGallery ? "Gallery request" : "Interest"} ${status} successfully`,
      });
      refetch();
      // Acting clears it from the received feed → unread count changes too.
      queryClient.invalidateQueries({ queryKey: ["activity-unread"] });
      if (!isGallery && status === "accepted") {
        queryClient.invalidateQueries({ queryKey: ["connections"] });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(routes.matches.details(profile._id!))}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="relative shrink-0">
        <Avatar
          size="lg"
          src={profile.profilePhoto?.url}
          name={profile.fullName}
          className={clsx(blurred && "blur-[6px]")}
        />
        {meta && (
          <span
            className={clsx(
              "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white",
              meta.iconClass,
            )}
          >
            <meta.Icon size={13} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {CommonUtils.formatNameWithUserId({
            fullName: profile.fullName,
            userId: profile.userId,
          })}
        </p>
        <p className="truncate text-xs text-gray-500">{meta?.action}</p>

        {canAcceptDecline && (
          <div
            className="mt-2 flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="flat"
              color="danger"
              isLoading={respondingTo === "declined"}
              isDisabled={respondingTo !== null}
              onPress={() => respond("declined")}
            >
              Decline
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="success"
              isLoading={respondingTo === "accepted"}
              isDisabled={respondingTo !== null}
              onPress={() => respond("accepted")}
            >
              Accept
            </Button>
          </div>
        )}
      </div>

      {createdAt && (
        <span className="shrink-0 self-start text-[11px] text-gray-400">
          {dayjs(createdAt).fromNow()}
        </span>
      )}
    </div>
  );
};

// Keyed by `${tab}-${subFilter}` from the parent so it remounts on switch —
// that resets usePagination's page to 1 (avoids landing on an empty page).
const ActivityPanel = ({
  mode,
  subFilter,
  sort,
  empty,
}: {
  mode: Mode;
  subFilter: string;
  sort: SortKey;
  empty?: { title: string; subtitle: string };
}) => {
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["activity", mode, subFilter, page],
    queryFn: async (): Promise<Row[]> => {
      if (mode === "all") {
        const res: any = await api.get(ENDPOINTS.ACTIVITY.ALL, {
          params: { page, limit: 12 },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as ActivityFeedItem[]).map((i) => ({
          id: i._id,
          profile: i.profile,
          feedType: i.type,
          createdAt: i.createdAt,
          interestId: i.type === "interest" ? i._id : undefined,
          galleryRequestId: i.type === "gallery_request" ? i._id : undefined,
          // Interest is actionable only while pending; gallery rows in the
          // feed are already filtered to pending server-side.
          canAcceptDecline:
            (i.type === "interest" &&
              i.status === InterestStatus.pending) ||
            i.type === "gallery_request",
          canShortlistMessage: false,
        }));
      }

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
          canMessage: false,
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

      if (mode === "recommendations") {
        const res: any = await api.get(ENDPOINTS.RECOMMENDATIONS.LIST, {
          params: { page, limit: 12 },
        });
        setTotalPages(res?.pagination?.totalPages);
        return ((res?.data || []) as PartnerRecommendation[]).map((i) => ({
          id: i._id,
          profile: i.recommendedUserId,
          canAcceptDecline: false,
          canShortlistMessage: true,
          canMessage: false,
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
          createdAt: i.createdAt,
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
    // Drop rows whose actor no longer exists (dangling ref → null profile after
    // populate, e.g. a hard-deleted user). Every card reads profile.* so a null
    // here crashes the whole list.
    const list = (data ?? []).filter((r) => r.profile);
    // Backend returns newest-first; reverse a shallow copy for "oldest".
    return sort === "oldest" ? [...list].reverse() : list;
  }, [data, sort]);

  if (isLoading) return <MatchGridSkeleton />;

  if (rows.length === 0) {
    return <EmptyState {...(empty ?? DEFAULT_EMPTY)} />;
  }

  if (mode === "visits") {
    return (
      <>
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <VisitListItem key={row.id} row={row} subFilter={subFilter} />
          ))}
        </div>
        {renderPagination()}
      </>
    );
  }

  // Merged All feed: a single chronological notification list (same look as
  // Profile Visits) — `rows` is already ordered by the Sort dropdown.
  if (mode === "all") {
    return (
      <>
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <ActivityFeedRow key={row.id} row={row} refetch={refetch} />
          ))}
        </div>
        {renderPagination()}
      </>
    );
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
            canMessage={row.canMessage}
            canInterestSendReceive={mode === "recommendations"}
          />
        ))}
      </div>
      {renderPagination()}
    </>
  );
};

const page = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [subFilter, setSubFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const queryClient = useQueryClient();
  const subFilters = SUB_FILTERS_BY_TAB[activeTab];
  const isDataTab = DATA_TABS.has(activeTab);
  const mode: Mode =
    activeTab === "all"
      ? "all"
      : VISITS_TABS.has(activeTab)
        ? "visits"
        : activeTab === "contact_views"
          ? "contact"
          : activeTab === "shortlisted"
            ? "shortlist"
            : activeTab === "gallery_requests"
              ? "gallery"
              : activeTab === "recommendations"
                ? "recommendations"
                : "interest";

  // Unread badge counts (per-tab + total). Refetched, not socket-driven.
  const { data: unread } = useQuery({
    queryKey: ["activity-unread"],
    queryFn: async () =>
      (await api.get(ENDPOINTS.ACTIVITY.UNREAD_COUNTS)) as ActivityUnreadCounts,
  });

  // Unread count for the active tab (also used to badge its received-side pill).
  const activeTabField = TAB_UNREAD_FIELD[activeTab];
  const activeTabUnread = activeTabField ? (unread?.[activeTabField] ?? 0) : 0;
  const badgedPill = SUBFILTER_UNREAD_PILL[activeTab];

  // Opening a per-type tab marks that type read (All + Shortlisted never do).
  // Runs on mount for the default tab and on every tab switch.
  useEffect(() => {
    const markTab = MARK_READ_TAB[activeTab];
    if (!markTab) return;
    api
      .post(ENDPOINTS.ACTIVITY.MARK_READ, { tab: markTab })
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["activity-unread"] }),
      )
      .catch(() => undefined);
  }, [activeTab, queryClient]);

  const onTabChange = (key: string) => {
    setActiveTab(key);
    // Reset the sub-filter to the new tab's first pill (if it has any).
    setSubFilter(SUB_FILTERS_BY_TAB[key]?.[0]?.key ?? "");
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/60">
            Dashboard / <span className="text-amber-300">Activity</span>
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Activity</h2>
          <p className="mt-1 text-sm text-gray-300">
            Manage your connections and view profiles who showed interest in
            you.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <Tabs
            aria-label="Activity sections"
            variant="underlined"
            color="primary"
            className="mb-4 max-w-full overflow-x-auto"
            selectedKey={activeTab}
            onSelectionChange={(key) => onTabChange(key as string)}
          >
            {TABS.map((tab) => {
              const field = TAB_UNREAD_FIELD[tab.key];
              const count = field ? (unread?.[field] ?? 0) : 0;
              return (
                <Tab
                  key={tab.key}
                  title={
                    <div className="flex items-center gap-1.5">
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </div>
                  }
                />
              );
            })}
          </Tabs>

          <div className="mb-5 flex justify-end">
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
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {subFilters.map((f) => {
                const active = subFilter === f.key;
                const showPillBadge =
                  f.key === badgedPill && activeTabUnread > 0;
                return (
                  <Button
                    key={f.key}
                    size="sm"
                    radius="full"
                    color={active ? "primary" : "default"}
                    variant={active ? "solid" : "bordered"}
                    className={clsx(!active && "bg-white")}
                    onPress={() => setSubFilter(f.key)}
                    endContent={
                      showPillBadge ? (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                          {activeTabUnread > 99 ? "99+" : activeTabUnread}
                        </span>
                      ) : undefined
                    }
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
