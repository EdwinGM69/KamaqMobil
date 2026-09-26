import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { categoryEmoji, categoryColor } from "@/shared/utils/categories";

interface ProductThumbProps {
  category: string | null;
  size?: number;
}

export function ProductThumb({ category, size = 48 }: ProductThumbProps) {
  const emoji = categoryEmoji(category);
  const bg = categoryColor(category);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.24)", "rgba(0,0,0,0.18)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Text style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{emoji}</Text>
    </View>
  );
}