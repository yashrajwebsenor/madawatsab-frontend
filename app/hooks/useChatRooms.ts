"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import ENDPOINTS from "../api/endpoints";
import useChatStore from "../store/useChatStore";
import useUserStore from "../store/useUserStore";
import { ChatRoom, ChatRoomParticipant } from "../types/types";

/**
 * Fetches the user's chat rooms and syncs them into the chat store. Shares the
 * ["chat-rooms"] query cache, so calling it from the app shell (for the navbar
 * unread badge) and from the chat list at the same time triggers only one
 * request. The store keeps per-room unread counts live via socket events.
 */
const useChatRooms = () => {
  const user = useUserStore((s) => s.user);
  const setRooms = useChatStore((s) => s.setRooms);
  const setParticipants = useChatStore((s) => s.setParticipants);

  return useQuery({
    queryKey: ["chat-rooms"],
    enabled: !!user?._id,
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.CHAT.GET_ROOMS, {
        params: { page: 1, limit: 10 },
      });

      const rooms = (res?.data || []) as ChatRoom[];
      setRooms(rooms);

      const participants = rooms.reduce(
        (acc, room) => {
          const participant = room.participants.find(
            (p) => p._id !== user?._id,
          );
          if (participant) acc[room._id] = participant;
          return acc;
        },
        {} as Record<string, ChatRoomParticipant>,
      );
      setParticipants(participants);

      return rooms;
    },
  });
};

export default useChatRooms;
