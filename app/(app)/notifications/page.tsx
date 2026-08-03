"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Tab, Tabs } from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  IoChatbubbleEllipsesOutline,
  IoEyeOutline,
  IoImagesOutline,
  IoMegaphoneOutline,
  IoPersonOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import { TiHeartFullOutline } from "react-icons/ti";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import {
  AppNotification,
  NotificationType,
  NotificationUnreadCounts,
} from "@/app/types/types";
import usePagination from "@/app/hooks/usePagination";
import PageHeaderWrapper from "@/app/components/shared/PageHeaderWrapper";
import { MatchGridSkeleton } from "@/app/components/shared/Skeletons";

dayjs.extend(relativeTime);

// Per-type icon + color for the avatar corner badge / system fallback.
const TYPE_META: Record<
  NotificationType,
  { Icon: React.ComponentType<{ size?: number }>; iconClass: string }
> = {
  interest_received: {
    Icon: TiHeartFullOutline,
    iconClass: "bg-pink-100 text-pink-600",
  },
  interest_accepted: {
    Icon: TiHeartFullOutline,
    iconClass: "bg-pink-100 text-pink-600",
  },
  gallery_request_received: {
    Icon: IoImagesOutline,
    iconClass: "bg-purple-100 text-purple-600",
  },
  gallery_request_approved: {
    Icon: IoImagesOutline,
    iconClass: "bg-purple-100 text-purple-600",
  },
  profile_visit: {
    Icon: IoEyeOutline,
    iconClass: "bg-blue-100 text-blue-600",
  },
  new_message: {
    Icon: IoChatbubbleEllipsesOutline,
    iconClass: "bg-green-100 text-green-600",
  },
  system: {
    Icon: IoMegaphoneOutline,
    iconClass: "bg-amber-100 text-amber-600",
  },
  partner_recommendation: {
    Icon: IoSparklesOutline,
    iconClass: "bg-rose-100 text-rose-600",
  },
  agent_assigned: {
    Icon: IoPersonOutline,
    iconClass: "bg-indigo-100 text-indigo-600",
  },
};

// Backend may add NotificationTypes before the client ships an icon for them;
// fall back to the system badge so an unknown type never crashes the row.
const FALLBACK_META = TYPE_META.system;

// Messages are push-only (not stored in the feed) — the chat list already
// tracks message unread — so there is no Messages tab here.
const TABS = [
  { key: "all", label: "All" },
  { key: "interests", label: "Interests" },
  { key: "visits", label: "Visits" },
  { key: "gallery", label: "Gallery" },
  { key: "system", label: "System" },
];

// Tab key -> unread-count field (All shows the total).
const TAB_UNREAD_FIELD: Record<string, keyof NotificationUnreadCounts> = {
  all: "total",
  interests: "interests",
  visits: "visits",
  gallery: "gallery",
  system: "system",
};

const EmptyState = () => (
  <div className="py-16 text-center">
    <p className="text-lg font-semibold text-primary">No notifications</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
      You're all caught up. New activity will show up here.
    </p>
  </div>
);

const NotificationRow = ({ item }: { item: AppNotification }) => {
  const router = useRouter();
  const meta = TYPE_META[item.type] ?? FALLBACK_META;
  const actor = item.actorId;

  const open = () => {
    if (item.route) router.push(item.route);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      className={clsx(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-gray-50",
        !item.isRead && "bg-primary/5",
      )}
    >
      <div className="relative shrink-0">
        {actor ? (
          <Avatar size="lg" src={actor.profilePhoto?.url} name={actor.fullName} />
        ) : (
          <div
            className={clsx(
              "flex h-12 w-12 items-center justify-center rounded-full",
              meta.iconClass,
            )}
          >
            <meta.Icon size={20} />
          </div>
        )}
        {actor && (
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
        <p className="truncate text-sm font-semibold text-gray-900">
          {item.title}
        </p>
        <p className="truncate text-xs text-gray-500">{item.body}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 self-start">
        <span className="text-[11px] text-gray-400">
          {dayjs(item.createdAt).fromNow()}
        </span>
        {!item.isRead && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
};

// Keyed by category from the parent so it remounts on tab switch — that resets
// usePagination's page to 1 (mirrors the Activity panel).
const NotificationList = ({ category }: { category: string }) => {
  const { page, setTotalPages, renderPagination } = usePagination();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", category, page],
    queryFn: async (): Promise<AppNotification[]> => {
      const res: any = await api.get(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: {
          page,
          limit: 15,
          ...(category !== "all" ? { category } : {}),
        },
      });
      setTotalPages(res?.pagination?.totalPages);
      return (res?.data || []) as AppNotification[];
    },
  });

  if (isLoading) return <MatchGridSkeleton />;

  const rows = data ?? [];
  if (rows.length === 0) return <EmptyState />;

  return (
    <>
      <div className="divide-y divide-gray-100">
        {rows.map((item) => (
          <NotificationRow key={item._id} item={item} />
        ))}
      </div>
      {renderPagination()}
    </>
  );
};

const page = () => {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () =>
      (await api.get(
        ENDPOINTS.NOTIFICATIONS.UNREAD_COUNTS,
      )) as NotificationUnreadCounts,
  });

  // Opening a per-category tab marks that category read (All never does — same
  // semantics as the Activity tabs). Refresh both the badge counts and the
  // visible list so the unread highlights clear.
  useEffect(() => {
    if (activeTab === "all") return;
    api
      .post(ENDPOINTS.NOTIFICATIONS.MARK_READ, { category: activeTab })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", activeTab] });
      })
      .catch(() => undefined);
  }, [activeTab, queryClient]);

  const markAllRead = () => {
    api
      .post(ENDPOINTS.NOTIFICATIONS.MARK_READ, {})
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(() => undefined);
  };

  return (
    <div>
      <PageHeaderWrapper>
        <div className="container">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/60">
            Dashboard / <span className="text-amber-300">Notifications</span>
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            Interests, messages, profile visits and more — all in one place.
          </p>
        </div>
      </PageHeaderWrapper>

      <div className="container py-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Tabs
              aria-label="Notification categories"
              variant="underlined"
              color="primary"
              className="max-w-full overflow-x-auto"
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              {TABS.map((tab) => {
                const count = unread?.[TAB_UNREAD_FIELD[tab.key]] ?? 0;
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

            {(unread?.total ?? 0) > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="shrink-0"
                onPress={markAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>

          <NotificationList key={activeTab} category={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default page;
