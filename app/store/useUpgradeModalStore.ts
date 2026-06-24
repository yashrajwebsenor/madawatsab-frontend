import { create } from "zustand";

// Global "upgrade your plan" prompt. Opened from the axios response interceptor
// (api.ts) when the backend rejects an action with a plan-gating code such as
// INTEREST_LIMIT_REACHED, so any call site triggers the same modal without
// wiring its own state. Rendered once in Providers.tsx via UpgradePlanDialog.
interface UpgradeModalState {
  isOpen: boolean;
  message: string;
  open: (message?: string) => void;
  close: () => void;
}

const DEFAULT_MESSAGE =
  "Upgrade your plan to continue. Paid plans unlock unlimited access.";

const useUpgradeModalStore = create<UpgradeModalState>((set) => ({
  isOpen: false,
  message: DEFAULT_MESSAGE,
  open: (message) => set({ isOpen: true, message: message || DEFAULT_MESSAGE }),
  close: () => set({ isOpen: false }),
}));

export default useUpgradeModalStore;
