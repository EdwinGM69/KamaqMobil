import { Text, View } from "react-native";
import { twMerge } from "./twMerge";

type BadgeVariant = "success" | "warning" | "error" | "info" | "muted";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "bg-green-100", text: "text-green-700" },
  warning: { bg: "bg-amber-100", text: "text-amber-700" },
  error: { bg: "bg-red-100", text: "text-red-700" },
  info: { bg: "bg-blue-100", text: "text-blue-700" },
  muted: { bg: "bg-gray-100", text: "text-gray-600" },
};

export function Badge({ label, variant = "info", className }: BadgeProps) {
  return (
    <View
      className={twMerge(
        "px-3 py-1 rounded-full items-center justify-center",
        variants[variant].bg,
        className
      )}
    >
      <Text className={twMerge("text-xs font-semibold", variants[variant].text)}>
        {label}
      </Text>
    </View>
  );
}
