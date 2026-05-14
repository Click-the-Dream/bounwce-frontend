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

  // 🔥 IMPORTANT: prevents UI flicker during token refresh reconnect
  private isManualReconnect = false;

  // ---------------- CONNECT ----------------

  onStateChange(cb: (state: ConnectionState) => void) {
    this.stateListeners.add(cb);

    // immediately sync state
    cb(this.state);
  }

  offStateChange(cb: (state: ConnectionState) => void) {
    this.stateListeners.delete(cb);
  }

  connect(token: string, force = false) {
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) return;

    // avoid duplicate connection
    if (
      !force &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.token === token
    ) {
      return;
    }

    this.token = token;

    // mark intentional reconnect (token refresh etc.)
    this.isManualReconnect = force;

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
    });

    this.socket.addEventListener("close", () => {
      console.log("Socket closed");

      this.stopPing();

      // 🔥 FIX: prevent fake "reconnecting" state during intentional reconnects
      if (this.isManualReconnect) {
        this.setState("connecting");
        this.isManualReconnect = false;
        return;
      }

      this.setState("reconnecting");
    });

    this.socket.addEventListener("error", (event) => {
      console.error("Socket error:", event);
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data);

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
    }
  }

  // ---------------- TOKEN REFRESH ----------------

  private async refreshToken() {
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
        {},
        { withCredentials: true },
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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

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
