import { Text, View, Pressable } from "react-native";
import { twMerge } from "./twMerge";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "📦",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={twMerge("items-center justify-center py-16 px-8", className)}>
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-lg font-semibold text-kamaq-text-primary text-center mb-2">
        {title}
      </Text>
      {description ? (
        <Text className="text-sm text-kamaq-text-muted text-center mb-6">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="bg-kamaq-primary px-6 py-3 rounded-xl active:bg-kamaq-primary-dark"
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
