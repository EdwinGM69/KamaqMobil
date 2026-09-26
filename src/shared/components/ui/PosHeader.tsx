import { type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/shared/components/ui/Icon";
import { useOffline } from "@/shared/hooks/useOffline";

const H = {
  green: "#10B981",
  greenBg: "rgba(16,185,129,0.12)",
  orange: "#FBBF24",
  orangeBg: "rgba(251,191,36,0.12)",
  red: "#F87171",
  redBg: "rgba(248,113,113,0.12)",
  blue: "#2F69EB",
  textSecondary: "#94A3B8",
};

interface PosHeaderProps {
  children?: ReactNode;
  avatarName?: string;
  showAvatar?: boolean;
}

export function PosHeader({ children, avatarName, showAvatar = true }: PosHeaderProps) {
  const router = useRouter();
  const { isOffline } = useOffline();

  const badge = isOffline
    ? { color: H.red, bg: H.redBg, icon: "cloud_off", label: "SIN CONEXIÓN" }
    : { color: H.green, bg: H.greenBg, icon: "cloud_done", label: "EN LÍNEA" };

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: badge.bg,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Icon name={badge.icon} size={13} color={badge.color} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: badge.color, textTransform: "uppercase", marginLeft: 5 }}>
            {badge.label}
          </Text>
        </View>
        {children ? <View style={{ marginTop: 6 }}>{children}</View> : null}
      </View>
      {showAvatar && (
        <Pressable onPress={() => router.push("/settings")} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: H.blue,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="person" size={22} weight={600} color="#FFFFFF" />
          </View>
          {avatarName ? (
            <Text numberOfLines={1} style={{ fontSize: 10, color: H.textSecondary, marginTop: 3, maxWidth: 96 }}>
              {avatarName}
            </Text>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}