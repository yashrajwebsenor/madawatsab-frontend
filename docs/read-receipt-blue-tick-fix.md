# Read Receipt (Blue Tick) Not Updating Live — Diagnosis & Fix Guide

For the mobile-app (Next.js `frontend/`) developer.

**Symptom:** the double tick on a sent message stays grey after the other user has seen
it. It only turns blue after refreshing the chat screen (i.e. the read state comes from
the REST API, not live over the socket).

**The `messagesRead` listener is NOT missing** — it exists at
`app/components/chat/ChatSocketListener.tsx:83` and the store/tick rendering are correct.
The problem is that the socket **emit/delivery** is unreliable, so the live event never
makes the round trip. "Works on refresh, fails live" is the classic signature of a
dropped emit or a dead socket. This doc pinpoints both.

---

## TL;DR — what to fix

1. **Emits are silently dropped when the socket isn't connected yet** — the reader's
   `readMessages` emit fires on chat-open *before* `socketService.connect()` runs, so the
   backend never marks read and never notifies the sender. **Queue emits until connect.**
   *(primary bug)*
2. **`reconnectionAttempts: 3`** — on flaky mobile networks the socket dies for good
   after 3 tries. Live events stop forever; only HTTP/refresh works. **Use infinite
   reconnection.** *(primary bug)*
3. **Re-mark read on reconnect and on tab/window focus**, and **refetch messages on
   reconnect**, so anything missed during a socket gap resyncs without a manual refresh.
   *(robustness)*

---

## The full read-receipt pipeline (so you can confirm each piece in your build)

Two users: **A** sends, **B** reads. The blue tick appears on **A's** screen.

1. **B opens the room** → `app/(app)/message/[id]/page.tsx:57-70` emits
   `readMessages { roomId, userId: B }`.
   Also, if a new message arrives while B has the room active,
   `ChatSocketListener.tsx:72-73` emits `readMessages` again.
2. **Backend** marks the room's messages read and notifies the *other* participant:
   `backend/src/modules/chat/chat.gateway.ts:90-112` emits
   `messagesRead { roomId, readerId: B }` to A.
3. **A receives `messagesRead`** → `ChatSocketListener.tsx:83-91` calls
   `markMessagesReadInRoom(roomId, B)`.
4. **Store flips** A's messages to `isRead: true`:
   `app/store/useChatStore.ts:152-164` (every message whose `senderId !== readerId`).
5. **Re-render** → `message/[id]/page.tsx:150-176` recomputes `showSeen`, and
   `SeenMessageText` (`app/components/chat/SeenMessageText.tsx`) draws the ticks blue
   (`#3b82f6`) when `isRead` is true.

Steps 3–5 are correct in the repo. **The breakage is at steps 1–2: the socket message
doesn't get delivered.** Below are the two reasons.

---

## Root cause 1 (PRIMARY) — emits dropped before the socket connects

`app/socket/index.ts:75-81`:

```ts
emit(event: string, data: any) {
  if (this.socket) {
    this.socket.emit(event, data);
  } else {
    console.warn("⚠️ Attempted to emit before socket was initialized");
  }
}
```

When `this.socket` is `null`, the emit is **thrown away** — it is *not* buffered.

Now the ordering on a fresh load / full refresh into a conversation:
- `socketService.connect()` runs in the **layout** effect (`app/(app)/layout.tsx:62`).
- `readMessages` is emitted in the **page** effect (`message/[id]/page.tsx:63`).
- React runs **child effects before parent effects**, and the page is a child of the
  layout. So the page emits `readMessages` **before** the layout calls `connect()` →
  `this.socket` is still `null` → the emit is dropped.

Result: on first open, B's "I read this" never reaches the backend, so A's tick never
turns blue live. Later, an unrelated event (B sends a message, or A refreshes and the
API marks/returns read) papers over it — which is exactly why "refresh works."

### Fix — queue emits and flush them on connect

```ts
// app/socket/index.ts
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private currentUserId: string | null = null;
  private pendingEmits: Array<{ event: string; data: any }> = []; // NEW

  connect(userId: string) {
    if (this.socket && this.currentUserId === userId) return;
    if (this.socket && this.currentUserId !== userId) this.disconnect();
    this.currentUserId = userId;

    const baseUrl = (APP_CONFIG.SOCKET_BASE_URL ?? "").replace(/\/+$/, "");
    this.socket = io(`${baseUrl}/chat`, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: Infinity,   // see Root cause 2
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket"],
    });

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb));
    });

    this.socket.on(socketEvents.LISTEN.CONNECTED, () => {
      console.log("✅ Socket.io connected:", this.socket?.id);
      // Flush anything emitted before the socket existed.
      const queued = this.pendingEmits;
      this.pendingEmits = [];
      queued.forEach(({ event, data }) => this.socket?.emit(event, data));
    });

    this.socket.on(socketEvents.LISTEN.CONNECT_ERROR, (error: Error) => {
      console.log("❌ Connection Error:", error);
    });
  }

  emit(event: string, data: any) {
    if (this.socket) {
      // socket.io buffers internally while "connecting", so this is safe.
      this.socket.emit(event, data);
    } else {
      // No socket yet — queue and flush on connect (don't drop).
      this.pendingEmits.push({ event, data });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
    this.listeners.clear();
    this.pendingEmits = []; // NEW
  }
}
```

> Alternative/extra safety: call `socketService.connect(user._id)` as early as possible
> (e.g. right when the user is known) so the socket exists before any screen emits. The
> queue above makes the ordering bug harmless either way.

---

## Root cause 2 (PRIMARY) — socket gives up reconnecting

`app/socket/index.ts:26-29` sets `reconnectionAttempts: 3`. On a mobile network (tab
backgrounded, tunnel, wifi↔cellular handoff) three quick failures exhaust the budget and
**socket.io stops trying permanently**. From then on:
- No `newMessage`, no `messagesRead`, no `presence:*` — every live event is dead.
- REST calls (and therefore a manual refresh) still work, because they're plain HTTP.

That is precisely "blue tick only shows after refresh."

### Fix
Set `reconnectionAttempts: Infinity` (with backoff) — already included in the Root cause 1
snippet above (`reconnectionAttempts: Infinity`, `reconnectionDelay`,
`reconnectionDelayMax`).

---

## Root cause 3 (ROBUSTNESS) — resync read state after a gap

Even with infinite reconnection there's a window where events are missed (between the
socket dropping and reconnecting). Mirror what a manual refresh does: when the socket
reconnects, or the tab regains focus, re-mark read and refetch the open room.

### Fix A — reader re-emits read on reconnect + focus

In `app/(app)/message/[id]/page.tsx`, add alongside the existing active-room effect:

```tsx
useEffect(() => {
  if (!user?._id) return;

  const markRead = () =>
    socketService.emit(socketEvents.EMIT.READ_MESSAGES, {
      roomId: id,
      userId: user._id,
    });

  // socketEvents.LISTEN.CONNECTED === "connect" → fires on every (re)connect.
  const offReconnect = socketService.on(socketEvents.LISTEN.CONNECTED, markRead);
  window.addEventListener("focus", markRead);

  return () => {
    offReconnect();
    window.removeEventListener("focus", markRead);
  };
}, [id, user?._id]);
```

### Fix B — observer refetches messages on reconnect

So the **sender's** screen pulls fresh `isRead` flags after a reconnect (catches any
`messagesRead` it missed):

```tsx
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

useEffect(() => {
  const resync = () =>
    queryClient.invalidateQueries({ queryKey: ["chats", id] });
  const offReconnect = socketService.on(socketEvents.LISTEN.CONNECTED, resync);
  return () => offReconnect();
}, [id, queryClient]);
```

---

## What is already correct (don't "fix" these)

- **Listener exists:** `ChatSocketListener.tsx:83` listens `messagesRead` →
  `markMessagesReadInRoom`. Keep all presence/read listeners here, not in screens.
- **Store flip is right:** `useChatStore.ts:152` flips every message where
  `senderId !== readerId`, returns a new array → the open chat re-renders.
- **Tick rendering is right:** `SeenMessageText.tsx` colours the double tick blue on
  `isRead`. `showSeen` math in `message/[id]/page.tsx:150-176` picks the correct message.
- **Backend is right:** `chat.gateway.ts:90` persists the read and emits `messagesRead`
  to the other participant only. No backend change needed.

If your branch is missing the `messagesRead` listener entirely, add it back exactly as in
`ChatSocketListener.tsx:83-91` — but verify the emit/reconnect issues above first, since
the listener alone won't help if the event never arrives.

---

## Verification (use two devices/accounts + both consoles)

1. **Socket alive:** both clients log `✅ Socket.io connected:`. If you see repeated
   `❌ Connection Error` then nothing stops after a few tries → that's Root cause 2.
2. **Reader emits:** when B opens the chat, B's network panel shows a `readMessages`
   frame go out. If it doesn't on first open (but does after navigating away and back) →
   Root cause 1 (dropped pre-connect emit).
3. **Backend forwards:** A's socket receives a `messagesRead` frame `{ roomId, readerId }`
   within ~1s of B opening the chat.
4. **Live flip:** A's last sent message turns from grey to blue double-tick **without
   refreshing**.
5. **Gap recovery:** turn B's network off, send from A, turn B's network on. After B
   reconnects (and the room is focused), A's tick goes blue — no manual refresh.

---

## Quick reference — events

| Event | Direction | Payload | Where |
|-------|-----------|---------|-------|
| `readMessages` | A/B **emit** | `{ roomId, userId }` | `message/[id]/page.tsx:63`, `ChatSocketListener.tsx:73`, `ChatListCard.tsx:38` |
| `messagesRead` | **listen** | `{ roomId, readerId }` | `ChatSocketListener.tsx:83` → `markMessagesReadInRoom` |

Event constants: `app/socket/socket-config.ts`. The grey-vs-blue tick lives in
`app/components/chat/SeenMessageText.tsx`.
