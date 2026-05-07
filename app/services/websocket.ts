// app/services/websocket.ts

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Record<string, Function[]> = {};
  private connected = false;

  connect(token: string) {
    // prevent duplicate connections
    if (this.connected || this.socket) return;

    this.socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`,
    );

    this.socket.onopen = () => {
      this.connected = true;
      console.log("Socket connected");
    };

    this.socket.onclose = () => {
      this.connected = false;
      this.socket = null;
      console.log("Socket disconnected");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const handlers = this.listeners[data.type] || [];
        handlers.forEach((cb) => cb(data.data || data.payload));
      } catch (err) {
        console.error("Socket parse error:", err);
      }
    };
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

  emit(payload: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    this.socket.send(JSON.stringify(payload));
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.connected = false;
  }
}

export const websocket = new WebSocketService();
