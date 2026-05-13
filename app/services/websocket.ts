import ReconnectingWebSocket from "reconnecting-websocket";
import axios from "axios";

type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";


class WebSocketService {
  private socket: ReconnectingWebSocket | null = null;

  private listeners: Record<string, Function[]> = {};

  private pingInterval?: NodeJS.Timeout;
  private refreshTimer?: NodeJS.Timeout;

  private token: string | null = null;
  private state: ConnectionState = "disconnected";
private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  // ---------------- CONNECT ----------------

  onStateChange(cb: (state: ConnectionState) => void) {
  this.stateListeners.add(cb);

  // CRITICAL: always replay current state immediately
  cb(this.state);
  }
offStateChange(cb: (state: ConnectionState) => void) {
  this.stateListeners.delete(cb);
}

  
  connect(token: string, force = false) {
    if (!token) {
      console.warn("No token provided");
      return;
    }

    const url = process.env.NEXT_PUBLIC_WS_URL;

    if (!url) {
      console.error("WS URL is missing");
      return;
    }

    // prevent duplicate active socket
    if (
      !force &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.token === token
    ) {
      return;
    }

    this.token = token;

    // close previous socket before creating new one
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setState("connecting");

    this.socket = new ReconnectingWebSocket(`${url}?token=${token}`, [], {
      maxRetries: Infinity,
      minReconnectionDelay: 1000,
      maxReconnectionDelay: 10000,
      reconnectionDelayGrowFactor: 1.5,
      connectionTimeout: 5000,
    });

    this.registerEvents();

    // schedule token refresh
    this.scheduleRefresh(token);
  }

  // ---------------- EVENTS ----------------

  private registerEvents() {
    if (!this.socket) return;

    this.socket.addEventListener("open", () => {
      console.log("Socket connected");

      this.setState("connected");

      // start heartbeat
      this.startPing();
    });

    this.socket.addEventListener("close", () => {
      console.log("Socket disconnected");

      this.setState("reconnecting");

      this.stopPing();
    });
    this.socket.addEventListener("connecting", () => {
  this.setState("connecting");
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

        // ignore pong
        if (parsed.type === "pong") {
          return;
        }

        const handlers = this.listeners[parsed.type] || [];

        handlers.forEach((cb) => cb(parsed.data || parsed.payload || parsed));
      } catch (err) {
        console.error("Socket parse error:", err);
      }
    });
  }

  // ---------------- PING ----------------

  private startPing() {
    this.stopPing();

    this.pingInterval = setInterval(() => {
      if (this.connected) {
        this.emit("ping");
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  // ---------------- TOKEN REFRESH ----------------

  private async refreshToken() {
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
        {},
        {
          withCredentials: true,
        },
      );

      return data?.data?.access_token || null;
    } catch (error) {
      console.error("Refresh token failed", error);
      return null;
    }
  }

  private getTokenExp(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      return payload?.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private scheduleRefresh(token: string) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const exp = this.getTokenExp(token);

    if (!exp) return;

    // refresh 1 min before expiry
    const delay = exp - Date.now() - 60000;

    this.refreshTimer = setTimeout(
      async () => {
        const newToken = await this.refreshToken();

        if (!newToken) return;

        console.log("Refreshing WS token");

        this.connect(newToken, true);
      },
      Math.max(delay, 0),
    );
  }

  // ---------------- STATE ----------------

  private setState(state: ConnectionState) {
  this.state = state;

  queueMicrotask(() => {
    this.stateListeners.forEach((cb) => cb(state));
  });
  }
  get connectionState() {
    return this.state;
  }

  // ---------------- EVENTS API ----------------

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

  // ---------------- SEND ----------------

  emit(type: string, payload: any = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
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

  // ---------------- DISCONNECT ----------------

  disconnect() {
    this.stopPing();

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.socket?.close();

    this.socket = null;

    this.setState("disconnected");
  }

  // ---------------- GETTERS ----------------

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const websocket = new WebSocketService();
