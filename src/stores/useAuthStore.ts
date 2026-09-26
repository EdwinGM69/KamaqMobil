import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/infrastructure/storage/mmkv";

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberUser: boolean;
  lastUsername: string;
  setAuth: (user: User) => void;
  logout: () => void;
  setRememberUser: (remember: boolean, username?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      rememberUser: false,
      lastUsername: "",
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setRememberUser: (remember, username = "") =>
        set({ rememberUser: remember, lastUsername: username }),
    }),
    {
      name: "kamaq-auth",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
