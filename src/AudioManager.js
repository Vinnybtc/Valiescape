export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  playTone(frequency, duration, type = 'sine', volume = 0.15) {
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playJump() {
    this.playTone(400, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.08), 50);
  }

  playLand() {
    this.playTone(150, 0.1, 'triangle', 0.06);
  }

  playFall() {
    this.playTone(300, 0.4, 'sawtooth', 0.08);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.06), 200);
  }

  playCheckpoint() {
    this.playTone(523, 0.15, 'sine', 0.12);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.12), 200);
  }

  playDanceBoost() {
    this.playTone(440, 0.1, 'square', 0.08);
    setTimeout(() => this.playTone(554, 0.1, 'square', 0.08), 80);
    setTimeout(() => this.playTone(659, 0.1, 'square', 0.08), 160);
    setTimeout(() => this.playTone(880, 0.2, 'square', 0.08), 240);
  }

  playPortal() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(400 + i * 100, 0.3, 'sine', 0.1);
      }, i * 100);
    }
  }

  playAlarmTick() {
    this.playTone(800, 0.05, 'square', 0.04);
  }

  playCollapse() {
    this.playTone(100, 0.5, 'sawtooth', 0.1);
  }

  playBounce() {
    this.playTone(300, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(500, 0.1, 'sine', 0.08), 50);
  }
}
