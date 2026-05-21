const audioController = {
  audio: null as HTMLAudioElement | null,
  timeoutId: null as ReturnType<typeof setTimeout> | null,
  isPlaying: false,
  muted: false,
  unlocked: false,

  // required for mobile browsers (autoplay policy)
  unlock() {
    if (this.unlocked) return;

    this.audio = new Audio();
    this.audio.volume = 0;
    this.audio.play().catch(() => {});
    this.audio.pause();
    this.audio.currentTime = 0;

    this.unlocked = true;
  },

  play(ringtone: string) {
    this.unlock();

    if (!this.audio) {
      this.audio = new Audio(ringtone);
    } else {
      this.audio.src = ringtone;
    }

    this.audio.volume = this.muted ? 0 : 1;
    this.audio.currentTime = 0;

    const p = this.audio.play();
    if (p) {
      p.catch((err) => {
        console.warn("Audio play blocked:", err);
      });
    }

    this.isPlaying = true;
  },

  stop() {
    if (!this.audio) return;

    try {
      this.audio.pause();
      this.audio.currentTime = 0;
    } catch {}

    this.isPlaying = false;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  },

  setMuted(v: boolean) {
    this.muted = v;
    if (this.audio) {
      this.audio.volume = v ? 0 : 1;
    }
  },
};

export default audioController;
