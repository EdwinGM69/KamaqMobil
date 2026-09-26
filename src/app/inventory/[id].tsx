import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useProduct } from "@/features/sales/hooks/useProducts";
import {
  useProductMovements,
  useApplyProductMovement,
} from "@/features/inventory/hooks/useProductMovements";
import { getStatus, STATUS_META } from "@/features/inventory/components/LocationBreakdown";
import { type MovementType } from "@/infrastructure/database/repositories/productMovements.repo";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOffline } from "@/shared/hooks/useOffline";
import { formatCurrency } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";
import { categoryEmoji } from "@/shared/utils/categories";

/* ─── Design tokens (spec 4.1) ─── */
const C = {
  bg: "#0B0E14",
  surface: "#141922",
  surface2: "#1C222E",
  border: "#262E3D",
  text: "#F1F4F9",
  textDim: "#8A93A6",
  textFaint: "#5C6478",
  accent: "#4C8DFF",
  accentBg: "rgba(76,141,255,0.14)",
  success: "#34D399",
  successBg: "rgba(52,211,153,0.14)",
  warning: "#FBBF24",
  warningBg: "rgba(251,191,36,0.14)",
  danger: "#F87171",
  dangerBg: "rgba(248,113,113,0.14)",
  info: "#818CF8",
  infoBg: "rgba(129,140,248,0.14)",
};

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

const MOVEMENT_META: Record<
  MovementType,
  { label: string; tag: string | null; icon: string; color: string; bg: string }
> = {
  VENTA_POS: { label: "Venta", tag: null, icon: "point_of_sale", color: C.accent, bg: C.accentBg },
  AJUSTE_MERMA: { label: "Ajuste por merma", tag: "Merma", icon: "delete", color: C.danger, bg: C.dangerBg },
  INGRESO_MERCADERIA: { label: "Ingreso de mercadería", tag: "Ingreso", icon: "add_box", color: C.success, bg: C.successBg },
  AUDITORIA: { label: "Auditoría", tag: "Auditoría", icon: "fact_check", color: C.info, bg: C.infoBg },
  AJUSTE_MANUAL: { label: "Ajuste manual", tag: "Ajuste", icon: "edit_note", color: C.warning, bg: C.warningBg },
};

const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  aceites: ["#4A3B16", "#8A5A1B"],
  granos: ["#3A2E1B", "#8A6D3B"],
  pastas: ["#4A3B2E", "#A3804F"],
  azucar: ["#463A2B", "#9A8A5A"],
  lacteos: ["#38445A", "#7FB2C7"],
  bebidas: ["#123A52", "#1F6F8B"],
  cervezas: ["#2E3138", "#6B4F3A"],
  panetones: ["#3B2A1B", "#7A4A2A"],
  condimentos: ["#3A2A22", "#A8472B"],
  higiene: ["#4C2030", "#A8325A"],
  enlatados: ["#33383F", "#8F9AA3"],
  galletas: ["#3B2A18", "#B76E1F"],
};

type MovFilter = "todos" | "VENTA_POS" | "AJUSTE" | "INGRESO";

const MOV_FILTERS: { id: MovFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "VENTA_POS", label: "Ventas" },
  { id: "AJUSTE", label: "Ajustes" },
  { id: "INGRESO", label: "Ingresos" },
];

const UBICACIONES = [
  { id: "exhibicion", label: "Exhibición" },
  { id: "deposito", label: "Depósito" },
];

const MOTIVOS = ["Merma", "Robo", "Corrección de conteo", "Traslado"];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const productId = Number(id);
  const { height } = useWindowDimensions();

  const { data: product, isLoading, error, refetch } = useProduct(productId);
  const { data: movementsData, refetch: refetchMovements } = useProductMovements(productId);
  const { mutateAsync: applyMovement, isPending: appPending } = useApplyProductMovement(productId);
  const { isOffline } = useOffline();
  const user = useAuthStore((state) => state.user);
  const canViewCosts = user?.role === "admin";

  const [menuOpen, setMenuOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [movFilter, setMovFilter] = useState<MovFilter>("todos");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const movements = useMemo(() => movementsData?.movements ?? [], [movementsData]);
  const movementsTotal = movementsData?.total ?? 0;
  const shownMovements = useMemo(() => {
    if (movFilter === "todos") return movements;
    if (movFilter === "VENTA_POS") return movements.filter((m) => m.type === "VENTA_POS");
    if (movFilter === "INGRESO") return movements.filter((m) => m.type === "INGRESO_MERCADERIA");
    return movements.filter((m) => m.type === "AJUSTE_MERMA" || m.type === "AJUSTE_MANUAL");
  }, [movements, movFilter]);

  const skeletonOpacity = useMemo(() => new Animated.Value(0.35), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 0.9, duration: 600, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [skeletonOpacity]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  if (error && !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <StatusBar style="light" />
        <ShellHeader showMenu={() => setMenuOpen(true)} title="" />
        <View style={{ marginHorizontal: 16, marginTop: 10, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18, alignItems: "center" }}>
          <Icon name="cloud_off" size={40} color={C.textFaint} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginTop: 10, textAlign: "center" }}>
            No se pudo cargar el detalle del producto
          </Text>
          <Pressable
            onPress={() => {
              refetch();
              refetchMovements();
            }}
            accessibilityLabel="Reintentar"
            style={{ marginTop: 12, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <StatusBar style="light" />
        <ShellHeader showMenu={() => setMenuOpen(true)} title="" />
        <SkeletonDetail opacity={skeletonOpacity} height={height} />
      </SafeAreaView>
    );
  }

  const stockState = getStatus(product);
  const statusMeta = STATUS_META[stockState];

  const stockDecimals = Math.min(Math.max(product.decimals ?? 0, 0), 3);
  const fmtStock = (v: number) =>
    v.toFixed(v % 1 === 0 ? 0 : stockDecimals);

  const exhibition = Math.round(product.stock * 0.6 * 1000) / 1000;
  const desglose = [
    { label: "Exhibición", value: exhibition, color: C.success },
    { label: "Depósito", value: Math.round((product.stock - exhibition) * 1000) / 1000, color: C.info },
  ];

  const capacityMax = Math.max(10, product.min_stock * 2);
  const capacityPct = capacityMax > 0 ? (product.stock / capacityMax) * 100 : 0;
  const showCapacity = capacityMax > 0;

  const marginPct = product.price > 0 ? ((product.price - product.cost_price) / product.price) * 100 : 0;

  const expiry = product.expiration_date;
  const daysLeft = expiry ? Math.floor((new Date(`${expiry}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
  const expiryColor = daysLeft === null ? C.textDim : daysLeft > 90 ? C.success : daysLeft >= 30 ? C.warning : C.danger;
  const expiryLabel = daysLeft === null ? "" : daysLeft < 0 ? `Vencido hace ${Math.abs(daysLeft)} días` : daysLeft <= 30 ? `Vence pronto · ${daysLeft} días` : `Vencimiento · ${daysLeft} días`;

  const gradient = CATEGORY_GRADIENT[product.category] ?? ["#1C222E", "#2A3344"];
  const emoji = categoryEmoji(product.category);

  const copyBarcode = async () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(product.barcode);
        showToast("Código copiado");
        return;
      } catch {
        /* fallback */
      }
    }
    showToast("Mantén presionado el código para copiarlo");
  };

  const handleApplyAdjust = async (vars: { delta: number; motivo: string; ubicacion: string; comentario: string }) => {
    const aplicar = async () => {
      try {
        await applyMovement({
          delta: vars.delta,
          type: vars.motivo === "Robo" ? "AJUSTE_MANUAL" : "AJUSTE_MERMA",
          motivo: vars.motivo,
          ubicacion: vars.ubicacion,
          comentario: vars.comentario || null,
          usuario: (user?.name ?? "Operador").split(" ").slice(0, 2).join(" "),
        });
        setAdjustOpen(false);
        showToast("Stock ajustado correctamente");
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "No se pudo ajustar el stock");
      }
    };

    if (vars.delta < 0) {
      Alert.alert(
        vars.motivo === "Robo" ? "Confirmar robo" : "Confirmar merma",
        `Se descontarán ${Math.abs(vars.delta)} ${product.unit ?? "unidad(es)"} por ${vars.motivo.toLowerCase()} en ${vars.ubicacion}. Esta acción reduce el stock de forma permanente.\n\n¿Continuar?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Aplicar ajuste", style: "destructive", onPress: aplicar },
        ]
      );
      return;
    }
    aplicar();
  };

  const handleRegisterIncome = async (vars: { cantidad: number; oc: string; lote: string; vencimiento: string }) => {
    try {
      await applyMovement({
        delta: vars.cantidad,
        type: "INGRESO_MERCADERIA",
        referencia: vars.oc ? `OC-${vars.oc}` : "Ingreso manual",
        comentario: [vars.lote ? `Lote ${vars.lote}` : "", vars.vencimiento ? `Vence ${vars.vencimiento}` : ""].filter(Boolean).join(" · ") || null,
        usuario: (user?.name ?? "Operador").split(" ").slice(0, 2).join(" "),
      });
      setIncomeOpen(false);
      showToast("Ingreso registrado");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo registrar el ingreso");
    }
  };

  const primaryActionLabel = stockState === "out" ? "Reponer ahora" : "Registrar ingreso";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96, paddingTop: 6 }}
      >
        {/* ─── 3.2 Header de navegación ─── */}
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Volver al listado"
            style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="arrow_back" size={22} color={C.text} />
          </Pressable>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: "600", color: C.text, textAlign: "center" }}>
            Detalle de producto
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => showToast("Impresión de etiqueta próximamente")}
              hitSlop={8}
              accessibilityLabel="Imprimir etiqueta"
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="print" size={20} color={C.text} />
            </Pressable>
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={8}
              accessibilityLabel="Más opciones"
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="more_vert" size={20} color={C.text} />
            </Pressable>
          </View>
        </View>

        {isOffline ? (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.warningBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 }}>
            <Icon name="cloud_off" size={16} color={C.warning} />
            <Text style={{ fontSize: 11, fontWeight: "600", color: C.warning, marginLeft: 8 }}>
              Mostrando datos locales · sin conexión
            </Text>
          </View>
        ) : null}

        {/* ─── 3.3 Hero del producto ─── */}
        <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 30 }}>{emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ backgroundColor: statusMeta.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: statusMeta.color, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {statusMeta.label.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, marginTop: 6 }}>{product.name}</Text>
              <Text style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>
                {product.category} · {product.unit}
              </Text>
              <Text selectable style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO, marginTop: 3 }}>
                SKU {product.barcode}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 3.4 Barra de capacidad segmentada ─── */}
        {showCapacity ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>
                {fmtStock(product.stock)} <Text style={{ fontSize: 11, fontWeight: "400", color: C.textDim }}>{product.unit}</Text>
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: product.stock > capacityMax ? C.warning : C.textDim }}>
                {capacityPct.toFixed(0)}% del plan (máx. {capacityMax})
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                height: 8,
                borderRadius: 4,
                overflow: "hidden",
                backgroundColor: stockState === "out" ? C.surface2 : C.border,
                marginTop: 10,
                gap: 1,
              }}
            >
              {stockState === "out" ? (
                <View style={{ flex: 1, backgroundColor: C.surface2 }} />
              ) : (
                desglose.map((seg) =>
                  seg.value > 0 ? (
                    <View
                      key={seg.label}
                      style={{ width: `${(seg.value / product.stock) * 100}%`, backgroundColor: seg.color }}
                    />
                  ) : null
                )
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              {desglose.map((seg) => (
                <View key={seg.label} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: seg.color }} />
                  <Text style={{ fontSize: 10, color: C.textDim, marginLeft: 4, flexShrink: 1 }} numberOfLines={1}>
                    {seg.label}
                  </Text>
                  <Text
                    style={{ fontSize: 11, fontWeight: "700", color: C.text, fontFamily: MONO, marginLeft: 4, fontVariant: ["tabular-nums"] }}
                  >
                    {fmtStock(seg.value)}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 10, color: C.textFaint, marginTop: 10 }}>
              Capacidad planificada: {fmtStock(capacityMax)} {product.unit} (2× el punto de reorden · mín. {fmtStock(product.min_stock)})
            </Text>
          </View>
        ) : null}

        {/* ─── 3.5 Bloque de precios (solo con permiso) ─── */}
        {canViewCosts ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: C.textFaint, letterSpacing: 0.3 }}>
                Costo unitario
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text, fontFamily: MONO, marginTop: 5, fontVariant: ["tabular-nums"] }}>
                {formatCurrency(product.cost_price)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: C.textFaint, letterSpacing: 0.3 }}>
                Precio de venta
              </Text>
              <Text style={{ fontSize: 17, fontWeight: "800", color: C.success, fontFamily: MONO, marginTop: 5, fontVariant: ["tabular-nums"] }}>
                {formatCurrency(product.price)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ─── 3.6 Ubicación y logística ─── */}
        <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, letterSpacing: 0.2 }}>
            Ubicación y logística
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <View>
              <Text style={{ fontSize: 10, color: C.textFaint, letterSpacing: 0.3 }}>Código de barras (EAN-13)</Text>
              <Text selectable style={{ fontSize: 13, fontWeight: "600", color: C.text, fontFamily: MONO, marginTop: 3 }}>
                {product.barcode}
              </Text>
            </View>
            <Pressable
              onPress={copyBarcode}
              hitSlop={8}
              accessibilityLabel="Copiar código de barras"
              style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="content_copy" size={18} color={C.textDim} />
            </Pressable>
          </View>

          {expiry ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: expiryColor === C.success ? C.successBg : expiryColor === C.warning ? C.warningBg : C.dangerBg, alignItems: "center", justifyContent: "center" }}>
                <Icon name="event" size={17} color={expiryColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 11, color: C.textDim }}>Lote activo</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: C.text, marginTop: 1 }}>
                  {new Date(`${expiry}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                  <Text style={{ color: expiryColor }}> · {expiryLabel}</Text>
                </Text>
              </View>
            </View>
          ) : null}

          {product.min_stock > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
              <Text style={{ fontSize: 11, color: C.textDim }}>Punto de reorden</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, fontFamily: MONO, marginLeft: 8, fontVariant: ["tabular-nums"] }}>
                {product.min_stock}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ─── 3.7 Precios y rentabilidad (solo con permiso) ─── */}
        {canViewCosts ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, letterSpacing: 0.2 }}>
                Precios y rentabilidad
              </Text>
              <View style={{ backgroundColor: marginPct >= 0 ? C.successBg : C.dangerBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: marginPct >= 0 ? C.success : C.danger, fontFamily: MONO, fontVariant: ["tabular-nums"] }}>
                  Margen {marginPct.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }}>
                <Icon name="local_shipping" size={17} color={C.textDim} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 11, color: C.textDim }}>Proveedor habitual</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: C.text, marginTop: 1 }}>No asignado</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ─── 3.8 Movimientos ─── */}
        <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, letterSpacing: 0.2 }}>
              Movimientos
            </Text>
            <Text style={{ fontSize: 11, color: C.textFaint }}>
              {movements.length} de {movementsTotal}
            </Text>
          </View>

          <MovementTabs active={movFilter} onChange={setMovFilter} />

          <View style={{ marginTop: 6 }}>
            {shownMovements.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Icon name="history" size={34} color={C.textFaint} />
                <Text style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>Sin movimientos para este filtro</Text>
              </View>
            ) : (
              shownMovements.map((m) => <MovementRow key={m.id} movement={m} />)
            )}
          </View>

          {movementsTotal > movements.length ? (
            <Pressable
              onPress={() => showToast("Historial completo próximamente")}
              style={{ flexDirection: "row", alignItems: "center", marginTop: 10, paddingVertical: 8, alignSelf: "flex-start", minHeight: 44 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.accent }}>
                Ver todos los movimientos ({movementsTotal})
              </Text>
              <Icon name="arrow_forward" size={16} color={C.accent} style={{ marginLeft: 6 }} />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* ─── 3.9 Barra de acciones inferior sticky ─── */}
      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          flexDirection: "row",
          gap: 10,
          backgroundColor: C.bg,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}
      >
        <Pressable
          onPress={() => setAdjustOpen(true)}
          accessibilityLabel="Ajustar stock"
          style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, opacity: appPending ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>Ajustar stock</Text>
        </Pressable>
        <Pressable
          onPress={() => setIncomeOpen(true)}
          accessibilityLabel={primaryActionLabel}
          style={{
            flex: 1.4,
            height: 50,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.accent,
            opacity: appPending ? 0.5 : 1,
            shadowColor: stockState === "out" ? C.accent : "transparent",
            shadowOpacity: stockState === "out" ? 0.5 : 0,
            shadowRadius: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
            {appPending ? "Procesando..." : primaryActionLabel}
          </Text>
        </Pressable>
      </View>

      {/* ─── Toast ─── */}
      {toast ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 60, right: 60, bottom: 84, backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.text, textAlign: "center" }}>{toast}</Text>
        </View>
      ) : null}

      {/* ─── Bottom sheets / modals ─── */}
      <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <AdjustSheet
        visible={adjustOpen}
        stock={product.stock}
        isPending={appPending}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleApplyAdjust}
      />
      <IncomeSheet
        visible={incomeOpen}
        isPending={appPending}
        onClose={() => setIncomeOpen(false)}
        onSubmit={handleRegisterIncome}
      />
    </SafeAreaView>
  );
}

/* ─── Header reutilizable (carga / error) ─── */
function ShellHeader({ showMenu, title }: { showMenu: () => void; title: string }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, minHeight: 44, marginTop: 6 }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityLabel="Volver al listado"
        style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="arrow_back" size={22} color={C.text} />
      </Pressable>
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: "600", color: C.text, textAlign: "center" }}>
        {title || "Detalle de producto"}
      </Text>
      <Pressable
        onPress={showMenu}
        hitSlop={8}
        accessibilityLabel="Más opciones"
        style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="more_vert" size={20} color={C.text} />
      </Pressable>
    </View>
  );
}

/* ─── Skeleton (spec 5: mantiene estructura, sin spinner) ─── */
function SkeletonDetail({ opacity, height }: { opacity: Animated.Value; height: number }) {
  const card = { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border };
  const block = { backgroundColor: C.surface2, borderRadius: 8 };
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14 }}>
      <Animated.View style={[card, { padding: 16, opacity }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[block, { width: 64, height: 64, borderRadius: 16 }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[block, { width: 90, height: 18 }]} />
            <View style={[block, { width: 200, height: 16, marginTop: 8 }]} />
            <View style={[block, { width: 140, height: 12, marginTop: 8 }]} />
          </View>
        </View>
        <View style={[block, { height: 8, marginTop: 18 }]} />
        <View style={[block, { height: 8, marginTop: 12 }]} />
      </Animated.View>
      <Animated.View style={[card, { padding: 16, marginTop: 12, opacity }]}>
        <View style={[block, { height: 14, width: 140 }]} />
        <View style={[block, { height: 20, width: 120, marginTop: 10 }]} />
        <View style={[block, { height: 20, width: 200, marginTop: 10 }]} />
      </Animated.View>
      <Animated.View style={[card, { padding: 16, marginTop: 12, opacity }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: i === 3 ? 0 : 10 }}>
            <View style={[block, { width: 30, height: 30, borderRadius: 8 }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={[block, { height: 12, width: "60%" }]} />
              <View style={[block, { height: 10, width: "35%", marginTop: 6 }]} />
            </View>
          </View>
        ))}
      </Animated.View>
      {height < 700 ? <View style={{ height: 20 }} /> : null}
    </ScrollView>
  );
}

/* ─── Tabs de filtro de movimientos ─── */
function MovementTabs({ active, onChange }: { active: MovFilter; onChange: (f: MovFilter) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginTop: 12 }}
      contentContainerStyle={{ flexDirection: "row", gap: 8, paddingVertical: 2 }}
    >
      {MOV_FILTERS.map((t) => {
        const isActive = t.id === active;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center", backgroundColor: isActive ? C.surface2 : "transparent", borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: isActive ? C.accent : C.border }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? C.text : C.textDim }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ─── Fila de movimiento ─── */
function MovementRow({ movement }: { movement: { type: MovementType; referencia: string | null; fecha: string; usuario: string | null; delta_unidades: number; saldo_resultante: number } }) {
  const meta = MOVEMENT_META[movement.type];
  const delta = movement.delta_unidades;
  const fmt = (v: number) => v.toFixed(v % 1 === 0 ? 0 : 3);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, marginTop: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: meta.bg, alignItems: "center", justifyContent: "center" }}>
        <Icon name={meta.icon} size={17} color={meta.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: C.text, flexShrink: 1 }}>
            {movement.referencia ?? meta.label}
          </Text>
          {meta.tag ? (
            <View style={{ marginLeft: 6, backgroundColor: meta.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: meta.color, textTransform: "uppercase" }}>{meta.tag}</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>
          {timeAgo(movement.fecha)} · {movement.usuario ?? "Sistema"}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"], color: delta > 0 ? C.success : delta < 0 ? C.danger : C.textDim }}>
          {delta > 0 ? `+${fmt(delta)}` : fmt(delta)}
        </Text>
        <Text style={{ fontSize: 10, color: C.textFaint, marginTop: 1 }}>
          Saldo {fmt(movement.saldo_resultante)}
        </Text>
      </View>
    </View>
  );
}

/* ─── Menú kebab ─── */
function MenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const items = [
    { icon: "edit", label: "Editar producto" },
    { icon: "history", label: "Ver historial completo" },
    { icon: "print", label: "Imprimir etiqueta" },
    { icon: "report", label: "Reportar incidencia" },
  ];
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, letterSpacing: 0.2 }}>Más opciones</Text>
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={onClose}
          accessibilityRole="button"
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, minHeight: 44 }}
        >
          <Icon name={item.icon} size={19} color={C.textDim} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginLeft: 12 }}>{item.label}</Text>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

/* ─── Ajustar stock ─── */
function AdjustSheet({
  visible,
  stock,
  isPending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  stock: number;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (vars: { delta: number; motivo: string; ubicacion: string; comentario: string }) => void;
}) {
  const [motivo, setMotivo] = useState("Merma");
  const [ubicacion, setUbicacion] = useState("exhibicion");
  const [delta, setDelta] = useState(-1);
  const [comentario, setComentario] = useState("");

  const requiereComentario = motivo === "Merma" || motivo === "Robo";
  const newStock = stock + delta;
  const invalido = newStock < 0 || delta === 0 || (requiereComentario && comentario.trim() === "");
  const fmtD = (v: number) => v.toFixed(v % 1 === 0 ? 0 : 3);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, letterSpacing: 0.2 }}>Ajustar stock</Text>
      <Text style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>Stock actual: {fmtD(stock)}</Text>

      <Text style={{ fontSize: 11, fontWeight: "600", color: C.textFaint, letterSpacing: 0.2, marginTop: 14 }}>Motivo</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {MOTIVOS.map((m) => {
          const active = motivo === m;
          return (
            <Pressable key={m} onPress={() => setMotivo(m)} style={{ minHeight: 44, justifyContent: "center", backgroundColor: active ? C.accentBg : C.surface2, borderRadius: 18, paddingHorizontal: 12, borderWidth: 1, borderColor: active ? C.accent : C.border }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: active ? C.accent : C.textDim }}>{m}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontSize: 11, fontWeight: "600", color: C.textFaint, letterSpacing: 0.2, marginTop: 14 }}>Cantidad</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
        <StepperBtn label="−5" onPress={() => setDelta((v) => v - 5)} />
        <StepperBtn label="−1" onPress={() => setDelta((v) => v - 1)} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: newStock < 0 ? C.danger : C.text, fontFamily: MONO, fontVariant: ["tabular-nums"] }}>
            {delta > 0 ? `+${fmtD(delta)}` : fmtD(delta)}
          </Text>
          <Text style={{ fontSize: 10, color: newStock < 0 ? C.danger : C.textFaint, marginTop: 2 }}>
            Nuevo stock {fmtD(newStock)}
          </Text>
        </View>
        <StepperBtn label="+1" onPress={() => setDelta((v) => v + 1)} />
        <StepperBtn label="+5" onPress={() => setDelta((v) => v + 5)} />
      </View>

      <Text style={{ fontSize: 11, fontWeight: "600", color: C.textFaint, letterSpacing: 0.2, marginTop: 14 }}>Ubicación afectada</Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
        {UBICACIONES.map((u) => {
          const active = ubicacion === u.id;
          return (
            <Pressable key={u.id} onPress={() => setUbicacion(u.id)} style={{ flex: 1, minHeight: 40, justifyContent: "center", alignItems: "center", backgroundColor: active ? C.accentBg : C.surface2, borderRadius: 10, borderWidth: 1, borderColor: active ? C.accent : C.border }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? C.accent : C.textDim }}>{u.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontSize: 11, fontWeight: "600", color: C.textFaint, letterSpacing: 0.2, marginTop: 14 }}>
        Comentario {requiereComentario ? "*" : "(opcional)"}
      </Text>
      <TextInput
        value={comentario}
        onChangeText={setComentario}
        placeholder={requiereComentario ? "Obligatorio para merma o robo" : "Describe el ajuste"}
        placeholderTextColor={C.textFaint}
        style={{ marginTop: 8, backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 12, color: C.text, fontSize: 13, minHeight: 44 }}
      />

      <Pressable
        onPress={() => onSubmit({ delta, motivo, ubicacion: ubicacion, comentario: comentario.trim() })}
        disabled={invalido || isPending}
        accessibilityRole="button"
        style={{ minHeight: 50, borderRadius: 12, backgroundColor: invalido || isPending ? C.surface2 : C.accent, alignItems: "center", justifyContent: "center", marginTop: 16 }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: invalido || isPending ? C.textFaint : "#FFFFFF" }}>
          {isPending ? "Aplicando..." : "Aplicar ajuste"}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

/* ─── Registrar ingreso ─── */
function IncomeSheet({
  visible,
  isPending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (vars: { cantidad: number; oc: string; lote: string; vencimiento: string }) => void;
}) {
  const [cantidad, setCantidad] = useState("1");
  const [oc, setOc] = useState("");
  const [lote, setLote] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [vencDate, setVencDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const qty = parseFloat(cantidad.replace(",", ".") || "0");
  const invalido = isNaN(qty) || qty <= 0;

  const applyPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setVencDate(d);
    setVencimiento(toISODate(d));
  };

  const clearVenc = () => {
    setVencDate(null);
    setVencimiento("");
    setPickerOpen(false);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} scrollable>
      <Text style={{ fontSize: 12, fontWeight: "700", color: C.text, letterSpacing: 0.2 }}>Registrar ingreso</Text>
      <Text style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>Recepción de mercadería</Text>

      <FieldLabel text="Cantidad" />
      <TextInput
        value={cantidad}
        onChangeText={setCantidad}
        keyboardType="decimal-pad"
        style={inputStyle}
        placeholder="0"
        placeholderTextColor={C.textFaint}
      />

      <FieldLabel text="N° de OC / proveedor (opcional)" />
      <TextInput value={oc} onChangeText={setOc} style={inputStyle} placeholder="OC-2026-000" placeholderTextColor={C.textFaint} />

      <FieldLabel text="Lote nuevo (opcional)" />
      <TextInput value={lote} onChangeText={setLote} style={inputStyle} placeholder="LOTE-2026-X00" placeholderTextColor={C.textFaint} />

      <FieldLabel text="Fecha de vencimiento (opcional)" />
      <Pressable
        onPress={() => setPickerOpen((v) => !v)}
        accessibilityRole="button"
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: pickerOpen ? C.accent : C.border, paddingHorizontal: 12, paddingVertical: 12, minHeight: 44 }}
      >
        <Icon name="event" size={17} color={vencimiento ? C.accent : C.textDim} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontSize: 13, color: vencimiento ? C.text : C.textDim }}>
            {vencimiento ? `Seleccionado · ${vencimiento}` : "Elegir fecha"}
          </Text>
          {vencimiento ? (
            <Text style={{ fontSize: 11, color: C.textFaint, marginTop: 1 }}>Toca para abrir el selector nativo</Text>
          ) : null}
        </View>
        <Icon name={pickerOpen ? "expand_less" : "expand_more"} size={18} color={C.textDim} />
      </Pressable>

      {pickerOpen ? (
        <View
          style={{
            marginTop: 8,
            backgroundColor: C.surface2,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
            padding: Platform.OS === "ios" ? 8 : 0,
          }}
        >
          <DateTimePicker
            value={vencDate ?? new Date()}
            mode="date"
            themeVariant="dark"
            display={Platform.OS === "ios" ? "inline" : "spinner"}
            onChange={(event, date) => {
              if (event.type === "dismissed") {
                setPickerOpen(false);
                return;
              }
              if (date) {
                setVencDate(date);
                setVencimiento(toISODate(date));
              }
            }}
          />
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
        {[7, 15, 30, 60, 90].map((d) => {
          const active = vencimiento !== "" && vencimiento === presetISO(d);
          return (
            <Pressable
              key={d}
              onPress={() => applyPreset(d)}
              style={{
                backgroundColor: active ? C.accentBg : C.surface2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? C.accent : C.text }}>+{d} días</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={clearVenc}
          style={{
            backgroundColor: vencimiento === "" ? C.accentBg : C.surface2,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: vencimiento === "" ? C.accent : C.textDim }}>Sin fecha</Text>
        </Pressable>
      </ScrollView>

      <Text style={{ fontSize: 11, color: vencimiento ? C.accent : C.textFaint, fontFamily: MONO, marginTop: 10 }}>
        {vencimiento ? `Vence: ${vencimiento}` : "Sin fecha de vencimiento"}
      </Text>

      <Pressable
        onPress={() => onSubmit({ cantidad: qty, oc: oc.trim(), lote: lote.trim(), vencimiento: vencimiento.trim() })}
        disabled={invalido || isPending}
        accessibilityRole="button"
        style={{ minHeight: 50, borderRadius: 12, backgroundColor: invalido || isPending ? C.surface2 : C.accent, alignItems: "center", justifyContent: "center", marginTop: 16 }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: invalido || isPending ? C.textFaint : "#FFFFFF" }}>
          {isPending ? "Registrando..." : `Registrar +${qty} unidades`}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function presetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={{ fontSize: 11, fontWeight: "600", color: C.textFaint, letterSpacing: 0.2, marginTop: 14, marginBottom: 8 }}>{text}</Text>;
}

const inputStyle = {
  backgroundColor: C.surface2,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: C.border,
  paddingHorizontal: 12,
  paddingVertical: 12,
  color: C.text,
  fontSize: 13,
  minHeight: 44,
};

function StepperBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>{label}</Text>
    </Pressable>
  );
}

function BottomSheet({ visible, onClose, children, scrollable = false }: { visible: boolean; onClose: () => void; children: ReactNode; scrollable?: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, borderColor: C.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28, maxHeight: "88%" }}>
          <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: C.surface2, marginBottom: 12 }} />
          {scrollable ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </View>
    </Modal>
  );
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}