import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const variantBackgrounds: Record<Variant, string> = {
  primary: "#0F4C81",
  secondary: "#2A9D8F",
  outline: "transparent",
  ghost: "transparent",
  danger: "#E63946",
  success: "#2ECC71",
};

const labelColors: Record<Variant, string> = {
  primary: "#FFFFFF",
  secondary: "#FFFFFF",
  outline: "#0F4C81",
  ghost: "#0F4C81",
  danger: "#FFFFFF",
  success: "#FFFFFF",
};

const labelSizes: Record<Size, number> = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

const labelWeights: Record<Size, TextStyle["fontWeight"]> = {
  sm: "600",
  md: "600",
  lg: "600",
  xl: "700",
};

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  md: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  lg: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  xl: { paddingHorizontal: 32, paddingVertical: 20, borderRadius: 20 },
};

export function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  label,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle: ViewStyle = {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...sizeStyles[size],
    backgroundColor: variantBackgrounds[variant],
    borderWidth: variant === "outline" ? 2 : 0,
    borderColor: variant === "outline" ? "#0F4C81" : "transparent",
    opacity: isDisabled ? 0.5 : 1,
  };

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      activeOpacity={0.85}
      className={className}
      style={[baseStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#0F4C81" : "#fff"} />
      ) : (
        children ?? (
          <Text
            style={{
              color: labelColors[variant],
              fontSize: labelSizes[size],
              fontWeight: labelWeights[size],
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        )
      )}
    </TouchableOpacity>
  );
}