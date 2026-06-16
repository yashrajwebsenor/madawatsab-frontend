import { Card, Input, ScrollShadow } from "@heroui/react";
import { FiSearch } from "react-icons/fi";
import ChatListCard from "./ChatListCard";
import { ChatListSkeleton } from "../shared/Skeletons";
import useChatStore from "@/app/store/useChatStore";
import useUserStore from "@/app/store/useUserStore";
import useChatRooms from "@/app/hooks/useChatRooms";
import { useEffect, useMemo, useRef, useState } from "react";
import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";

const ChatListSection = () => {
  const { user } = useUserStore();
  const [search, setSearch] = useState("");
  const [promotedRoomId, setPromotedRoomId] = useState<string | null>(null);
  const prevRoomOrderRef = useRef<string[]>([]);
  const clearPromotedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Subscribe to the stable slices and derive the ordered list with useMemo —
  // returning a freshly-built array from the selector would loop on every render.
  const roomOrder = useChatStore((s) => s.roomOrder);
  const roomsById = useChatStore((s) => s.roomsById);

  const rooms = useMemo(() => {
    // Always keep list newest-first by latest message timestamp.
    const ordered = roomOrder.map((id) => roomsById[id]).filter(Boolean);
    return ordered.sort(
      (a, b) =>
        new Date(b?.lastMessage?.createdAt || 0).getTime() -
        new Date(a?.lastMessage?.createdAt || 0).getTime(),
    );
  }, [roomOrder, roomsById]);

  const { isLoading } = useChatRooms();

  const filteredRooms = useMemo(() => {
    if (!search) return rooms || [];
    return (rooms || []).filter((room) => {
      const pariticipant = room.participants.find((p) => p._id !== user?._id);
      return pariticipant?.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [rooms, search, user?._id]);

  // Detect "room jumped to top" and trigger a short highlight animation.
  useEffect(() => {
    const prevOrder = prevRoomOrderRef.current;
    const nextTop = roomOrder[0];

    if (prevOrder.length > 0 && nextTop) {
      const previousIndex = prevOrder.indexOf(nextTop);
      if (previousIndex > 0) {
        setPromotedRoomId(nextTop);
        if (clearPromotedTimerRef.current) {
          clearTimeout(clearPromotedTimerRef.current);
        }
        clearPromotedTimerRef.current = setTimeout(() => {
          setPromotedRoomId((current) => (current === nextTop ? null : current));
        }, 450);
      }
    }

    prevRoomOrderRef.current = roomOrder;
  }, [roomOrder]);

  useEffect(() => {
    return () => {
      if (clearPromotedTimerRef.current) {
        clearTimeout(clearPromotedTimerRef.current);
      }
    };
  }, []);

  // Request presence for everyone in the list whenever the participant set
  // changes. The presence:bulk / presence:update responses are handled by the
  // global ChatSocketListener, not here.
  useEffect(() => {
    if (!rooms?.length) return;

    const participantIds = rooms
      .map((room) => room.participants.find((p) => p._id !== user?._id)?._id)
      .filter(Boolean);

    if (participantIds.length === 0) return;

    socketService.emit(socketEvents.EMIT.PRESENCE_BULK, {
      userIds: participantIds,
    });
  }, [rooms, user?._id]);

  return (
    <Card
      shadow="sm"
      className="border-none flex flex-col h-full w-full sm:max-w-[350px] backdrop-blur-md"
    >
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-800 mb-2">Messages</h2>
        <Input
          radius="full"
          placeholder="Search matches..."
          variant="bordered"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<FiSearch className="text-gray-400" />}
        />
      </div>

      <ScrollShadow hideScrollBar className="flex-1">
        {isLoading ? (
          <ChatListSkeleton />
        ) : filteredRooms?.length > 0 ? (
          <div className="flex flex-col py-1">
            {filteredRooms.map((item) => (
              <ChatListCard
                key={item._id}
                {...item}
                isPromoted={promotedRoomId === item._id}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-3">No chats found</p>
        )}
      </ScrollShadow>
    </Card>
  );
};

export default ChatListSection;
