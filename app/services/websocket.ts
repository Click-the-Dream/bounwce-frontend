import ReconnectingWebSocket from "reconnecting-websocket";

class WebSocketService {
  private socket: ReconnectingWebSocket | null = null;
  private listeners: Record<string, Function[]> = {};

  connect(token: string) {
    if (!token) {
      console.warn("No token provided");
      return;
    }

    const url = process.env.NEXT_PUBLIC_WS_URL;

    if (!url) {
      console.error("WS URL is missing");
      return;
    }

    // prevent duplicate active connection
    if (this.socket?.readyState === 1) return;

    this.socket = new ReconnectingWebSocket(`${url}?token=${token}`, [], {
      maxRetries: Infinity,
      minReconnectionDelay: 1000,
      maxReconnectionDelay: 10000,
      connectionTimeout: 5000,
    });

    this.socket.addEventListener("open", () => {
      console.log("Socket connected");
    });

    this.socket.addEventListener("close", () => {
      console.log("Socket disconnected");
    });

    this.socket.addEventListener("error", (event) => {
      console.error("Socket error:", {
        type: event.type,
        readyState: this.socket?.readyState,
        url: (event.target as WebSocket)?.url,
      });
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data);

        const handlers = this.listeners[parsed.type] || [];

        handlers.forEach((cb) => cb(parsed.data || parsed.payload || parsed));
      } catch (err) {
        console.error("Socket parse error:", err);
      }
    });
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    this.listeners[event] =
      this.listeners[event]?.filter((cb) => cb !== callback) || [];
  }

  emit(type: string, payload: any = {}) {
    if (!this.socket || this.socket.readyState !== 1) {
      console.warn("Socket not open");
      return;
    }

    this.socket.send(
      JSON.stringify({
        type,
        ...payload,
      }),
    );
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  get connected() {
    return this.socket?.readyState === 1;
  }
}

export const websocket = new WebSocketService();
