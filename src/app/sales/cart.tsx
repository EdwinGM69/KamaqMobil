import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "@/features/sales/hooks/useCart";
import { QuantitySheet } from "@/features/sales/components/QuantitySheet";
import { formatCurrency } from "@/shared/utils/currency";
import { isVariableUnit, getUnitSymbol } from "@/shared/utils/units";
import { Icon } from "@/shared/components/ui/Icon";
import { ProductThumb } from "@/shared/components/ui/ProductThumb";
import type { Product } from "@/infrastructure/database/repositories/products.repo";

const C = {
  bg: "#0B0E14",
  card: "#161B22",
  field: "#1C212B",
  border: "#21262D",
  text: "#FFFFFF",
  textDim: "#8B949E",
  textFaint: "#6E7681",
  blue: "#3A86FF",
  green: "#00E676",
  danger: "#FF5252",
};

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    subtotal,
    igv,
    total,
    itemCount,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    updateQuantity,
  } = useCart();

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);

  const openEdit = (item: (typeof items)[number]) => {
    setEditProduct({
      id: item.productId,
      barcode: item.barcode,
      name: item.name,
      category: item.category ?? "general",
      price: item.price,
      cost_price: item.costPrice,
      stock: Number.MAX_SAFE_INTEGER,
      min_stock: 0,
      image_url: null,
      unit: item.unit,
      decimals: item.decimals,
      min_quantity: item.minQuantity,
      step: item.step,
      frequent_quantities: item.frequentQuantities,
      expiration_date: null,
      created_at: "",
      updated_at: "",
    });
    setEditQuantity(item.quantity);
  };

  const handleApplyEdit = (product: Product, quantity: number) => {
    updateQuantity(product.id, quantity);
    setEditProduct(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      {/* ─── Header ─── */}
      <View style={{ height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="arrow_back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>Carrito</Text>
        </View>
        <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: C.textDim }}>{itemCount} ítems</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: C.card, alignItems: "center", justifyContent: "center" }}>
            <Icon name="shopping_cart" size={34} color={C.textFaint} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginTop: 16 }}>Tu carrito está vacío</Text>
          <Text style={{ fontSize: 13, color: C.textDim, textAlign: "center", marginTop: 6 }}>
            Agrega productos desde el catálogo para comenzar una venta
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ backgroundColor: C.blue, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, marginTop: 22 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", textTransform: "uppercase" }}>
              Buscar productos
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => {
              const variable = isVariableUnit(item.unit);
              const unitSymbol = getUnitSymbol(item.unit);
              const qtyText = item.quantity.toFixed(
                item.quantity % 1 === 0 ? 0 : Math.min(Math.max(item.decimals, 0), 3)
              );
              return (
                <View
                  key={item.productId}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <ProductThumb category={item.category} size={46} />
                    <View style={{ flex: 1, marginLeft: 10, alignSelf: "center" }}>
                      <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>
                        {formatCurrency(item.price)}
                        {variable ? ` / ${unitSymbol}` : " c/u"}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeItem(item.productId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 10, padding: 2 }}>
                      <Icon name="delete_outline" size={18} color={C.danger} />
                    </Pressable>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.field, borderRadius: 10, padding: 3 }}>
                      <Pressable
                        onPress={() => decrementQuantity(item.productId)}
                        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, alignItems: "center", justifyContent: "center" }}
                      >
                        <Icon name="remove" size={15} color={C.text} />
                      </Pressable>
                      <Pressable onPress={() => openEdit(item)}>
                        <View style={{ alignItems: "center", minWidth: 56, marginHorizontal: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, textAlign: "center" }}>
                            {qtyText}
                          </Text>
                          <Text style={{ fontSize: 9, fontWeight: "600", color: C.textFaint, marginTop: 1 }}>
                            {unitSymbol}
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() => incrementQuantity(item.productId)}
                        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }}
                      >
                        <Icon name="add" size={15} color="#FFFFFF" />
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                  {variable ? (
                    <Text style={{ fontSize: 10, color: C.textFaint, marginTop: 6 }}>
                      {qtyText} {unitSymbol} × {formatCurrency(item.price)} · toca la cantidad para editar
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          {/* ─── Totals + CTA ─── */}
          <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: C.bg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
              <Text style={{ fontSize: 13, color: C.textDim }}>Subtotal</Text>
              <Text style={{ fontSize: 13, color: C.text }}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
              <Text style={{ fontSize: 13, color: C.textDim }}>IGV (18%)</Text>
              <Text style={{ fontSize: 13, color: C.text }}>{formatCurrency(igv)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textDim }}>Total a pagar</Text>
              <Text style={{ fontSize: 26, fontWeight: "700", color: C.text }}>{formatCurrency(total)}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/sales/payment")}
              style={{
                backgroundColor: C.blue,
                borderRadius: 12,
                height: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <Icon name="point_of_sale" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF", textTransform: "uppercase" }}>Cobrar venta</Text>
              <Icon name="arrow_forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </>
      )}

      <QuantitySheet
        visible={!!editProduct}
        product={editProduct}
        mode="edit"
        initialQuantity={editQuantity}
        onClose={() => setEditProduct(null)}
        onAdd={handleApplyEdit}
      />
    </SafeAreaView>
  );
}