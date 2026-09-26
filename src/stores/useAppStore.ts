import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/infrastructure/storage/mmkv";

export type ThemeMode = "light" | "dark" | "system";

interface AppState {
  theme: ThemeMode;
  isOnboarded: boolean;
  setTheme: (theme: ThemeMode) => void;
  completeOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "light",
      isOnboarded: false,
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ isOnboarded: true }),
    }),
    {
      name: "kamaq-app",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
