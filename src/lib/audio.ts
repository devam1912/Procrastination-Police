export class PoliceAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
    } catch {
      /* A silent patrol still works when browser audio is unavailable. */
    }
  }
  stop() {
    try {
      this.oscillator?.stop();
    } catch {
      /* Already stopped. */
    }
    this.oscillator = null;
    this.gain?.disconnect();
    this.gain = null;
  }
  siren(volume: number) {
    this.stop();
    const ctx = this.context;
    if (!ctx || ctx.state !== "running" || volume === 0) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.16, now + 0.08);
    gain.gain.setValueAtTime(volume * 0.16, now + 1.5);
    gain.gain.linearRampToValueAtTime(0, now + 1.9);
    for (let i = 0; i <= 8; i++)
      oscillator.frequency.linearRampToValueAtTime(
        i % 2 ? 900 : 520,
        now + i * 0.22,
      );
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 2);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    this.oscillator = oscillator;
    this.gain = gain;
  }
  setVolume(volume: number) {
    if (volume === 0) this.stop();
    else if (this.gain && this.context)
      this.gain.gain.setTargetAtTime(
        volume * 0.16,
        this.context.currentTime,
        0.05,
      );
  }
  dispose() {
    this.stop();
    void this.context?.close();
    this.context = null;
  }
}
