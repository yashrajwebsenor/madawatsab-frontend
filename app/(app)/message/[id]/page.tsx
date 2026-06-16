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
import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { use, useEffect, useRef, useState } from "react";
import { Message } from "@/app/types/types";

const MESSAGE_LIMIT = 20;

// Stable reference so the selector doesn't return a new array on every render.
const EMPTY_MESSAGES: Message[] = [];

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { user } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchingMore, setFetchingMore] = useState(false);
  const isFetchingMore = useRef(false);
  const observerTarget = useRef(null);

  const messages = useChatStore((s) => s.messagesByRoom[id] ?? EMPTY_MESSAGES);
  const hasMore = useChatStore((s) => s.hasMoreByRoom[id] ?? true);
  const { setMessages, prependOlderMessages, setActiveRoom, markRoomRead } =
    useChatStore();

  const { isLoading } = useQuery({
    queryKey: ["chats", id],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: {
          page: 1,
          limit: MESSAGE_LIMIT,
        },
      });
      const data = res?.data ?? [];
      setMessages(id, data, data.length === MESSAGE_LIMIT);
      return data;
    },
  });

  // This room is now the active one: clear unread, tell the backend, and let
  // the global listener route incoming messages straight into it.
  useEffect(() => {
    setCurrentPage(1);
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

  const loadMore = async () => {
    if (!hasMore || fetchingMore || isLoading) return;

    isFetchingMore.current = true;
    setFetchingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res: any = await api.get(ENDPOINTS.CHAT.GET_MESSAGES(id), {
        params: {
          page: nextPage,
          limit: MESSAGE_LIMIT,
        },
      });

      const newData = res?.data ?? [];
      if (newData.length > 0) {
        prependOlderMessages(id, newData, newData.length === MESSAGE_LIMIT);
        setCurrentPage(nextPage);
      } else {
        prependOlderMessages(id, [], false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setFetchingMore(false);
      // Small delay to ensure the scroll position is maintained before allowing auto-scroll again
      setTimeout(() => {
        isFetchingMore.current = false;
      }, 500);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !fetchingMore &&
          !isLoading
        ) {
          loadMore();
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, fetchingMore, isLoading, currentPage, id]);

  useEffect(() => {
    if (scrollRef.current && !isFetchingMore.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

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
          className="flex-1 flex flex-col-reverse overflow-y-auto p-4"
        >
          {messages?.length > 0 ? (
            <>
              {(() => {
                const latestMyMessageIndex = messages.findIndex(
                  (m) => m.senderId === user?._id,
                );
                const lastReadMyMessageIndex = messages.findIndex(
                  (m) => m.senderId === user?._id && m.isRead,
                );
                return messages.map((item, index) =>
                  item?.type === MessageTypes.text ? (
                    <TextMessage
                      key={item._id ?? index}
                      message={item}
                      isMe={item.senderId === user?._id}
                      showSeen={
                        index === lastReadMyMessageIndex ||
                        (index === latestMyMessageIndex && !item.isRead)
                      }
                    />
                  ) : (
                    <AttachmentMessage
                      key={item._id ?? index}
                      message={item}
                      isMe={item.senderId === user?._id}
                      showSeen={
                        index === lastReadMyMessageIndex ||
                        (index === latestMyMessageIndex && !item.isRead)
                      }
                    />
                  ),
                );
              })()}
              <div ref={observerTarget} className="h-1 w-full" />
            </>
          ) : (
            <p className="text-center text-gray-400">No messages yet</p>
          )}

          {(isLoading || fetchingMore) && <LoadingProgress />}
        </div>

        <ChatFooter />
      </Card>
    </div>
  );
};

export default Page;
