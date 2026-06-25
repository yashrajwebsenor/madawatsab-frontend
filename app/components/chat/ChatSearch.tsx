"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import useDebounce from "@/app/hooks/useDebounce";
import useChatStore from "@/app/store/useChatStore";
import useUserStore from "@/app/store/useUserStore";
import { MessageSearchSkeleton } from "@/app/components/shared/Skeletons";
import { Message } from "@/app/types/types";
import { CircularProgress, Input } from "@heroui/react";
import {
  keepPreviousData,
  useInfiniteQuery,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { Fragment, useEffect, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

const RESULT_LIMIT = 20;
const MIN_QUERY = 2;

type SearchResponse = {
  data: Message[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Build a snippet centered on the first match so a hit deep inside a long
// message is still visible, then highlight every occurrence of the term.
const renderSnippet = (text: string, q: string) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  const radius = 40;

  let snippet = text;
  let prefix = "";
  let suffix = "";
  if (idx >= 0) {
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + q.length + radius);
    snippet = text.slice(start, end);
    prefix = start > 0 ? "…" : "";
    suffix = end < text.length ? "…" : "";
  } else {
    snippet = text.slice(0, 90);
    suffix = text.length > 90 ? "…" : "";
  }

  const parts = snippet.split(new RegExp(`(${escapeRegex(q)})`, "ig"));
  return (
    <>
      {prefix}
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="bg-primary/20 text-primary rounded px-0.5 font-medium"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
      {suffix}
    </>
  );
};

const ChatSearch = ({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) => {
  const { user } = useUserStore();
  const participant = useChatStore((s) => s.participants[roomId]);
  const loadContextWindow = useChatStore((s) => s.loadContextWindow);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim();
  const enabled = trimmed.length >= MIN_QUERY;

  const [jumpingId, setJumpingId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat-search", roomId, trimmed],
    enabled,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      return (await api.get(ENDPOINTS.CHAT.SEARCH_MESSAGES(roomId), {
        params: { q: trimmed, page: pageParam, limit: RESULT_LIMIT },
      })) as unknown as SearchResponse;
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  });

  const results = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  // Infinite scroll: load more results as the sentinel enters view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, results.length]);

  const handleJump = async (messageId: string) => {
    if (jumpingId) return;
    setJumpingId(messageId);
    try {
      const res = (await api.get(
        ENDPOINTS.CHAT.MESSAGES_AROUND(roomId, messageId),
      )) as unknown as {
        data: Message[];
        hasOlder: boolean;
        hasNewer: boolean;
        anchorId: string;
      };
      loadContextWindow(
        roomId,
        res.data,
        res.hasOlder,
        res.hasNewer,
        res.anchorId,
      );
      onClose();
    } catch {
      // api interceptor already surfaced a toast.
    } finally {
      setJumpingId(null);
    }
  };

  return (
    <div className="absolute inset-x-0 top-0 z-20 bg-white border-b shadow-sm">
      <div className="h-[60px] px-3 flex items-center gap-2">
        <Input
          autoFocus
          radius="full"
          variant="bordered"
          placeholder="Search in conversation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          startContent={<FiSearch className="text-gray-400" />}
          classNames={{ inputWrapper: "border-none bg-gray-100/80" }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Results dropdown — only once a real query is entered. */}
      {trimmed.length > 0 && (
        <div className="max-h-[60vh] overflow-y-auto border-t border-gray-100">
          {trimmed.length < MIN_QUERY ? (
            <p className="text-center text-xs text-gray-400 py-4">
              Type at least {MIN_QUERY} characters to search
            </p>
          ) : isLoading ? (
            <MessageSearchSkeleton />
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">
              No messages found
            </p>
          ) : (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wide text-gray-400">
                {total} {total === 1 ? "result" : "results"}
              </p>
              <div className="flex flex-col divide-y divide-gray-100">
                {results.map((msg) => {
                  const isMe = msg.senderId === user?._id;
                  return (
                    <button
                      key={msg._id}
                      type="button"
                      onClick={() => handleJump(msg._id)}
                      className="text-left px-4 py-3 hover:bg-gray-50 transition-colors flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700 truncate min-w-0">
                          {isMe ? "You" : participant?.fullName || "Them"}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                          {dayjs(msg.createdAt).format("DD MMM YYYY")}
                          {jumpingId === msg._id && (
                            <CircularProgress size="sm" aria-label="Opening" />
                          )}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-600 leading-snug line-clamp-2 break-words min-w-0">
                        {renderSnippet(msg.content, trimmed)}
                      </p>
                    </button>
                  );
                })}
              </div>
              {isFetchingNextPage && (
                <div className="py-3">
                  <MessageSearchSkeleton count={2} />
                </div>
              )}
              <div ref={sentinelRef} className="h-1 w-full" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSearch;
