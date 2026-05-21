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
  reconnectWithToken(newToken: string) {
    console.log("Forcing websocket reconnect with new token");
    this.connect(newToken, true);
  }

  // prevents UI flicker during token refresh reconnect
  private isManualReconnect = false;
  private pendingQueue: Array<{ type: string; payload: any }> = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.registerNetworkEvents();
    }
  }

  // ---------------- NETWORK ----------------

  private registerNetworkEvents() {
    window.addEventListener("offline", () => {
      console.log("Internet disconnected");

      this.setState("disconnected");
    });

    window.addEventListener("online", () => {
      console.log("Internet restored");

      // DO NOT manually reconnect here
      // reconnecting-websocket already handles this

      if (this.socket) {
        this.setState("reconnecting");
      }
    });
  }

  // ---------------- STATE ----------------

  private setState(state: ConnectionState) {
    if (this.state === state) return;

    this.state = state;

    queueMicrotask(() => {
      this.stateListeners.forEach((cb) => cb(state));
    });
  }

  get connectionState() {
    return this.state;
  }

  onStateChange(cb: (state: ConnectionState) => void) {
    this.stateListeners.add(cb);

    // immediate sync
    cb(this.state);
  }

  offStateChange(cb: (state: ConnectionState) => void) {
    this.stateListeners.delete(cb);
  }

  // ---------------- CONNECT ----------------

  connect(token: string, force = false) {
    console.log("WS CONNECT TOKEN:", token);
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_WS_URL;

    if (!url) return;

    this.token = token;

    // existing socket
    if (this.socket) {
      const state = this.socket.readyState;

      // already active
      if (
        !force &&
        (state === WebSocket.OPEN || state === WebSocket.CONNECTING)
      ) {
        return;
      }

      this.stopPing();

      this.socket.close();

      this.socket = null;
    }

    this.isManualReconnect = force;

    this.setState("connecting");

    this.socket = new ReconnectingWebSocket(`${url}?token=${token}`, [], {
      maxRetries: Infinity,

      minReconnectionDelay: 2000,

      maxReconnectionDelay: 15000,

      reconnectionDelayGrowFactor: 1.5,

      // IMPORTANT FOR RENDER
      connectionTimeout: 20000,

      // prevents reconnect spam
      minUptime: 5000,
    });

    this.registerEvents();

    this.scheduleRefresh(token);
  }

  // ---------------- EVENTS ----------------

  private registerEvents() {
    if (!this.socket) return;

    this.socket.addEventListener("open", () => {
      console.log("Socket connected");

      this.isManualReconnect = false;

      this.setState("connected");

      this.startPing();
      this.flushQueue();
    });

    this.socket.addEventListener("close", (event) => {
      console.log("Socket closed", event.code, event.reason);

      this.stopPing();

      // intentional reconnect
      if (this.isManualReconnect) {
        this.setState("connecting");

        this.isManualReconnect = false;

        return;
      }

      // internet fully offline
      if (!navigator.onLine) {
        this.setState("disconnected");

        return;
      }

      // reconnecting automatically
      this.setState("reconnecting");
    });

    this.socket.addEventListener("error", () => {
      // reconnecting-websocket emits errors during retry attempts
      // this is normal during reconnect cycles

      if (navigator.onLine) {
        console.warn("Socket reconnecting...");
      }
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data);

        // ignore heartbeat response
        if (parsed.type === "pong") return;

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

      this.pingInterval = undefined;
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
    } catch (err) {
      console.error("Refresh failed", err);

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

    // refresh 1 minute before expiry
    const delay = exp - Date.now() - 60000;

    this.refreshTimer = setTimeout(
      async () => {
        const newToken = await this.refreshToken();

        if (!newToken) return;

        console.log("Refreshing websocket token");

        // intentional reconnect
        this.connect(newToken, true);
      },
      Math.max(delay, 0),
    );
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
      if (type !== "ping") {
        // don't queue heartbeats
        this.pendingQueue.push({ type, payload });
      }
      return;
    }

    this.socket.send(JSON.stringify({ type, ...payload }));
  }

  private flushQueue() {
    if (this.pendingQueue.length === 0) return;

    console.log(`Flushing ${this.pendingQueue.length} queued messages`);

    const queue = [...this.pendingQueue];
    this.pendingQueue = [];

    for (const { type, payload } of queue) {
      this.socket?.send(JSON.stringify({ type, ...payload }));
    }
  }

  // ---------------- DISCONNECT ----------------

  disconnect() {
    console.log("Socket manually disconnected");

    this.stopPing();

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);

      this.refreshTimer = undefined;
    }

    if (this.socket) {
      this.socket.close(1000, "manual disconnect");
      this.socket = null;
    }

    this.setState("disconnected");
  }

  // ---------------- GETTERS ----------------

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const websocket = new WebSocketService();
