import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useProducts } from "@/features/sales/hooks/useProducts";
import { useCart } from "@/features/sales/hooks/useCart";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCashStore } from "@/stores/useCashStore";
import type { Product } from "@/infrastructure/database/repositories/products.repo";
import { productsRepo } from "@/infrastructure/database/repositories/products.repo";
import { salesRepo } from "@/infrastructure/database/repositories/sales.repo";
import {
  getStatus,
  STATUS_META,
} from "@/features/inventory/components/LocationBreakdown";
import {
  categoryEmoji,
} from "@/shared/utils/categories";
import { formatCurrency } from "@/shared/utils/currency";
import { isVariableUnit, getUnitSymbol } from "@/shared/utils/units";
import { Icon } from "@/shared/components/ui/Icon";
import { PosHeader } from "@/shared/components/ui/PosHeader";
import { CartButton } from "@/features/sales/components/CartButton";
import { ProductThumb } from "@/shared/components/ui/ProductThumb";
import { CashOpenScreen } from "@/features/cash/components/CashOpenScreen";
import { QuantitySheet } from "@/features/sales/components/QuantitySheet";

const D = {
  bg: "#1A1D23",
  card: "#262A32",
  field: "#1A1D23",
  border: "#3C434E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A9B4C0",
  blue: "#3D6AFE",
  green: "#2ECC71",
  orange: "#F39C12",
  red: "#E74C3C",
};

export function SalesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [scannerActive, setScannerActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [topProductIds, setTopProductIds] = useState<number[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [footerY] = useState(() => new Animated.Value(0));
  const [permission, requestPermission] = useCameraPermissions();
  const [qtySheetVisible, setQtySheetVisible] = useState(false);
  const [qtySheetProduct, setQtySheetProduct] = useState<Product | null>(null);
  const [qtySheetMode, setQtySheetMode] = useState<"add" | "edit">("add");
  const [qtySheetInitial, setQtySheetInitial] = useState(0);

  useEffect(() => {
    const apply = (height: number) => {
      setKeyboardHeight(height);
      Animated.timing(footerY, {
        toValue: height,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };
    const willShow = Keyboard.addListener("keyboardWillShow", (e) => apply(e.endCoordinates.height));
    const didShow = Keyboard.addListener("keyboardDidShow", (e) => apply(e.endCoordinates.height));
    const didHide = Keyboard.addListener("keyboardDidHide", () => apply(0));
    return () => {
      willShow.remove();
      didShow.remove();
      didHide.remove();
    };
  }, [footerY]);

  useEffect(() => {
    let active = true;
    salesRepo
      .getTopProductIds(db, 12)
      .then((ids) => {
        if (active) setTopProductIds(ids);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [db]);

  const { products, isLoading, refetch } = useProducts(search.trim() || undefined);
  const { items, itemCount, total, addItem } = useCart();
  const userName = useAuthStore((state) => state.user?.name ?? "");
  const cashOpen = useCashStore((state) => state.isOpen);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Todos") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const topProducts = useMemo(() => {
    const ranked = topProductIds
      .map((id) => productById.get(id))
      .filter((p): p is Product => !!p);
    const inTop = new Set(ranked.map((p) => p.id));
    const rest = products.filter((p) => !inTop.has(p.id));
    return [...ranked, ...rest].slice(0, 12);
  }, [topProductIds, productById, products]);

  const topCount = useMemo(
    () => topProductIds.filter((id) => productById.has(id)).length,
    [topProductIds, productById]
  );

  const catalogItems = search.trim() ? filteredProducts : topProducts;
  const sectionTitle = search.trim()
    ? "Resultados de búsqueda"
    : topCount > 0
      ? `Alta rotación · Top ${Math.min(12, topCount)} vendidos`
      : "Productos · 1-toque";

  const openQtySheet = (product: Product, mode: "add" | "edit" = "add", initialQty = 0) => {
    setQtySheetProduct(product);
    setQtySheetMode(mode);
    setQtySheetInitial(initialQty);
    setQtySheetVisible(true);
  };

  const addProductToCart = (product: Product, quantity: number) => {
    addItem({
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      price: product.price,
      costPrice: product.cost_price,
      quantity,
      unit: product.unit,
      decimals: product.decimals,
      frequentQuantities: product.frequent_quantities,
      step: product.step,
      minQuantity: product.min_quantity,
    });
    setQtySheetVisible(false);
    setScannerActive(false);
  };

  const handleAdd = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert("Sin stock", `${product.name} no tiene stock disponible.`);
      return;
    }
    if (isVariableUnit(product.unit)) {
      openQtySheet(product, "add");
    } else {
      addProductToCart(product, 1);
    }
  };

  const handleBarcode = async (barcode: string) => {
    if (isScanning) return;
    setIsScanning(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    try {
      const product = await productsRepo.getByBarcode(db, barcode);
      if (!product) {
        setScannerActive(false);
        Alert.alert("Producto no encontrado", `No existe un producto con el código ${barcode}.`);
        return;
      }
      if (product.stock <= 0) {
        setScannerActive(false);
        Alert.alert("Sin stock", `${product.name} no tiene stock disponible.`);
        return;
      }
      if (isVariableUnit(product.unit)) {
        setIsScanning(false);
        setScannerActive(false);
        openQtySheet(product, "add");
      } else {
        addProductToCart(product, 1);
        setTimeout(() => {
          Alert.alert("Producto agregado", `${product.name} se agregó al carrito.`);
        }, 300);
      }
    } catch {
      setScannerActive(false);
    } finally {
      setIsScanning(false);
    }
  };

  if (!cashOpen) {
    return <CashOpenScreen />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 140 : 200 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={D.textSecondary} />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          {/* ─── Header row: badge/title + centered cart + avatar ─── */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <PosHeader showAvatar={false}>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Venta</Text>
                  <Text style={{ fontSize: 10, color: D.textSecondary }}> - Caja B2</Text>
                </View>
              </PosHeader>
            </View>
            <CartButton />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Pressable onPress={() => router.push("/settings")} style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: D.blue,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="person" size={22} weight={600} color="#FFFFFF" />
                </View>
                {userName ? (
                  <Text numberOfLines={1} style={{ fontSize: 10, color: D.textSecondary, marginTop: 3, maxWidth: 96, textAlign: "right" }}>
                    {userName}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          </View>

          {/* ─── Scanner module ─── */}
          <View style={{ marginTop: 12, backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border, overflow: "hidden" }}>
            <Pressable
              onPress={() => {
                if (!permission?.granted) { requestPermission(); return; }
                setScannerActive((v) => !v);
              }}
              style={{ flexDirection: "row", alignItems: "center", padding: 14 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(61,106,254,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Icon name="qr_code_scanner" size={24} color={D.blue} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Escanear producto</Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: D.textSecondary, marginTop: 2 }}>
                  {scannerActive ? "Visor activo · escanea un código" : "Toca para activar la cámara"}
                </Text>
              </View>
              <View style={{ backgroundColor: D.field, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: scannerActive ? D.green : D.textSecondary }}>{scannerActive ? "ON" : "AUTO"}</Text>
              </View>
            </Pressable>

            {scannerActive && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                {!permission?.granted ? (
                  <View style={{ backgroundColor: D.field, borderRadius: 12, padding: 20, alignItems: "center" }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF", textAlign: "center" }}>
                      Permiso de cámara requerido
                    </Text>
                    <Pressable onPress={requestPermission} style={{ backgroundColor: D.blue, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>Permitir cámara</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={{ borderRadius: 12, overflow: "hidden", height: 200, backgroundColor: "#000" }}>
                      <CameraView
                        style={{ flex: 1 }}
                        facing="back"
                        onBarcodeScanned={(result: BarcodeScanningResult) => handleBarcode(result.data)}
                        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128", "code39", "upc_a"] }}
                      />
                    </View>
                    <Pressable
                      onPress={() => setScannerActive(false)}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, paddingVertical: 8 }}
                    >
                      <Icon name="visibility_off" size={15} color={D.textSecondary} />
                      <Text style={{ fontSize: 12, fontWeight: "600", color: D.textSecondary, marginLeft: 6 }}>Ocultar visor</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>

          {/* ─── Category filter ─── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ gap: 8 }}>
            {categories.map((cat) => {
              const active = cat === selectedCategory;
              const label = cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: active ? D.blue : D.card,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {cat !== "Todos" && <Text style={{ fontSize: 12 }}>{categoryEmoji(cat)}</Text>}
                  <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#FFFFFF" : D.textSecondary }}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ─── Catalog search bar ─── */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: D.card, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: D.border, marginTop: 10 }}>
            <Icon name="search" size={18} color={D.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre, SKU o código..."
              placeholderTextColor={D.textSecondary}
              style={{ flex: 1, marginLeft: 10, fontSize: 13, color: "#FFFFFF" }}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")}>
                <Icon name="close" size={18} color={D.textSecondary} />
              </Pressable>
            ) : (
              <Icon name="mic" size={18} color={D.textSecondary} />
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: D.textSecondary, letterSpacing: 0.8 }}>{sectionTitle}</Text>
              <Text style={{ fontSize: 11, color: D.green, marginTop: 2 }}>Toca para agregar al carrito</Text>
            </View>
            {search.trim() ? (
              <Text style={{ fontSize: 11, color: D.textSecondary }}>{catalogItems.length} resultados</Text>
            ) : null}
          </View>

          {/* ─── Product grid ─── */}
          {isLoading && catalogItems.length === 0 ? (
            <ActivityIndicator size="large" color={D.blue} style={{ marginTop: 40 }} />
          ) : catalogItems.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Icon name="search_off" size={44} color={D.border} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: D.textSecondary, marginTop: 10 }}>
                {search.trim() ? "Sin resultados de búsqueda" : "Sin productos disponibles"}
              </Text>
              <Text style={{ fontSize: 12, color: D.textSecondary, opacity: 0.7, marginTop: 6, textAlign: "center" }}>
                {search.trim()
                  ? "Prueba con otro nombre o código de barras."
                  : "Registra productos en el inventario para empezar a vender."}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {catalogItems.map((product) => {
                const status = STATUS_META[getStatus(product)];
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => handleAdd(product)}
                    style={{
                      width: "47.5%",
                      backgroundColor: D.card,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <ProductThumb category={product.category} size={44} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
                          {product.name}
                        </Text>
                        {isVariableUnit(product.unit) ? (
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 }}>
                            <Icon name="scale" size={11} color={D.orange} />
                            <Text style={{ fontSize: 10, fontWeight: "600", color: D.orange }}>
                              Venta por {getUnitSymbol(product.unit)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={{
                        alignSelf: "flex-start",
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                        backgroundColor: status.bg,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color, marginRight: 5 }} />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: status.color }}>
                        {status.label.toUpperCase()} · {product.stock.toFixed(product.decimals > 0 ? Math.min(product.decimals, 3) : 0)} {getUnitSymbol(product.unit)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                        {formatCurrency(product.price)}
                        {isVariableUnit(product.unit) ? (
                          <Text style={{ fontSize: 11, fontWeight: "500", color: D.textSecondary }}>
                            {" "}/ {getUnitSymbol(product.unit)}
                          </Text>
                        ) : null}
                      </Text>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="add" size={18} weight={700} color={D.bg} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Fixed bottom summary ─── */}
      {itemCount > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: footerY,
            backgroundColor: D.card,
            borderTopWidth: 1,
            borderTopColor: D.border,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: D.textSecondary, letterSpacing: 0.5 }}>RESUMEN</Text>
              <Text style={{ fontSize: 13, color: D.textSecondary, marginTop: 2 }}>{items.length} productos · {itemCount} ítems</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: D.textSecondary }}>TOTAL</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#FFFFFF" }}>{formatCurrency(total)}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/sales/payment")}
            style={{ backgroundColor: D.blue, borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 }}
          >
            <Icon name="point_of_sale" size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF", textTransform: "uppercase" }}>Cobrar venta</Text>
            <Icon name="arrow_forward" size={18} weight={600} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}

      <QuantitySheet
        visible={qtySheetVisible}
        product={qtySheetProduct}
        mode={qtySheetMode}
        initialQuantity={qtySheetInitial}
        onClose={() => setQtySheetVisible(false)}
        onAdd={addProductToCart}
      />
    </SafeAreaView>
  );
}