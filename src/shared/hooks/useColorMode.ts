import { useMemo } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useAppStore } from "@/stores/useAppStore";

export function useColorMode() {
  const systemColorScheme = useRNColorScheme();
  const theme = useAppStore((state) => state.theme);

  const isDark = useMemo(() => {
    if (theme === "system") {
      return systemColorScheme === "dark";
    }
    return theme === "dark";
  }, [theme, systemColorScheme]);

  return {
    isDark,
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
  };
}

export const LIGHT_COLORS = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  primary: "#0F4C81",
  text: "#1A1A2E",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
};

export const DARK_COLORS = {
  background: "#1A1A2E",
  surface: "#16213E",
  primary: "#1A6BB5",
  text: "#E8E8E8",
  textSecondary: "#A0A0B0",
  border: "#2C3E50",
};
