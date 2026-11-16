import { blendRainLoop } from './rain-loop';

/** Original Glimmer Plate audio mixer. No audio starts before unlock(). */
type Voice = { audio: HTMLAudioElement; panner?: StereoPannerNode; source?: MediaElementAudioSourceNode };
type Loop = Voice & {
  id: string; group: 'music' | 'ambience' | 'kitchen'; district: string | null;
  bufferSource?: AudioBufferSourceNode; bufferGain?: GainNode; loading?: boolean;
  base: number; weight: number; from: number; target: number; x: number; y: number;
};
type Effect = { voices: Voice[]; gain: number; cursor: number; lastPlay: number };
const D1 = 'd1-rain-alley', D2 = 'd2-lantern-steps', D3 = 'd3-fogline-pier';
const db = (value: number): number => 10 ** (value / 20);
const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));
const mixToward = (value: number, target: number, dt: number, seconds: number): number =>
  value + (target - value) * Math.min(1, dt * 5 / seconds);

const EFFECTS: Record<string, readonly [number, number]> = {
  'sfx-step-wet-1': [-16, 2], 'sfx-step-wet-2': [-16, 2], 'sfx-step-wet-3': [-16, 2],
  'sfx-ui-move': [-12, 1], 'sfx-ui-select': [-8, 1], 'sfx-ui-back': [-9, 1],
  'sfx-menu-open': [-8, 1], 'sfx-menu-close': [-9, 1],
  'sfx-fav-on': [-8, 1], 'sfx-fav-off': [-10, 1], 'sfx-stamp': [-5, 1],
  'sfx-find': [-6, 1], 'sfx-finale': [-4, 1], 'sfx-grand-finale': [-4, 1],
  'sfx-cat-purr': [-6, 1], 'sfx-cat-mrrp': [-8, 2],
  'sfx-talk-blip-1': [-14, 1], 'sfx-talk-blip-2': [-14, 1], 'sfx-talk-blip-3': [-14, 1],
  'sfx-holo-glitch': [-9, 2], 'sfx-vending': [-6, 1], 'sfx-puddle-reveal': [-7, 1],
  'sfx-bump': [-10, 1], 'sfx-portal-open': [-8, 1], 'sfx-portal-close': [-9, 1],
  'sfx-orbit-tick': [-18, 1], 'sfx-order-add': [-9, 1], 'sfx-order-remove': [-10, 1],
  'sfx-order-place': [-6, 1], 'sfx-order-ready': [-6, 1], 'sfx-district-travel': [-9, 1],
  'sfx-unlock': [-5, 1], 'sfx-code-key': [-14, 1], 'sfx-code-ok': [-8, 1],
  'sfx-code-bad': [-10, 1], 'sfx-wish-tag': [-7, 1], 'sfx-bottle': [-6, 1], 'sfx-gull': [-14, 1],
};

export class GlimmerAudio {
  private readonly loops: Loop[] = [];
  private readonly effects = new Map<string, Effect>();
  private readonly sources: MediaElementAudioSourceNode[] = [];
  private context: AudioContext | null = null;
  private district = D1;
  private unlocked = false;
  private disposed = false;
  private musicMuted = false;
  private soundMuted = false;
  private startup = 0;
  private crossfade = 1.5;
  private musicDuck = 1;
  private ambienceDuck = 1;
  private sittingMix = 0;
  private duckRemaining = 0;
  private clock = 0;
  private gullRemaining = 25 + Math.random() * 35;
  private lastStep = 0;
  private pendingUnlock = -1;
  private readonly playRejected = (): void => { /* A later gesture may retry unlock(). */ };

  constructor() {
    this.addLoop('mus-market', 'music', D1, -12);
    this.addLoop('mus-steps', 'music', D2, -12);
    this.addLoop('mus-pier', 'music', D3, -12);
    this.addLoop('amb-rain', 'ambience', null, -18);
    this.addLoop('amb-rain-awning', 'ambience', null, -19);
    this.addLoop('amb-steps-crowd', 'ambience', D2, -12);
    this.addLoop('amb-pier', 'ambience', D3, -11);
    // Restaurant feet positions are from the authoritative district fixtures.
    this.addLoop('sfx-simmer-loop', 'kitchen', D1, -12, 10.5, 10);
    this.addLoop('sfx-sizzle-loop', 'kitchen', D1, -14, 32.5, 22);
    this.addLoop('sfx-teapot-loop', 'kitchen', D2, -15, 13.5, 9);
    this.addLoop('sfx-grill-loop', 'kitchen', D2, -10, 17.5, 20);
    this.addLoop('sfx-fryer-loop', 'kitchen', D3, -15, 10, 8);
    this.addLoop('sfx-simmer-loop', 'kitchen', D3, -16, 25.5, 8);
    for (const [id, settings] of Object.entries(EFFECTS)) {
      const voices: Voice[] = [];
      for (let i = 0; i < settings[1]; i++) voices.push({ audio: this.makeAudio(id, false) });
      this.effects.set(id, { voices, gain: db(settings[0]), cursor: 0, lastPlay: -Infinity });
    }
  }

  private makeAudio(id: string, loop: boolean): HTMLAudioElement {
    const audio = new Audio(`${import.meta.env.BASE_URL}glimmer/assets/audio/${id}.ogg`);
    audio.loop = loop;
    audio.preload = loop ? 'metadata' : 'auto';
    audio.volume = 0;
    audio.preservesPitch = false;
    return audio;
  }

  private addLoop(id: string, group: Loop['group'], district: string | null, level: number, x = 0, y = 0): void {
    const weight = district === null || district === this.district ? 1 : 0;
    this.loops.push({ id, group, district, base: db(level), audio: this.makeAudio(id, true), weight, from: weight, target: weight, x, y });
  }

  /** Call directly from a pointer/key/controller gesture; calling again safely retries blocked media. */
  unlock(): void {
    if (this.disposed) return;
    if (!this.context && typeof AudioContext !== 'undefined') {
      try {
        this.context = new AudioContext();
        for (const channel of this.loops) if (channel.group === 'kitchen') this.connectPanner(channel);
        const gull = this.effects.get('sfx-gull');
        if (gull) for (const voice of gull.voices) this.connectPanner(voice);
      } catch { /* Stereo media playback remains available without Web Audio. */ }
    }
    if (this.context?.state === 'suspended') void this.context.resume().catch(this.playRejected);
    this.unlocked = true;
    for (const channel of this.loops) {
      if (this.context && channel.id.startsWith('amb-rain')) {
        if (!channel.bufferSource && !channel.loading) void this.prepareRain(channel);
      } else if (channel.audio.paused) void channel.audio.play().catch(this.playRejected);
    }
  }

  private async prepareRain(channel: Loop): Promise<void> {
    const context = this.context;
    if (!context || this.disposed) return;
    channel.loading = true;
    try {
      const response = await fetch(channel.audio.src);
      if (!response.ok) throw new Error('Rain audio unavailable');
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      if (this.disposed) return;
      const samples = blendRainLoop(decoded.getChannelData(0), decoded.sampleRate);
      const buffer = context.createBuffer(decoded.numberOfChannels, samples.length, decoded.sampleRate);
      buffer.copyToChannel(samples, 0);
      for (let c = 1; c < decoded.numberOfChannels; c++) buffer.copyToChannel(blendRainLoop(decoded.getChannelData(c), decoded.sampleRate), c);
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer; source.loop = true;
      gain.gain.value = 0;
      source.connect(gain); gain.connect(context.destination);
      channel.bufferSource = source; channel.bufferGain = gain;
      channel.audio.pause();
      source.start();
    } catch {
      // Keep ambience available if decoding fails; a later gesture retries the buffer.
      if (!this.disposed) void channel.audio.play().catch(this.playRejected);
    } finally { channel.loading = false; }
  }

  private connectPanner(voice: Voice): void {
    if (!this.context || voice.source) return;
    const source = this.context.createMediaElementSource(voice.audio);
    const panner = this.context.createStereoPanner();
    source.connect(panner).connect(this.context.destination);
    voice.source = source; voice.panner = panner; this.sources.push(source);
  }

  /** Music/layers crossfade at equal power. The shared rain buffers are never restarted. */
  setDistrict(id: string): void {
    if (this.disposed || id === this.district || (id !== D1 && id !== D2 && id !== D3)) return;
    this.district = id;
    this.crossfade = 0;
    this.gullRemaining = 25 + Math.random() * 35;
    for (const channel of this.loops) {
      channel.from = channel.weight;
      channel.target = channel.district === null || channel.district === id ? 1 : 0;
      if (channel.group === 'kitchen' && channel.target && Number.isFinite(channel.audio.duration) && channel.audio.duration > 0) {
        channel.audio.currentTime = Math.random() * channel.audio.duration;
      }
    }
  }

  /** Unknown IDs are intentionally ignored. Families step-wet/talk-blip are accepted. */
  play(id: string): void {
    if (!this.unlocked || this.disposed || this.soundMuted) return;
    if (id === 'sfx-step-wet') {
      this.lastStep = (this.lastStep + 1 + Math.floor(Math.random() * 2)) % 3;
      id = `sfx-step-wet-${this.lastStep + 1}`;
    } else if (id === 'sfx-talk-blip') id = 'sfx-talk-blip-1';
    const effect = this.effects.get(id);
    if (!effect) return;
    if (id === 'sfx-orbit-tick' && this.clock - effect.lastPlay < 0.08) return;
    // The unlock sound follows the find, rather than masking its beginning.
    if (id === 'sfx-unlock') {
      const find = this.effects.get('sfx-find');
      const elapsed = find ? this.clock - find.lastPlay : Infinity;
      if (elapsed < 0.5) { this.pendingUnlock = 0.5 - elapsed; return; }
    }
    if (id === 'sfx-grand-finale' || id === 'sfx-finale') {
      const other = this.effects.get(id === 'sfx-grand-finale' ? 'sfx-finale' : 'sfx-grand-finale');
      if (id === 'sfx-finale' && other?.voices.some(v => !v.audio.paused)) return;
      if (other) for (const voice of other.voices) voice.audio.pause();
      this.duckRemaining = Math.max(this.duckRemaining, id === 'sfx-grand-finale' ? 4 : 4.2);
    } else if (id === 'sfx-order-place' || id === 'sfx-order-ready') {
      this.duckRemaining = Math.max(this.duckRemaining, id === 'sfx-order-place' ? 1.8 : 1.6);
    }
    effect.lastPlay = this.clock;
    const voice = effect.voices[effect.cursor];
    effect.cursor = (effect.cursor + 1) % effect.voices.length;
    voice.audio.currentTime = 0;
    voice.audio.volume = effect.gain;
    voice.audio.muted = this.soundMuted;
    voice.audio.playbackRate = id.startsWith('sfx-step-wet-') ? 0.95 + Math.random() * 0.1
      : id === 'sfx-cat-mrrp' ? 0.92 + Math.random() * 0.16
      : id === 'sfx-gull' ? 0.94 + Math.random() * 0.12 : 1;
    if (id === 'sfx-gull' && voice.panner) voice.panner.pan.value = Math.random() * 1.2 - 0.6;
    void voice.audio.play().catch(this.playRejected);
  }

  /** Simulation delta in seconds and player location in original map tiles. */
  update(dt: number, player: { x: number; y: number }, paused = false, ar = false, sitting = false): void {
    if (!this.unlocked || this.disposed) return;
    const delta = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    this.clock += delta;
    this.startup = Math.min(2, this.startup + delta);
    this.crossfade = Math.min(1.5, this.crossfade + delta);
    // Jingles keep playing during Pause, so their music-duck tails use audio time.
    this.duckRemaining = Math.max(0, this.duckRemaining - delta);
    if (!paused) {
      if (this.pendingUnlock >= 0) {
        this.pendingUnlock -= delta;
        if (this.pendingUnlock <= 0) { this.pendingUnlock = -1; this.play('sfx-unlock'); }
      }
      if (this.district === D3) {
        this.gullRemaining -= delta;
        if (this.gullRemaining <= 0) { this.gullRemaining = 25 + Math.random() * 35; this.play('sfx-gull'); }
      }
    }
    // Largest duck wins; simultaneous overlays never stack music attenuation.
    const musicTarget = paused || ar || this.duckRemaining > 0 ? db(-6) : sitting ? db(-4) : 1;
    this.musicDuck = mixToward(this.musicDuck, musicTarget, delta, musicTarget < this.musicDuck ? 0.3 : 0.5);
    this.ambienceDuck = mixToward(this.ambienceDuck, ar ? db(-3) : 1, delta, ar ? 0.3 : 0.5);
    this.sittingMix = mixToward(this.sittingMix, sitting ? 1 : 0, delta, 1);
    const start = this.startup / 2;
    for (const channel of this.loops) {
      const fraction = Math.min(1, this.crossfade / (channel.group === 'kitchen' ? 0.3 : 1.5));
      channel.weight = channel.from + (channel.target - channel.from) * fraction;
      let gain = channel.base * Math.sqrt(Math.max(0, channel.weight)) * start;
      if (channel.group === 'music') gain *= this.musicDuck;
      else {
        gain *= this.ambienceDuck;
        if (channel.id === 'amb-rain') gain *= (1 - this.sittingMix) + this.sittingMix * db(-3);
        else if (channel.id === 'amb-rain-awning') gain *= this.sittingMix * db(3);
        else if (channel.group === 'kitchen') {
          const distance = Math.hypot(player.x - channel.x, player.y - channel.y);
          gain *= clamp((8 - distance) / 6, 0, 1);
          if (channel.panner) channel.panner.pan.value = clamp((channel.x - player.x) / 8, -0.85, 0.85);
        }
      }
      channel.audio.volume = clamp(gain, 0, 1);
      if (channel.bufferGain && this.context) channel.bufferGain.gain.setTargetAtTime(this.soundMuted ? 0 : channel.audio.volume, this.context.currentTime, .03);
    }
    // At most two kitchens remain audible, including during district crossfades.
    let loudest: Loop | null = null, second: Loop | null = null;
    for (const channel of this.loops) if (channel.group === 'kitchen') {
      if (!loudest || channel.audio.volume > loudest.audio.volume) { second = loudest; loudest = channel; }
      else if (!second || channel.audio.volume > second.audio.volume) second = channel;
    }
    for (const channel of this.loops) if (channel.group === 'kitchen' && channel !== loudest && channel !== second) channel.audio.volume = 0;
  }

  setMusicMuted(muted: boolean): void {
    this.musicMuted = muted;
    for (const channel of this.loops) if (channel.group === 'music') channel.audio.muted = this.musicMuted;
  }

  setSoundMuted(muted: boolean): void {
    this.soundMuted = muted;
    for (const channel of this.loops) if (channel.group !== 'music') {
      channel.audio.muted = this.soundMuted;
      if (channel.bufferGain && this.context) channel.bufferGain.gain.setTargetAtTime(muted ? 0 : channel.audio.volume, this.context.currentTime, .03);
    }
    for (const effect of this.effects.values()) for (const voice of effect.voices) voice.audio.muted = this.soundMuted;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const channel of this.loops) { channel.bufferSource?.stop(); channel.bufferSource?.disconnect(); channel.bufferGain?.disconnect(); channel.audio.pause(); channel.audio.removeAttribute('src'); channel.audio.load(); channel.panner?.disconnect(); }
    for (const effect of this.effects.values()) for (const voice of effect.voices) {
      voice.audio.pause(); voice.audio.removeAttribute('src'); voice.audio.load(); voice.panner?.disconnect();
    }
    for (const source of this.sources) source.disconnect();
    if (this.context) void this.context.close().catch(this.playRejected);
  }
}
