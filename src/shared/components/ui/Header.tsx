import { Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { twMerge } from "./twMerge";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
  className?: string;
}

export function Header({ title, subtitle, right, showBack = false, className }: HeaderProps) {
  const router = useRouter();

  return (
    <View className={twMerge("px-4 pt-4 pb-3 bg-kamaq-surface border-b border-kamaq-border", className)}>
      <View className="flex-row items-center gap-3">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-kamaq-background active:bg-gray-200"
          >
            <Text className="text-2xl text-kamaq-primary">←</Text>
          </Pressable>
        )}
        <View className="flex-1">
          {title ? (
            <Text className="text-xl font-bold text-kamaq-text-primary">{title}</Text>
          ) : null}
          {subtitle ? (
            <Text className="text-sm text-kamaq-text-muted">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}
