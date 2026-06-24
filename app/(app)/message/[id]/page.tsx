"use client";

import api from "@/app/api/api";
import ENDPOINTS from "@/app/api/endpoints";
import AttachmentMessage from "@/app/components/chat/AttachmentMessage";
import ChatFooter from "@/app/components/chat/ChatFooter";
import ChatHeader from "@/app/components/chat/ChatHeader";
import ChatListSection from "@/app/components/chat/ChatListSection";
import TextMessage from "@/app/components/chat/TextMessage";
import LoadingProgress from "@/app/components/shared/LoadingProgress";
import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";
import useChatStore from "@/app/store/useChatStore";
import useUserStore from "@/app/store/useUserStore";
import { MessageTypes } from "@/app/types/enum";
import { Button, Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Message } from "@/app/types/types";

const MESSAGE_LIMIT = 20;

// Stable reference so the selector doesn't return a new array on every render.
const EMPTY_MESSAGES: Message[] = [];

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { user } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fetchingOlder, setFetchingOlder] = useState(false);
  const [fetchingNewer, setFetchingNewer] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  // Blocks the auto-scroll-to-bottom effect during paging and right after a
  // jump so it doesn't fight the scroll-into-view / preserved scroll position.
  const suppressAutoScroll = useRef(false);

  const messages = useChatStore((s) => s.messagesByRoom[id] ?? EMPTY_MESSAGES);
  const hasMore = useChatStore((s) => s.hasMoreByRoom[id] ?? true);
  const hasNewer = useChatStore((s) => s.hasNewerByRoom[id] ?? false);
  const pendingScrollMessageId = useChatStore((s) => s.pendingScrollMessageId);
  const {
    setMessages,
    prependOlderMessages,
    prependNewerMessages,
    clearPendingScroll,
    setActiveRoom,
    markRoomRead,
  } = useChatStore();

  // Initial load is the live tail (page 1). Background refetches are disabled so
  // a focus/reconnect can't clobber a jumped (detached) window — live updates
  // arrive over the socket, not this query. A fresh mount still reloads the tail.
  const { isLoading } = useQuery({
    queryKey: ["chats", id],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: { page: 1, limit: MESSAGE_LIMIT },
      });
      const data = res?.data ?? [];
      setMessages(id, data, data.length === MESSAGE_LIMIT);
      return data;
    },
  });

  // This room is now the active one: clear unread, tell the backend, and let
  // the global listener route incoming messages straight into it.
  useEffect(() => {
    setActiveRoom(id);

    if (user?._id) {
      markRoomRead(id);
      socketService.emit(socketEvents.EMIT.READ_MESSAGES, {
        roomId: id,
        userId: user._id,
      });
    }

    return () => setActiveRoom(null);
  }, [id, user?._id, setActiveRoom, markRoomRead]);

  // Load OLDER messages (visual top). Cursor-based so it works for both the
  // normal tail view and a jumped window. Preserves the user's scroll position
  // across the prepend so the view doesn't jump and the trigger zone doesn't
  // stay armed (which would burst-load the whole history).
  const loadOlder = useCallback(async () => {
    if (!hasMore || fetchingOlder || isLoading || messages.length === 0) return;
    suppressAutoScroll.current = true;
    setFetchingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;
    try {
      const oldest = messages[messages.length - 1];
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: { beforeId: oldest._id, limit: MESSAGE_LIMIT },
      });
      prependOlderMessages(id, res?.data ?? [], !!res?.hasMore);
      // Restore position after the new (visual-top) rows render: keep the same
      // message under the viewport and move scrollTop off the top edge.
      requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (node) node.scrollTop = prevTop + (node.scrollHeight - prevHeight);
      });
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setFetchingOlder(false);
      setTimeout(() => {
        suppressAutoScroll.current = false;
      }, 300);
    }
  }, [hasMore, fetchingOlder, isLoading, messages, id, prependOlderMessages]);

  // Load NEWER messages (visual bottom). Only relevant in a detached window.
  const loadNewer = useCallback(async () => {
    if (!hasNewer || fetchingNewer || messages.length === 0) return;
    suppressAutoScroll.current = true;
    setFetchingNewer(true);
    try {
      const newest = messages[0];
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: { afterId: newest._id, limit: MESSAGE_LIMIT },
      });
      prependNewerMessages(id, res?.data ?? [], !!res?.hasMore);
    } catch (error) {
      console.error("Error loading newer messages:", error);
    } finally {
      setFetchingNewer(false);
      setTimeout(() => {
        suppressAutoScroll.current = false;
      }, 300);
    }
  }, [hasNewer, fetchingNewer, messages, id, prependNewerMessages]);

  // Proximity-based infinite scroll. A scroll listener re-checks on every move,
  // so paging keeps working batch after batch (an IntersectionObserver only
  // fires on intersection *changes* and can stay silent when the trigger row
  // stays in view). scrollTop is 0 at the visual top here (col-reverse still
  // uses standard scrollTop in this app).
  const THRESHOLD_PX = 250;
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop <= THRESHOLD_PX) loadOlder();
    if (scrollHeight - (scrollTop + clientHeight) <= THRESHOLD_PX) loadNewer();
  }, [loadOlder, loadNewer]);

  // After a jump the store holds the context window + pendingScrollMessageId.
  // Center the anchor and flash-highlight it once the window has rendered.
  // NOTE: `Element.scrollIntoView` is unreliable inside a `flex-col-reverse`
  // scroll container (the inverted axis makes it no-op / scroll the wrong way),
  // so we compute the container scrollTop manually via bounding rects.
  useEffect(() => {
    if (!pendingScrollMessageId) return;
    if (!messages.some((m) => m._id === pendingScrollMessageId)) return;

    const targetId = pendingScrollMessageId;
    suppressAutoScroll.current = true;
    clearPendingScroll();

    let attempts = 0;
    const centerOnTarget = () => {
      const container = scrollRef.current;
      const el = document.getElementById(`msg-${targetId}`);
      if (container && el) {
        const cRect = container.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        // Delta to bring the element's center to the container's center.
        const delta =
          eRect.top - cRect.top - (container.clientHeight - eRect.height) / 2;
        container.scrollTo({
          top: container.scrollTop + delta,
          behavior: "smooth",
        });
        setHighlightedId(targetId);
        return;
      }
      // Window may not be painted yet on the first frame — retry a few times.
      if (attempts++ < 8) requestAnimationFrame(centerOnTarget);
    };
    requestAnimationFrame(centerOnTarget);

    const clearHighlight = setTimeout(() => setHighlightedId(null), 2200);
    const releaseScroll = setTimeout(() => {
      suppressAutoScroll.current = false;
    }, 1000);
    return () => {
      clearTimeout(clearHighlight);
      clearTimeout(releaseScroll);
    };
  }, [pendingScrollMessageId, messages, clearPendingScroll]);

  // Stick to the bottom on new content — but only in live mode (not detached)
  // and never while paging / jumping.
  useEffect(() => {
    if (suppressAutoScroll.current || hasNewer) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, hasNewer]);

  // Return to the live tail from a jumped window.
  const jumpToLatest = async () => {
    try {
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: { page: 1, limit: MESSAGE_LIMIT },
      });
      const data = res?.data ?? [];
      // setMessages resets hasNewer -> live append resumes.
      setMessages(id, data, data.length === MESSAGE_LIMIT);
      markRoomRead(id);
      if (user?._id) {
        socketService.emit(socketEvents.EMIT.READ_MESSAGES, {
          roomId: id,
          userId: user._id,
        });
      }
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    } catch (error) {
      console.error("Error jumping to latest:", error);
    }
  };

  return (
    <div className="flex gap-3 container py-5 h-[calc(100dvh-70px)] relative">
      <div className="hidden sm:block">
        <ChatListSection />
      </div>

      <Card
        shadow="sm"
        className="flex-1 border-none h-full overflow-hidden relative flex flex-col"
      >
        <ChatHeader roomId={id} />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col-reverse overflow-y-auto p-4"
        >
          {messages?.length > 0 ? (
            <>
              {/* Visual BOTTOM (newest end): newer-loading spinner. */}
              {fetchingNewer && <LoadingProgress />}

              {(() => {
                const latestMyMessageIndex = messages.findIndex(
                  (m) => m.senderId === user?._id,
                );
                const lastReadMyMessageIndex = messages.findIndex(
                  (m) => m.senderId === user?._id && m.isRead,
                );
                return messages.map((item, index) => {
                  const showSeen =
                    index === lastReadMyMessageIndex ||
                    (index === latestMyMessageIndex && !item.isRead);
                  const isMe = item.senderId === user?._id;
                  return (
                    <div key={item._id ?? index} id={`msg-${item._id}`}>
                      {item?.type === MessageTypes.text ? (
                        <TextMessage
                          message={item}
                          isMe={isMe}
                          showSeen={showSeen}
                          isHighlighted={highlightedId === item._id}
                        />
                      ) : (
                        <AttachmentMessage
                          message={item}
                          isMe={isMe}
                          showSeen={showSeen}
                          isHighlighted={highlightedId === item._id}
                        />
                      )}
                    </div>
                  );
                });
              })()}

              {/* Visual TOP (oldest end): older-loading spinner. */}
              {(isLoading || fetchingOlder) && <LoadingProgress />}
            </>
          ) : isLoading ? (
            <LoadingProgress />
          ) : (
            <p className="text-center text-gray-400">No messages yet</p>
          )}
        </div>

        {/* Resync to the live tail when viewing a detached (jumped) window. */}
        {hasNewer && (
          <Button
            isIconOnly
            radius="full"
            color="primary"
            aria-label="Jump to latest messages"
            onPress={jumpToLatest}
            className="absolute bottom-24 right-4 z-10 shadow-lg shadow-primary/30"
          >
            <FiChevronDown size={20} />
          </Button>
        )}

        <ChatFooter />
      </Card>
    </div>
  );
};

export default Page;
