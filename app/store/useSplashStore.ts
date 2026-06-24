import { create } from "zustand";

// Tracks the first-load splash intro (SplashIntro.tsx). While `done` is false
// the navbar's brand logo stays hidden so the splash logo can "fly" into its
// slot without a duplicate showing underneath. Intentionally NOT persisted:
// the flag lives only in memory for the current SPA session, so the intro
// plays once per page load but never replays during client navigations.
interface SplashState {
  done: boolean;
  setDone: () => void;
}

const useSplashStore = create<SplashState>((set) => ({
  done: false,
  setDone: () => set({ done: true }),
}));

export default useSplashStore;
