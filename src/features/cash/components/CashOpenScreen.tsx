import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOpenCash } from "@/features/cash/hooks/useCash";
import { useAuthStore } from "@/stores/useAuthStore";
import { Icon } from "@/shared/components/ui/Icon";
import { PosHeader } from "@/shared/components/ui/PosHeader";

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
};

const REGISTROS = ["Caja 01", "Caja 02", "Caja 03", "Caja 04"];

interface CashOpenScreenProps {
  onOpened?: () => void;
}

export function CashOpenScreen({ onOpened }: CashOpenScreenProps) {
  const [openingAmount, setOpeningAmount] = useState("0.00");
  const [selectedCaja, setSelectedCaja] = useState(1);
  const [error, setError] = useState("");
  const { mutateAsync: openCash, isPending } = useOpenCash();

  const userName = useAuthStore((state) => state.user?.name ?? "Sofía Morales");
  const initials = useMemo(() => {
    const parts = userName.split(" ").filter(Boolean);
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts.length > 1 ? parts[1].charAt(0) : "";
    return (first + last).toUpperCase();
  }, [userName]);

  const now = useMemo(() => {
    const d = new Date();
    return {
      time: d.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  }, []);

  const amount = parseFloat(openingAmount) || 0;

  const handleKey = (key: string) => {
    setError("");
    if (key === "C") {
      setOpeningAmount("0.00");
      return;
    }
    if (key === "00") {
      setOpeningAmount((prev) => {
        if (prev.includes(".")) return prev;
        return prev + ".00";
      });
      return;
    }
    if (
      key === "+1" ||
      key === "+5" ||
      key === "+10" ||
      key === "+20" ||
      key === "+50"
    ) {
      const increment = parseInt(key.replace("+", ""), 10);
      setOpeningAmount((prev) => {
        const current = parseFloat(prev) || 0;
        return (current + increment).toFixed(2);
      });
      return;
    }
    setOpeningAmount((prev) => {
      if (prev === "0.00") return key;
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
      return prev + key;
    });
  };

  const handleConfirm = async () => {
    if (!amount || amount < 0) {
      setError("Ingrese un monto válido");
      return;
    }
    setError("");
    try {
      await openCash({
        openingAmount: amount,
        observation: "",
        equipment: { printer: true, scanner: true, internet: true },
      });
      if (onOpened) onOpened();
    } catch {
      setError("Error al abrir la caja");
    }
  };

  const renderAmount = () => {
    const [whole, decimal] = (openingAmount || "0.00").split(".");
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#94A3B8" }}>
          S/
        </Text>
        <Text
          style={{
            fontSize: 36,
            fontWeight: "700",
            color: "#FFFFFF",
            marginLeft: 4,
          }}
        >
          {whole}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#94A3B8" }}>
          .{decimal}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg }}
      edges={["top"]}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }}
        >
          {/* ─── Header ─── */}
          <PosHeader avatarName={userName} />

          {/* ─── Title ─── */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#FFFFFF",
                marginTop: 14,
              }}
            >
              Apertura de turno
            </Text>

            {/* ─── Profile ─── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.card,
                borderRadius: 14,
                padding: 10,
                marginTop: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: C.blue,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#FFFFFF",
                  }}
                >
                  {initials || "SM"}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  {userName}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: C.textSecondary,
                    marginTop: 1,
                  }}
                >
                  Operador POS
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon name="schedule" size={12} color={C.textSecondary} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: "#D1D5DB",
                      marginLeft: 3,
                    }}
                  >
                    {now.time}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 2,
                  }}
                >
                  <Icon
                    name="calendar_today"
                    size={11}
                    color={C.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: C.textSecondary,
                      marginLeft: 3,
                    }}
                  >
                    {now.date}
                  </Text>
                </View>
              </View>
            </View>

            {/* ─── Cash register selector ─── */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: C.textSecondary,
                letterSpacing: 1.2,
                marginTop: 14,
                textTransform: "uppercase",
              }}
            >
              SELECCIONAR CAJA / PDV
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {REGISTROS.map((r, i) => {
                const active = i === selectedCaja;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedCaja(i)}
                    style={{
                      flex: 1,
                      backgroundColor: active
                        ? "rgba(47,105,235,0.15)"
                        : C.inset,
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? C.blue : C.border,
                      borderRadius: 8,
                      paddingVertical: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: active ? "#FFFFFF" : C.textSecondary,
                      }}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

          {/* ─── Amount panel + keypad ─── */}
          <View
            style={{
              backgroundColor: C.inset,
              borderRadius: 14,
              padding: 14,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: C.textSecondary,
                letterSpacing: 0.5,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              MONTO DE APERTURA
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              {renderAmount()}
              <Pressable
                style={{ marginLeft: 10, padding: 4 }}
                onPress={() => setOpeningAmount("")}
              >
                <Icon
                  name="backspace"
                  size={20}
                  color={C.textSecondary}
                />
              </Pressable>
            </View>

            {/* Quick add row */}
            <View style={{ flexDirection: "row", gap: 6, marginTop: 12 }}>
              {["+1", "+5", "+10", "+20", "+50"].map((k) => (
                <Pressable
                  key={k}
                  onPress={() => handleKey(k)}
                  style={{
                    flex: 1,
                    backgroundColor: C.buttonIdle,
                    borderRadius: 6,
                    paddingVertical: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: "#F8FAFC",
                    }}
                  >
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Number grid 3x4 */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {["7", "8", "9"].map((k) => (
                <Pressable
                  key={k}
                  onPress={() => handleKey(k)}
                  style={{
                    flex: 1,
                    backgroundColor: C.card,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "500", color: "#FFFFFF" }}
                  >
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {["4", "5", "6"].map((k) => (
                <Pressable
                  key={k}
                  onPress={() => handleKey(k)}
                  style={{
                    flex: 1,
                    backgroundColor: C.card,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "500", color: "#FFFFFF" }}
                  >
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {["1", "2", "3"].map((k) => (
                <Pressable
                  key={k}
                  onPress={() => handleKey(k)}
                  style={{
                    flex: 1,
                    backgroundColor: C.card,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "500", color: "#FFFFFF" }}
                  >
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => handleKey("0")}
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "500", color: "#FFFFFF" }}
                >
                  0
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleKey("00")}
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#FFFFFF" }}
                >
                  00
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleKey("C")}
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#F87171" }}
                >
                  C
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ─── Bottom actions ─── */}
          <View style={{ paddingBottom: 4 }}>
            {error ? (
              <Text
                style={{
                  color: "#F87171",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={handleConfirm}
              disabled={isPending}
              style={{
                marginTop: error ? 6 : 10,
                backgroundColor: C.blue,
                borderRadius: 12,
                height: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                opacity: isPending ? 0.85 : 1,
              }}
            >
              <Icon name="lock_open" size={18} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginLeft: 10,
                }}
              >
                {isPending ? "Aperturando..." : "Confirmar apertura"}
              </Text>
              <Icon
                name="arrow_forward"
                size={16}
                weight={600}
                color="#FFFFFF"
                style={{ marginLeft: 10 }}
              />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
