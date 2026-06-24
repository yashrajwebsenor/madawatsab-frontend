import { create } from "zustand";
import { ChatRoom, ChatRoomParticipant, Message } from "../types/types";

/**
 * Messages for a room are stored newest-first (index 0 is the most recent
 * message), matching the column-reverse rendering in the chat screen.
 */
interface UseChatStore {
  roomsById: Record<string, ChatRoom>;
  roomOrder: string[];
  messagesByRoom: Record<string, Message[]>;
  hasMoreByRoom: Record<string, boolean>;
  // True while the visible window for a room is a detached mid-history slice
  // (after a search jump) that does NOT include the newest message. When true,
  // live socket messages must not be appended (would leave a gap) and the
  // "jump to latest" pill is shown.
  hasNewerByRoom: Record<string, boolean>;
  // Message id the chat screen should scroll to + briefly highlight after a
  // jump. Consumed once, then cleared via clearPendingScroll.
  pendingScrollMessageId: string | null;
  activeRoomId: string | null;
  participants: Record<string, ChatRoomParticipant>;
  onlineUsers: Record<string, boolean>;

  // rooms
  setRooms: (rooms: ChatRoom[]) => void;
  upsertRoom: (room: ChatRoom) => void;
  upsertRoomFromMessage: (message: Message) => void;
  incrementUnread: (roomId: string) => void;
  markRoomRead: (roomId: string) => void;

  // messages
  setMessages: (roomId: string, messages: Message[], hasMore: boolean) => void;
  prependOlderMessages: (
    roomId: string,
    messages: Message[],
    hasMore: boolean,
  ) => void;
  // Adds messages toward the NEWER end (index 0 side). Mirror of
  // prependOlderMessages; used when paging downward from a jumped window.
  prependNewerMessages: (
    roomId: string,
    messages: Message[],
    hasNewer: boolean,
  ) => void;
  // Replaces the visible messages with a context window around a searched
  // message and arms the scroll/highlight. hasNewer marks the detached state.
  loadContextWindow: (
    roomId: string,
    messages: Message[],
    hasOlder: boolean,
    hasNewer: boolean,
    anchorId: string,
  ) => void;
  clearPendingScroll: () => void;
  appendMessage: (message: Message) => void;
  markMessagesReadInRoom: (roomId: string, readerId: string) => void;

  // active room
  setActiveRoom: (roomId: string | null) => void;

  // participants & presence
  setParticipants: (participants: Record<string, ChatRoomParticipant>) => void;
  upsertParticipant: (roomId: string, participant: ChatRoomParticipant) => void;
  setOnlineUsers: (onlineUsers: Record<string, boolean>) => void;
  updateUserPresence: (userId: string, isOnline: boolean) => void;
}

const lastMessageTime = (room?: ChatRoom) =>
  new Date(room?.lastMessage?.createdAt || 0).getTime();

const sortRoomOrder = (roomsById: Record<string, ChatRoom>) =>
  Object.keys(roomsById).sort(
    (a, b) => lastMessageTime(roomsById[b]) - lastMessageTime(roomsById[a]),
  );

const useChatStore = create<UseChatStore>()((set) => ({
  roomsById: {},
  roomOrder: [],
  messagesByRoom: {},
  hasMoreByRoom: {},
  hasNewerByRoom: {},
  pendingScrollMessageId: null,
  activeRoomId: null,
  participants: {},
  onlineUsers: {},

  setRooms: (rooms) =>
    set(() => {
      const roomsById = rooms.reduce(
        (acc, room) => {
          acc[room._id] = room;
          return acc;
        },
        {} as Record<string, ChatRoom>,
      );
      return { roomsById, roomOrder: sortRoomOrder(roomsById) };
    }),

  upsertRoom: (room) =>
    set((state) => {
      const roomsById = {
        ...state.roomsById,
        [room._id]: { ...(state.roomsById[room._id] ?? {}), ...room },
      };
      return { roomsById, roomOrder: sortRoomOrder(roomsById) };
    }),

  upsertRoomFromMessage: (message) =>
    set((state) => {
      const existing = state.roomsById[message.roomId];
      if (!existing) return state;

      const roomsById = {
        ...state.roomsById,
        [message.roomId]: { ...existing, lastMessage: message },
      };
      return { roomsById, roomOrder: sortRoomOrder(roomsById) };
    }),

  incrementUnread: (roomId) =>
    set((state) => {
      const existing = state.roomsById[roomId];
      if (!existing) return state;
      return {
        roomsById: {
          ...state.roomsById,
          [roomId]: {
            ...existing,
            unreadCount: (existing.unreadCount ?? 0) + 1,
          },
        },
      };
    }),

  markRoomRead: (roomId) =>
    set((state) => {
      const existing = state.roomsById[roomId];
      if (!existing) return state;
      return {
        roomsById: {
          ...state.roomsById,
          [roomId]: { ...existing, unreadCount: 0 },
        },
      };
    }),

  setMessages: (roomId, messages, hasMore) =>
    set((state) => ({
      messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
      hasMoreByRoom: { ...state.hasMoreByRoom, [roomId]: hasMore },
      // A fresh page-1 load is anchored at the live tail — no newer messages
      // exist beyond it, so the window is back in live mode.
      hasNewerByRoom: { ...state.hasNewerByRoom, [roomId]: false },
    })),

  prependOlderMessages: (roomId, messages, hasMore) =>
    set((state) => ({
      // Older messages sit at the end of the newest-first array.
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: [...(state.messagesByRoom[roomId] ?? []), ...messages],
      },
      hasMoreByRoom: { ...state.hasMoreByRoom, [roomId]: hasMore },
    })),

  prependNewerMessages: (roomId, messages, hasNewer) =>
    set((state) => {
      const current = state.messagesByRoom[roomId] ?? [];
      const seen = new Set(current.map((m) => m._id));
      // Newer messages belong at the front (index 0 side). Drop any already
      // present so an overlapping fetch can't duplicate rows.
      const fresh = messages.filter((m) => !seen.has(m._id));
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: [...fresh, ...current],
        },
        hasNewerByRoom: { ...state.hasNewerByRoom, [roomId]: hasNewer },
      };
    }),

  loadContextWindow: (roomId, messages, hasOlder, hasNewer, anchorId) =>
    set((state) => ({
      messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
      hasMoreByRoom: { ...state.hasMoreByRoom, [roomId]: hasOlder },
      hasNewerByRoom: { ...state.hasNewerByRoom, [roomId]: hasNewer },
      pendingScrollMessageId: anchorId,
    })),

  clearPendingScroll: () => set({ pendingScrollMessageId: null }),

  appendMessage: (message) =>
    set((state) => {
      const current = state.messagesByRoom[message.roomId] ?? [];
      // Guard against duplicates from optimistic sends / socket echoes.
      if (current.some((m) => m._id === message._id)) return state;
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [message.roomId]: [message, ...current],
        },
      };
    }),

  // The reader marked the room read on the backend, so every message NOT sent
  // by the reader (i.e. our own sent messages) is now read — flip their ticks.
  markMessagesReadInRoom: (roomId, readerId) =>
    set((state) => {
      const messages = state.messagesByRoom[roomId];
      if (!messages) return state;
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: messages.map((m) =>
            m.senderId !== readerId && !m.isRead ? { ...m, isRead: true } : m,
          ),
        },
      };
    }),

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  setParticipants: (participants) => set({ participants }),
  upsertParticipant: (roomId, participant) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [roomId]: participant,
      },
    })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  updateUserPresence: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),
}));

export default useChatStore;
