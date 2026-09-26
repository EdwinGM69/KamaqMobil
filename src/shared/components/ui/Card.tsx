import { Text, View, type TextProps } from "react-native";
import { twMerge } from "./twMerge";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={twMerge(
        "bg-kamaq-surface rounded-2xl p-5 shadow-sm border border-kamaq-border",
        className
      )}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, right, className }: CardHeaderProps) {
  return (
    <View className={twMerge("flex-row items-center justify-between mb-3", className)}>
      <View className="flex-1">
        {title ? (
          <Text className="text-base font-semibold text-kamaq-text-primary">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="text-sm text-kamaq-text-muted mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={twMerge("mt-4 pt-4 border-t border-kamaq-border", className)}>
      {children}
    </View>
  );
}
