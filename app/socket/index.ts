import { io, Socket } from "socket.io-client";
import APP_CONFIG from "../configs/app-config";
import socketEvents from "./socket-config";

type Listener = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private currentUserId: string | null = null;

  connect(userId: string) {
    // Already connected for this user — nothing to do.
    if (this.socket && this.currentUserId === userId) return;

    // A different user logged in — tear down the previous socket first.
    if (this.socket && this.currentUserId !== userId) {
      this.disconnect();
    }

    this.currentUserId = userId;

    const baseUrl = (APP_CONFIG.SOCKET_BASE_URL ?? "").replace(/\/+$/, "");
    this.socket = io(`${baseUrl}/chat`, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: 3,
      transports: ["websocket"],
    });

    // Re-attach listeners that were registered before connect() ran.
    // socket.io keeps these handlers across reconnects, so we only attach
    // them once here (not inside the "connect" callback).
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb));
    });

    this.socket.on(socketEvents.LISTEN.CONNECTED, () => {
      console.log("✅ Socket.io connected:", this.socket?.id);
    });

    this.socket.on(socketEvents.LISTEN.CONNECT_ERROR, (error: Error) => {
      console.log("❌ Connection Error:", error);
    });
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function that removes
   * only this callback, leaving any other listeners for the event intact.
   */
  on(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    this.socket?.on(event, callback);

    return () => this.off(event, callback);
  }

  /**
   * Remove a specific callback for an event. When no callback is passed,
   * every listener for the event is removed (use sparingly).
   */
  off(event: string, callback?: Listener) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn("⚠️ Attempted to emit before socket was initialized");
    }
  }

  /**
   * Emit with acknowledgement. Resolves with the server's ack payload, or
   * rejects if the socket is not connected.
   */
  emitWithAck<T = any>(event: string, data: any): Promise<T> {
    if (!this.socket) {
      return Promise.reject(
        new Error("Attempted to emit before socket was initialized"),
      );
    }
    return this.socket.emitWithAck(event, data) as Promise<T>;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
    this.listeners.clear();
  }
}

const socketService = new SocketService();
export default socketService;
