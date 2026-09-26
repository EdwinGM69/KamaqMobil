import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, ThemeMode } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { Icon } from "@/shared/components/ui/Icon";

const C = {
  bg: "#121418",
  card: "#191B1F",
  inset: "#1E2228",
  border: "#2A2E37",
  buttonIdle: "#252931",
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  blue: "#2F69EB",
  green: "#10B981",
  red: "#E74C3C",
};

const THEME_OPTIONS: { id: ThemeMode; label: string; desc: string; icon: string }[] = [
  { id: "light", label: "Claro", desc: "Tema claro", icon: "light_mode" },
  { id: "dark", label: "Oscuro", desc: "Tema oscuro", icon: "dark_mode" },
  { id: "system", label: "Sistema", desc: "Según el dispositivo", icon: "settings_brightness" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const userName = user?.name ?? "Operador";
  const initials = useMemo(() => {
    const parts = userName.split(" ").filter(Boolean);
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts.length > 1 ? parts[1].charAt(0) : "";
    return (first + last).toUpperCase();
  }, [userName]);

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    clearCart();
    logout();
    setIsLoggingOut(false);
    setLogoutOpen(false);
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 }}
      >
        {/* ─── Header ─── */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="arrow_back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginLeft: 12 }}>
            Mi Cuenta
          </Text>
        </View>

        {/* ─── Profile ─── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.card,
            borderRadius: 14,
            padding: 14,
            marginTop: 16,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: C.blue,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>
              {initials || "OP"}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 1 }}>
              @{user?.username}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(16,185,129,0.15)",
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginTop: 5,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, marginRight: 4 }} />
              <Text style={{ fontSize: 9, fontWeight: "600", color: C.green, textTransform: "uppercase" }}>
                {user?.role}
              </Text>
            </View>
          </View>
          <Icon name="person" size={20} color={C.textSecondary} />
        </View>

        {/* ─── Apariencia ─── */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: C.textSecondary,
            letterSpacing: 0.6,
            marginTop: 20,
          }}
        >
          Apariencia
        </Text>
        <View style={{ marginTop: 8 }}>
          {THEME_OPTIONS.map((option) => {
            const active = theme === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setTheme(option.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: C.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? C.blue : C.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    backgroundColor: active ? "rgba(47,105,235,0.18)" : C.inset,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={option.icon} size={17} color={active ? C.blue : C.textSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                    {option.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>
                    {option.desc}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active ? C.blue : C.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.blue }} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Información ─── */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: C.textSecondary,
            letterSpacing: 0.6,
            marginTop: 12,
          }}
        >
          Información
        </Text>
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            marginTop: 8,
            paddingHorizontal: 14,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>Versión</Text>
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#FFFFFF" }}>1.0.0</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 }}>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>Rol</Text>
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#FFFFFF", textTransform: "capitalize" }}>
              {user?.role}
            </Text>
          </View>
        </View>

        {/* ─── Logout ─── */}
        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.red,
            borderRadius: 12,
            height: 50,
            marginTop: 20,
            opacity: isLoggingOut ? 0.85 : 1,
          }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="logout" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF", marginLeft: 10 }}>
                Cerrar Sesión
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* ─── Logout confirmation dialog ─── */}
      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <Pressable
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
            onPress={() => setLogoutOpen(false)}
            accessibilityLabel="Cancelar"
          />
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: C.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: C.border,
              padding: 20,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(231,76,60,0.15)",
                borderRadius: 24,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Icon name="logout" size={16} color={C.red} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.red, marginLeft: 6 }}>
                CERRAR SESIÓN
              </Text>
            </View>

            <Text style={{ fontSize: 17, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginTop: 14 }}>
              ¿Desea cerrar la sesión actual?
            </Text>
            <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 19 }}>
              Podrás volver a ingresar con tu cuenta.
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.inset,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginTop: 16,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: C.blue,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                  {initials || "OP"}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
                  {userName}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>
                  @{user?.username} · {user?.role}
                </Text>
              </View>
              <Icon name="person" size={18} color={C.textSecondary} />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                backgroundColor: "rgba(231,76,60,0.08)",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(231,76,60,0.25)",
                padding: 12,
                marginTop: 12,
              }}
            >
              <Icon name="info" size={16} color={C.red} />
              <Text style={{ flex: 1, fontSize: 12, color: C.textSecondary, marginLeft: 8, lineHeight: 17 }}>
                El carrito pendiente se vaciará al cerrar sesión.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Pressable
                onPress={() => setLogoutOpen(false)}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: C.buttonIdle,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmLogout}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: C.red,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isLoggingOut ? 0.85 : 1,
                }}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF", flexShrink: 1 }}>
                    Cerrar Sesión
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}