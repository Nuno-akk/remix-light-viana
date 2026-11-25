// Real-time Web Audio beat pulse & microphone spectrum analyzer engine

export interface AudioAnalysisFrame {
  energy: number; // 0..1 overall beat pulse
  isBeat: boolean;
  spectrum: number[]; // 24 normalized bars (0..1)
}

export class AudioBeatEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private synthTimer: number | null = null;
  private synthPulse = 0;
  private prevLowEnergy = 0;
  private lastBeatTime = 0;

  async startMic(): Promise<void> {
    this.stop();
    const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });
    this.micSource = this.ctx.createMediaStreamSource(this.micStream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.65;
    this.micSource.connect(this.analyser);
    this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
  }

  startSynth(getBpm: () => number): void {
    this.stop();
    const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    let step = 0;
    const scheduleTick = () => {
      if (!this.ctx) return;
      const bpm = Math.max(60, Math.min(200, getBpm()));
      const quarterMs = (60 / bpm) * 1000;
      const eighthMs = quarterMs / 2;

      const now = this.ctx.currentTime;
      const isDownbeat = step % 2 === 0;

      if (isDownbeat) {
        // Punchy club kick synth
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
        this.synthPulse = 1;
      } else {
        // Crisp off-beat hi-hat click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(6400, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        this.synthPulse = Math.max(this.synthPulse, 0.45);
      }

      step += 1;
      this.synthTimer = window.setTimeout(scheduleTick, eighthMs);
    };

    scheduleTick();
  }

  sample(mode: 'off' | 'synth' | 'mic', sensitivity = 0.65): AudioAnalysisFrame {
    const bars = 24;
    if (mode === 'off') {
      return {
        energy: 0,
        isBeat: false,
        spectrum: Array.from({length: bars}, () => 0),
      };
    }

    if (mode === 'synth') {
      const energy = this.synthPulse;
      this.synthPulse = Math.max(0, this.synthPulse * 0.88);
      const spectrum = Array.from({length: bars}, (_, i) => {
        const decay = Math.exp(-i * 0.12);
        const ripple = 0.75 + 0.25 * Math.sin(performance.now() * 0.01 + i);
        return Math.min(1, energy * decay * ripple);
      });
      return {
        energy,
        isBeat: energy > 0.88,
        spectrum,
      };
    }

    // Mic mode
    if (!this.analyser || !this.freqData) {
      return {
        energy: 0,
        isBeat: false,
        spectrum: Array.from({length: bars}, () => 0),
      };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    const len = this.freqData.length;
    // Low-end bass bins (0..10)
    let lowSum = 0;
    const lowBins = Math.min(10, len);
    for (let i = 0; i < lowBins; i += 1) {
      lowSum += this.freqData[i];
    }
    const lowNorm = lowSum / (lowBins * 255);
    const threshold = 1.15 - sensitivity * 0.45;
    const now = performance.now();
    const isBeat =
      lowNorm > 0.18 &&
      lowNorm > this.prevLowEnergy * threshold &&
      now - this.lastBeatTime > 210;

    if (isBeat) {
      this.lastBeatTime = now;
    }
    this.prevLowEnergy = this.prevLowEnergy * 0.75 + lowNorm * 0.25;

    const spectrum: number[] = [];
    const step = Math.max(1, Math.floor(len / bars));
    for (let i = 0; i < bars; i += 1) {
      const idx = Math.min(len - 1, i * step);
      spectrum.push(this.freqData[idx] / 255);
    }

    return {
      energy: Math.min(1, lowNorm * 1.4),
      isBeat,
      spectrum,
    };
  }

  stop(): void {
    if (this.synthTimer !== null) {
      window.clearTimeout(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.analyser = null;
    this.freqData = null;
    this.synthPulse = 0;
  }
}
