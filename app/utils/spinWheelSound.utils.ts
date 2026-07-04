let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }

  // Browsers suspend the context until a user gesture — the spin button
  // click counts, but resume defensively in case it was created earlier.
  if (audioCtx.state === "suspended") audioCtx.resume();

  return audioCtx;
};

// react-custom-roulette's `spinDuration` prop is NOT seconds — it's a
// multiplier over three internal phases (start ramp-up, hold at speed,
// stop/decelerate) that the library doesn't expose. These ms values mirror
// its hardcoded constants (react-custom-roulette@1.4.x,
// dist/components/Wheel/index.js: START/CONTINUE/STOP_SPINNING_TIME). If a
// future version changes them the sound just drifts slightly out of sync —
// not fatal, but re-check this if upgrading the package.
const PHASE_UNIT_MS = { start: 2600, continue: 750, stop: 8000 };

/** The wheel's real total spin time for a given `spinDuration` prop value. */
export const getSpinTotalDurationMs = (spinDuration: number) => {
  const factor = Math.max(0.01, spinDuration);
  return (
    (PHASE_UNIT_MS.start + PHASE_UNIT_MS.continue + PHASE_UNIT_MS.stop) *
    factor
  );
};

// Modeled on a physical ratchet/peg wheel (prize-wheel clicker), not a
// whoosh: discrete noise-burst clicks, near-silence between them, ringing at
// one dominant pitch. Click *rate* (not interval) is what's interpolated
// linearly across the ramp/decel phases — that's what constant angular
// acceleration/deceleration looks like, so intervals naturally stretch out
// (hyperbolically) as the wheel slows, matching how a real peg wheel sounds.
const CLICK_HZ = 5600;
const CLICK_RING_SEC = 0.02;
const CLICK_PEAK_GAIN = 0.35;
const START_CLICK_RATE = 3; // clicks/sec at the very start of the ramp-up
const TOP_CLICK_RATE = 9.6; // clicks/sec while cruising at full speed
const END_CLICK_RATE = 1.6; // clicks/sec right before the wheel stops

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

let clickNoiseBuffer: AudioBuffer | null = null;

const getClickNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (!clickNoiseBuffer || clickNoiseBuffer.sampleRate !== ctx.sampleRate) {
    // A short noise burst is enough to excite the bandpass below into a
    // ring at its center frequency — this buffer isn't "the click sound",
    // it's just the impulse that drives one.
    clickNoiseBuffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * CLICK_RING_SEC),
      ctx.sampleRate,
    );
    const data = clickNoiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return clickNoiseBuffer;
};

/** Schedules one peg click at `time` (an AudioContext timestamp). */
const playClick = (ctx: AudioContext, time: number): AudioBufferSourceNode => {
  const source = ctx.createBufferSource();
  source.buffer = getClickNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = CLICK_HZ * (0.95 + Math.random() * 0.1);
  filter.Q.value = 14 + Math.random() * 6;

  const gain = ctx.createGain();
  const peak = CLICK_PEAK_GAIN * (0.8 + Math.random() * 0.2);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + CLICK_RING_SEC);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(time);
  source.stop(time + CLICK_RING_SEC + 0.01);

  return source;
};

/** Click offsets (seconds from spin start) across the wheel's three phases. */
const buildClickSchedule = (
  startSec: number,
  continueSec: number,
  stopSec: number,
): number[] => {
  const offsets: number[] = [];
  // `t` deliberately isn't snapped back to each phase boundary — the previous
  // phase's last step naturally overshoots it by a few ms, and re-aligning
  // would shove two clicks close enough together to sound like a stutter.
  let t = 0;

  while (t < startSec) {
    offsets.push(t);
    t += 1 / lerp(START_CLICK_RATE, TOP_CLICK_RATE, t / startSec);
  }

  const holdEnd = startSec + continueSec;
  while (t < holdEnd) {
    offsets.push(t);
    t += 1 / TOP_CLICK_RATE;
  }

  const end = holdEnd + stopSec;
  while (t < end) {
    offsets.push(t);
    const progress = Math.max(0, (t - holdEnd) / stopSec);
    t += 1 / lerp(TOP_CLICK_RATE, END_CLICK_RATE, progress);
  }

  return offsets;
};

/**
 * Plays a ratchet/peg-wheel click sequence synced to the wheel's three real
 * motion phases — clicks accelerate through the ramp-up, hold at a steady
 * rate through the brief top-speed phase, then decelerate across the long
 * stop phase down to a near-standstill (react-custom-roulette's
 * `onStopSpinning` fires at the same total time computed here). Returns a
 * cancel function for early interruption (component unmount, navigating away
 * mid-spin).
 */
export const playSpinSound = (spinDuration: number): (() => void) => {
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  const factor = Math.max(0.01, spinDuration);
  const startSec = (PHASE_UNIT_MS.start * factor) / 1000;
  const continueSec = (PHASE_UNIT_MS.continue * factor) / 1000;
  const stopSec = (PHASE_UNIT_MS.stop * factor) / 1000;

  const now = ctx.currentTime;
  const sources = buildClickSchedule(startSec, continueSec, stopSec).map(
    (offset) => playClick(ctx, now + offset),
  );

  return () => {
    const t = ctx.currentTime;
    sources.forEach((source) => {
      try {
        source.stop(t);
      } catch {
        // Already stopped — nothing to clean up.
      }
    });
  };
};
