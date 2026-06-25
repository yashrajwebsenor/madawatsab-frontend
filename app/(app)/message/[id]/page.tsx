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
import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FiChevronDown } from "react-icons/fi";
import { Message } from "@/app/types/types";

const MESSAGE_LIMIT = 20;

// Stable reference so the selector doesn't return a new array on every render.
const EMPTY_MESSAGES: Message[] = [];

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { user } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Zero-height markers at each visual edge of the list. We detect "near the
  // top/bottom" from their bounding rects, which is independent of how the
  // browser signs scrollTop in a flex-col-reverse container (it differs between
  // Chrome versions: some use 0..max, others 0..-max).
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [fetchingOlder, setFetchingOlder] = useState(false);
  const [fetchingNewer, setFetchingNewer] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  // Blocks the auto-scroll-to-bottom effect during paging and right after a
  // jump so it doesn't fight the scroll-into-view / preserved scroll position.
  const suppressAutoScroll = useRef(false);
  // True ONLY while a search-jump's programmatic smooth-scroll is animating.
  // handleScroll ignores scroll events in this window so the jump's own scroll
  // can't trigger a spurious page. Kept separate from suppressAutoScroll on
  // purpose: paging must never block scroll DETECTION, or a fast/continuous
  // scroll gesture during the ~600ms load window gets swallowed and only one
  // batch ever loads (the re-entrancy guards below already stop double-loads).
  const isJumping = useRef(false);
  // Jump timers live in a ref (not effect-cleanup): the centering effect calls
  // clearPendingScroll, which nulls its own dependency and re-runs it. If the
  // release timer were cancelled by that re-run's cleanup, isJumping/suppress
  // would stay stuck true forever and ALL paging would die after a jump.
  const jumpTimers = useRef<{
    highlight?: ReturnType<typeof setTimeout>;
    release?: ReturnType<typeof setTimeout>;
  }>({});
  // Set by loadNewer just before the store prepend so the layout effect can
  // restore scroll position. In flex-col-reverse, newer rows are added at the
  // visual BOTTOM (front of the array) — without a restore the viewport snaps
  // to the newest row instead of staying on the messages the user was reading.
  const newerRestore = useRef<{ refId: string; top: number } | null>(null);

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
  // normal tail view and a jumped window. The flex-col-reverse container keeps
  // the viewport anchored to the bottom, so the prepend preserves scroll
  // position on its own (see note below).
  const loadOlder = useCallback(async () => {
    if (!hasMore || fetchingOlder || isLoading || messages.length === 0) return;
    // Keep the auto-scroll-to-bottom effect from yanking us down when the
    // prepend bumps messages.length.
    suppressAutoScroll.current = true;
    setFetchingOlder(true);
    try {
      const oldest = messages[messages.length - 1];
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: { beforeId: oldest._id, limit: MESSAGE_LIMIT },
      });
      prependOlderMessages(id, res?.data ?? [], !!res?.hasMore);
      // No manual scroll restore: in flex-col-reverse the BOTTOM is the scroll
      // anchor, so prepending older rows at the visual top leaves scrollTop
      // unchanged and the viewport stays put on its own. (A manual restore here
      // computes a positive scrollTop that clamps to 0 = bottom, yanking the
      // user back to the newest message after the first page.)
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
    const refId = messages[0]?._id;
    try {
      const newest = messages[0];
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: { afterId: newest._id, limit: MESSAGE_LIMIT },
      });
      // Record where the current-newest row sits RIGHT BEFORE the prepend so the
      // layout effect can keep it under the user's eyes (sign-agnostic rect
      // delta — works regardless of how this browser signs col-reverse
      // scrollTop). Skip the restore if there's nothing new to add.
      const data = res?.data ?? [];
      const container = scrollRef.current;
      const refEl = refId ? document.getElementById(`msg-${refId}`) : null;
      if (data.length > 0 && container && refEl) {
        const top =
          refEl.getBoundingClientRect().top -
          container.getBoundingClientRect().top;
        newerRestore.current = { refId, top };
      }
      prependNewerMessages(id, data, !!res?.hasMore);
    } catch (error) {
      console.error("Error loading newer messages:", error);
    } finally {
      setFetchingNewer(false);
      setTimeout(() => {
        suppressAutoScroll.current = false;
      }, 300);
    }
  }, [hasNewer, fetchingNewer, messages, id, prependNewerMessages]);

  // Restore scroll position after a newer-prepend, synchronously before paint so
  // there's no visible jump. Runs on every messages change but no-ops unless
  // loadNewer armed newerRestore (loadOlder/jump/live-append leave it null).
  useLayoutEffect(() => {
    const r = newerRestore.current;
    if (!r) return;
    newerRestore.current = null;
    const container = scrollRef.current;
    const el = document.getElementById(`msg-${r.refId}`);
    if (!container || !el) return;
    const top =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTop += top - r.top;
  }, [messages.length]);

  // Proximity-based infinite scroll. A scroll listener re-checks on every move,
  // so paging keeps working batch after batch (an IntersectionObserver only
  // fires on intersection *changes* and can stay silent when the trigger row
  // stays in view).
  //
  // We measure proximity from the edge sentinels' bounding rects rather than
  // scrollTop, because flex-col-reverse signs scrollTop inconsistently across
  // browsers. cr = container rect (viewport coords, y grows downward):
  //   - near the visual TOP (oldest): the top sentinel sits at/just past the
  //     container's top edge -> `cr.top - top.top <= THRESHOLD`.
  //   - near the visual BOTTOM (newest): the bottom sentinel sits at/just past
  //     the container's bottom edge -> `bottom.bottom - cr.bottom <= THRESHOLD`.
  const THRESHOLD_PX = 250;
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Ignore ONLY the jump's programmatic smooth-scroll so it isn't hijacked
    // into a spurious page. Do NOT gate on suppressAutoScroll here: loadOlder /
    // loadNewer already guard against re-entrant loads (fetchingOlder /
    // fetchingNewer), and blocking detection during the paging suppress window
    // swallows continuous scroll gestures — the cause of "loads only once".
    if (isJumping.current) return;
    const cr = el.getBoundingClientRect();
    const top = topSentinelRef.current?.getBoundingClientRect();
    const bottom = bottomSentinelRef.current?.getBoundingClientRect();
    if (top && cr.top - top.top <= THRESHOLD_PX) loadOlder();
    if (bottom && bottom.bottom - cr.bottom <= THRESHOLD_PX) loadNewer();
  }, [loadOlder, loadNewer]);

  // Re-arm after each batch settles. A scroll listener alone can stall: if a
  // single flick's momentum dies while a fetch is still in flight, no further
  // scroll event fires after it resolves, so paging stops one batch in. Once the
  // content changes we re-check proximity — if still within the threshold (short
  // batch, or the viewport isn't filled yet) we keep paging to the edge. This is
  // self-limiting: prepending older rows pushes the top sentinel well past the
  // threshold, so it stops as soon as enough is loaded. hasMore / fetching
  // guards inside loadOlder/loadNewer prevent any runaway.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      // Checked here (not synchronously): the jump effect runs after this one in
      // the same commit, so the flag is only reliably set by the next frame.
      if (isJumping.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const cr = el.getBoundingClientRect();
      const top = topSentinelRef.current?.getBoundingClientRect();
      const bottom = bottomSentinelRef.current?.getBoundingClientRect();
      if (top && cr.top - top.top <= THRESHOLD_PX) loadOlder();
      if (bottom && bottom.bottom - cr.bottom <= THRESHOLD_PX) loadNewer();
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length, loadOlder, loadNewer]);

  // After a jump the store holds the context window + pendingScrollMessageId.
  // Center the anchor and flash-highlight it once the window has rendered.
  // NOTE: `Element.scrollIntoView` is unreliable inside a `flex-col-reverse`
  // scroll container (the inverted axis makes it no-op / scroll the wrong way),
  // so we compute the container scrollTop manually via bounding rects.
  useEffect(() => {
    if (!pendingScrollMessageId) return;
    // Read the window straight from the store: loadContextWindow sets the
    // messages and pendingScrollMessageId together, so the anchor is already
    // present. Depending on `messages` here would re-run this effect on every
    // unrelated message change (read receipt, delete, resync) and its cleanup
    // would cancel the highlight/scroll-release timeouts mid-flight — leaving
    // suppressAutoScroll stuck on and paging dead.
    const current = useChatStore.getState().messagesByRoom[id] ?? [];
    if (!current.some((m) => m._id === pendingScrollMessageId)) return;

    const targetId = pendingScrollMessageId;
    suppressAutoScroll.current = true;
    isJumping.current = true;
    // Clear any in-flight jump timers from a previous jump (rapid re-search)
    // before arming new ones.
    if (jumpTimers.current.highlight) clearTimeout(jumpTimers.current.highlight);
    if (jumpTimers.current.release) clearTimeout(jumpTimers.current.release);
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

    // Flash the themed ring for ~1s after landing (the bubble's
    // transition-all duration-500 fades it in/out), then release the scroll
    // lock once the smooth-scroll has settled. Timers are stored in a ref — NOT
    // cancelled via effect cleanup — because clearPendingScroll above nulls this
    // effect's own dependency, immediately re-running it; an effect-cleanup
    // cancel would kill the release timer on that re-run and leave isJumping
    // stuck true, which silently breaks ALL paging after a jump.
    jumpTimers.current.highlight = setTimeout(() => setHighlightedId(null), 1500);
    jumpTimers.current.release = setTimeout(() => {
      suppressAutoScroll.current = false;
      isJumping.current = false;
    }, 1000);
  }, [pendingScrollMessageId, id, clearPendingScroll]);

  // Cancel any pending jump timers on unmount so they can't fire after the
  // component is gone.
  useEffect(
    () => () => {
      if (jumpTimers.current.highlight)
        clearTimeout(jumpTimers.current.highlight);
      if (jumpTimers.current.release) clearTimeout(jumpTimers.current.release);
    },
    [],
  );

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
              {/* Visual BOTTOM (newest end): sentinel + newer-loading spinner. */}
              <div ref={bottomSentinelRef} aria-hidden className="h-0" />
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

              {/* Visual TOP (oldest end): older-loading spinner + sentinel. */}
              {(isLoading || fetchingOlder) && <LoadingProgress />}
              <div ref={topSentinelRef} aria-hidden className="h-0" />
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
