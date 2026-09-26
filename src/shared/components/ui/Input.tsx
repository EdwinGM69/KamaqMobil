import { forwardRef } from "react";
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
} from "react-native";
import { twMerge } from "./twMerge";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, style, ...props },
  ref
) {
  return (
    <View className="w-full mb-4">
      {label ? (
        <Text className="text-sm font-medium text-kamaq-text-secondary mb-2 pl-1">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#ADB5BD"
        {...props}
        className={twMerge(
          "w-full bg-white border-2 border-kamaq-border rounded-xl px-4 py-4 text-base text-kamaq-text-primary",
          error && "border-kamaq-error",
          className
        )}
        style={style}
      />
      {error ? <Text className="text-sm text-kamaq-error mt-1 pl-1">{error}</Text> : null}
    </View>
  );
});
