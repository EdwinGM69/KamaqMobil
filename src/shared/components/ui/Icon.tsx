import { Text, type ColorValue, type TextStyle } from "react-native";

export type IconWeight = 400 | 600 | 700;

const FONT_FAMILIES: Record<IconWeight, string> = {
  400: "MaterialSymbols_400Regular",
  600: "MaterialSymbols_600SemiBold",
  700: "MaterialSymbols_700Bold",
};

interface IconProps {
  name: string;
  size?: number;
  color?: ColorValue;
  weight?: IconWeight;
  style?: TextStyle;
}

export function Icon({
  name,
  size = 20,
  color = "#FFFFFF",
  weight = 400,
  style,
}: IconProps) {
  return (
    <Text
      selectable={false}
      style={[
        {
          fontFamily: FONT_FAMILIES[weight],
          fontSize: size,
          lineHeight: size + 4,
          color,
        },
        style,
      ]}
    >
      {name}
    </Text>
  );
}