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

// Subtle by design — a soft whoosh under the wheel, not a sound effect that
// competes with it.
const PEAK_GAIN = 0.09;
const QUIET_HZ = 280;
const BRIGHT_HZ = 950;
const RELEASE_SEC = 0.08;

/** The wheel's real total spin time for a given `spinDuration` prop value. */
export const getSpinTotalDurationMs = (spinDuration: number) => {
  const factor = Math.max(0.01, spinDuration);
  return (
    (PHASE_UNIT_MS.start + PHASE_UNIT_MS.continue + PHASE_UNIT_MS.stop) *
    factor
  );
};

/**
 * Plays one continuous, smooth spinning sound synced to the wheel's three
 * real motion phases — a soft filtered-noise whoosh that fades in and
 * brightens through the ramp-up, holds steady through the brief top-speed
 * phase, then dims and fades back to silence through the long
 * decelerate-to-stop phase (react-custom-roulette's `onStopSpinning` fires at
 * the same total time computed here). No discrete ticks/clicks — just one
 * smooth swell and release. Returns a cancel function for early interruption
 * (component unmount, navigating away mid-spin).
 */
export const playSpinSound = (spinDuration: number): (() => void) => {
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  const factor = Math.max(0.01, spinDuration);
  const startSec = (PHASE_UNIT_MS.start * factor) / 1000;
  const continueSec = (PHASE_UNIT_MS.continue * factor) / 1000;
  const stopSec = (PHASE_UNIT_MS.stop * factor) / 1000;

  const now = ctx.currentTime;
  const holdStart = now + startSec;
  const holdEnd = holdStart + continueSec;
  const end = holdEnd + stopSec;

  // Continuous soft noise bed — a lowpass filter's cutoff sweeping up then
  // down is what makes it read as "spinning up / winding down" rather than a
  // flat hiss.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(QUIET_HZ, now);
  filter.frequency.linearRampToValueAtTime(BRIGHT_HZ, holdStart);
  filter.frequency.setValueAtTime(BRIGHT_HZ, holdEnd);
  filter.frequency.linearRampToValueAtTime(QUIET_HZ, end);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, Math.min(holdStart, now + 0.4));
  gain.gain.setValueAtTime(PEAK_GAIN, holdEnd);
  gain.gain.linearRampToValueAtTime(0, end);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(end + RELEASE_SEC);

  return () => {
    const t = ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + RELEASE_SEC);
      noise.stop(t + RELEASE_SEC);
    } catch {
      // Already stopped — nothing to clean up.
    }
  };
};
