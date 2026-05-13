class NotificationEngine {
  private queue: any[] = [];
  private processing = false;

  push(notification: any) {
    this.queue.push({
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    this.process();
  }

  private process() {
    if (this.processing) return;
    this.processing = true;

    requestAnimationFrame(() => {
      while (this.queue.length) {
        const item = this.queue.shift();
        this.dispatch(item);
      }

      this.processing = false;
    });
  }

  private dispatch(item: any) {
    window.dispatchEvent(new CustomEvent("app:notify", { detail: item }));
  }
}

export const notificationEngine = new NotificationEngine();
