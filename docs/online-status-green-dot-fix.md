# Online Status Green Dot — Diagnosis & Fix Guide

For the mobile-app (Next.js `frontend/`) developer.

The "online" green dot for chat users is partially implemented. The backend presence
pipeline is complete and correct. The chat **list** dot is fully wired. The **open
conversation** screen has **no dot at all**, and there are two config/seed gotchas that
can make the dot appear broken everywhere.

This doc tells you exactly what works, what's missing, and the code to add.

---

## TL;DR — what to fix

1. **`ChatHeader.tsx` renders no online dot** → add a `Badge` driven by `onlineUsers`.
   This is the main "not working in chat" cause. *(definite bug)*
2. **Verify `NEXT_PUBLIC_SOCKET_URL`** is the backend **origin without `/api`**
   (e.g. `http://localhost:3001`). Wrong value → socket never connects → no dot
   anywhere. *(#1 "completely broken" suspect)*
3. **Seed presence from the conversation screen** instead of relying on the (sometimes
   visually hidden) chat list. *(robustness)*
4. **Make `setOnlineUsers` merge** instead of replacing the whole map, so a second
   `presence:bulk` request can't wipe earlier results. *(future-proofing)*

---

## How presence works today (end to end)

### Backend — complete, do not change
- Socket.IO, namespace `chat`, `websocket` transport only.
- Identity = `userId` passed as a **handshake query param**
  (`backend/src/modules/chat/chat.gateway.ts:42`).
- Tracks a `Set<socketId>` per user. User is "online" while ≥1 socket is connected
  (`backend/src/socket/socket.service.ts`).
- **Events**
  - Pushes `presence:update` `{ userId, isOnline }` to everyone who shares a room with
    a user when that user connects / fully disconnects
    (`chat.gateway.ts:59` `notifyPresenceUpdate`).
  - Answers `presence:bulk` `{ userIds: string[] }` with a
    `Record<userId, boolean>` map — sent **both** as an ack callback **and** re-emitted
    as a `presence:bulk` event (`chat.gateway.ts:114`).
- Full backend reference: `backend/docs/online-presence-socket.md`.

> Note: `app.setGlobalPrefix("api")` (`backend/src/main.ts:17`) applies to HTTP routes
> only — Socket.IO still serves at the default `/socket.io` path on the origin. So the
> socket URL must be the bare origin, **not** the `/api` API base. See gotcha #2.

### Frontend — what's already wired
- `app/(app)/layout.tsx:62` — `socketService.connect(user._id)` on login.
- `app/socket/index.ts` — singleton socket wrapper (`connect` / `on` / `emit` /
  `emitWithAck`). Buffers emits before connect and re-attaches listeners on (re)connect.
- `app/components/chat/ChatSocketListener.tsx:93-106` — global listeners for
  `presence:bulk` → `setOnlineUsers`, and `presence:update` → `updateUserPresence`.
- `app/store/useChatStore.ts:15` — `onlineUsers: Record<userId, boolean>` plus
  `setOnlineUsers` / `updateUserPresence`.
- `app/components/chat/ChatListSection.tsx:79-91` — emits `presence:bulk` for every
  list participant whenever the room set changes.
- `app/components/chat/ChatListCard.tsx:81-88` — renders the green `Badge`, hidden when
  the participant isn't in `onlineUsers`. **This one works.**

### The data keys (so the dot maps correctly)
- `participants` store is keyed by **roomId** → the *other* participant
  (`app/hooks/useChatRooms.ts:32`).
- `onlineUsers` store is keyed by **userId** (the participant's `_id`).
- So the lookup is always: `onlineUsers[ participants[roomId]._id ]`.

---

## Bug 1 (MAIN) — open conversation has no dot

`app/components/chat/ChatHeader.tsx` shows the avatar, name, and occupation but never
reads `onlineUsers` and renders no `Badge`. Inside an open chat there is **no online
indicator at all**, regardless of socket health.

### Fix — wrap the avatar in a presence `Badge`

```tsx
// app/components/chat/ChatHeader.tsx
import useChatStore from "@/app/store/useChatStore";
import { Avatar, Badge, Button } from "@heroui/react";
import clsx from "clsx";
import { IoMdInformationCircleOutline } from "react-icons/io";

const ChatHeader = ({ roomId }: { roomId: string }) => {
  // Subscribe to the specific slices so the dot re-renders on presence changes.
  const participant = useChatStore((s) => s.participants[roomId!]);
  const isOnline = useChatStore(
    (s) => !!participant?._id && !!s.onlineUsers[participant._id],
  );

  return (
    <div className="h-[60px] px-5 w-full border-b flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Badge
          content=""
          color="success"
          shape="circle"
          placement="bottom-right"
          className="border-2 border-white"
          isInvisible={!isOnline}
        >
          <Avatar
            isBordered
            color="primary"
            name={participant?.fullName}
            src={participant?.profilePhoto?.url}
            className={clsx(
              "w-8 h-8 text-large ring-2 ring-offset-2 ring-transparent transition-all",
              { "blur-[2px]": participant?.shouldBlur ?? participant?.isPrivate },
            )}
          />
        </Badge>

        <div className="flex flex-col items-start">
          <p className="font-medium text-gray-800 text-sm">
            {participant?.fullName}
          </p>
          {/* Optional: swap occupation for a live status line */}
          <p className="text-xs text-gray-400">
            {isOnline ? "Online" : participant?.occupation}
          </p>
        </div>
      </div>

      <Button size="sm" variant="light">
        <IoMdInformationCircleOutline size={20} className="text-gray-600" />
      </Button>
    </div>
  );
};

export default ChatHeader;
```

The same `Badge` pattern is already proven in `ChatListCard.tsx:81-88` — reuse it.

---

## Bug 2 (CONFIG) — socket may never connect

`app/configs/app-config.ts:4` → `SOCKET_BASE_URL: process.env.NEXT_PUBLIC_SOCKET_URL`.

If `NEXT_PUBLIC_SOCKET_URL` is empty or set to the **API** base (the one with `/api`),
the socket connects to the wrong place (or not at all) and **no dot appears anywhere** —
list or conversation.

### Check
- `.env` must have, per `env.example:3-4`:
  ```
  # Socket origin only (NO /api). Namespace /chat is appended by the client.
  NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
  ```
- It must be the bare origin. **Not** `http://localhost:3001/api`.
- Confirm in the browser/device console you see `✅ Socket.io connected:` from
  `app/socket/index.ts:39`. If you instead see `❌ Connection Error`, it's URL / CORS /
  reachability — fix that first; the dot can't work until the socket connects.

---

## Bug 3 (SEED) — conversation screen doesn't request its own presence

`app/(app)/message/[id]/page.tsx` never emits `presence:bulk`. It currently works only
because `ChatListSection` (rendered hidden via `hidden sm:block`) still mounts and emits
for all list participants. That's fragile — a direct deep-link, an empty/slow room list,
or a layout change can leave the open chat with a stale/blank dot until the next
`presence:update` happens to fire.

`presence:update` only covers changes **after** you connect, so without a bulk seed a
user who was already online before you opened the chat shows as offline.

### Fix — seed presence when a conversation opens

Add to the "active room" effect in `message/[id]/page.tsx` (around line 57):

```tsx
import socketService from "@/app/socket";
import socketEvents from "@/app/socket/socket-config";
import useChatStore from "@/app/store/useChatStore";

// inside the component:
const participant = useChatStore((s) => s.participants[id]);

useEffect(() => {
  const otherUserId = participant?._id;
  if (!otherUserId) return;
  socketService.emit(socketEvents.EMIT.PRESENCE_BULK, {
    userIds: [otherUserId],
  });
}, [participant?._id]);
```

The existing global `presence:bulk` listener in `ChatSocketListener` handles the
response — you don't need a local handler.

---

## Bug 4 (ROBUSTNESS) — `setOnlineUsers` replaces the whole map

`app/store/useChatStore.ts:176` → `setOnlineUsers: (onlineUsers) => set({ onlineUsers })`.

Each `presence:bulk` response **replaces** the entire `onlineUsers` map. Today only the
chat list emits bulk (covering everyone), so it's fine. But once the conversation screen
also emits bulk for a single user (Bug 3 fix), that single-key response will **wipe** the
list's statuses. Merge instead:

```ts
// app/store/useChatStore.ts
setOnlineUsers: (onlineUsers) =>
  set((state) => ({ onlineUsers: { ...state.onlineUsers, ...onlineUsers } })),
```

`updateUserPresence` already merges correctly — leave it as is.

---

## Verification checklist

1. **Socket connects** — console shows `✅ Socket.io connected:` (not `❌`).
2. **Backend logs** — on opening the app you see `Socket connected: <userId> (<socketId>)`
   in the backend console.
3. **List dot** — with two accounts that share a chat, log both in. The other user shows
   a green dot in the chat list (`ChatListCard`).
4. **Conversation dot** — open the conversation; the header avatar shows the green dot
   (after Bug 1 fix). Close the other user's app → dot disappears within a second
   (`presence:update false`). Reopen → dot returns.
5. **Already-online seed** — user A is already online, then user B opens the chat fresh.
   B should see A as online immediately (needs the Bug 3 bulk seed), not only after A
   reconnects.

---

## Quick reference — events

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `presence:bulk` | emit | `{ userIds: string[] }` | seed current status; response is a `Record<userId, boolean>` |
| `presence:bulk` | listen | `Record<userId, boolean>` | handled in `ChatSocketListener` → `setOnlineUsers` |
| `presence:update` | listen | `{ userId, isOnline }` | live flip; only for users you share a room with |

Constants: `app/socket/socket-config.ts`. All listeners live in
`app/components/chat/ChatSocketListener.tsx` — keep new presence handlers there, not in
screens.
