import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UseConfigStore {
  config: Record<string, string>;
  setConfig: (config: Record<string, string>) => void;
}

const useConfigStore = create<UseConfigStore>()(
  persist(
    (set) => ({
      config: {},
      setConfig: (config: Record<string, string>) => set({ config }),
    }),
    {
      name: "config",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useConfigStore;
