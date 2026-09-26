import { useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCashStore } from "@/stores/useCashStore";
import { authService } from "../services/auth.service";
import type { User } from "../types/auth.types";

export function useLogin() {
  const db = useSQLiteContext();
  const setAuth = useAuthStore((state) => state.setAuth);

  const login = useCallback(
    async (username: string, password: string): Promise<User | null> => {
      const user = await authService.login(db, username, password);

      if (user) {
        useCashStore.getState().closeSession();
        setAuth(user);
      }

      return user;
    },
    [db, setAuth]
  );

  return { login };
}