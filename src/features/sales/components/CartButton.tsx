import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { useCart } from "@/features/sales/hooks/useCart";

const CART_COLOR = "#F1F5F9";
const BADGE_COLOR = "#C82333";
const SURFACE = "#262A32";
const BORDER = "#3C434E";

export function CartButton() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [scale] = useState(() => new Animated.Value(1));
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 140, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 180, useNativeDriver: true }),
    ]).start();
  }, [itemCount, scale]);

  const label = itemCount > 99 ? "99+" : `${itemCount}`;

  return (
    <Pressable
      onPress={() => router.push("/sales/cart")}
      accessibilityRole="button"
      accessibilityLabel={`Carrito, ${itemCount} productos`}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: itemCount > 0 ? SURFACE : "transparent",
          borderWidth: 1,
          borderColor: itemCount > 0 ? BORDER : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View>
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <Path
            d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
            fill="none"
            stroke={CART_COLOR}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1={9.6} y1={7.4} x2={10.4} y2={13.6} stroke={CART_COLOR} strokeWidth={1.3} strokeLinecap="round" opacity={0.9} />
          <Line x1={12.6} y1={7.4} x2={13.4} y2={13.6} stroke={CART_COLOR} strokeWidth={1.3} strokeLinecap="round" opacity={0.9} />
          <Line x1={15.6} y1={7.4} x2={16.4} y2={13.6} stroke={CART_COLOR} strokeWidth={1.3} strokeLinecap="round" opacity={0.9} />
          <Circle cx={9} cy={21} r={1.5} fill={CART_COLOR} />
          <Circle cx={20} cy={21} r={1.5} fill={CART_COLOR} />
        </Svg>

        {itemCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{ scale }],
              },
            ]}
          >
            <Text style={[styles.badgeText, label.length > 2 && { fontSize: 8 }]}>{label}</Text>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BADGE_COLOR,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#1A1D23",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
    includeFontPadding: false,
  },
});