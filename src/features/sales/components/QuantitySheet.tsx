import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  Keyboard,
} from "react-native";
import type { Product } from "@/infrastructure/database/repositories/products.repo";
import { ProductThumb } from "@/shared/components/ui/ProductThumb";
import { Icon } from "@/shared/components/ui/Icon";
import { formatCurrency } from "@/shared/utils/currency";
import {
  getUnitLabel,
  getUnitSymbol,
  isVariableUnit,
  parseFrequentQuantities,
} from "@/shared/utils/units";

const D = {
  bg: "#1A1D23",
  card: "#262A32",
  field: "#14161B",
  border: "#3C434E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A9B4C0",
  blue: "#3D6AFE",
  green: "#2ECC71",
  red: "#E74C3C",
};

interface QuantitySheetProps {
  visible: boolean;
  product: Product | null;
  mode: "add" | "edit";
  initialQuantity?: number;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
}

function validDecimal(value: string): boolean {
  if (value === "") return true;
  return /^\d*\.?\d*$/.test(value);
}

export function QuantitySheet({
  visible,
  product,
  mode,
  initialQuantity = 0,
  onClose,
  onAdd,
}: QuantitySheetProps) {
  const decimals = product?.decimals ?? 0;
  const unit = product?.unit ?? "und";
  const isVariable = isVariableUnit(unit);
  const step = product && product.step > 0 ? product.step : isVariable ? 0.05 : 1;
  const minQty = product?.min_quantity ?? (isVariable ? 0.05 : 1);
  const frequent = useMemo(
    () => parseFrequentQuantities(product?.frequent_quantities),
    [product?.frequent_quantities]
  );

  const [text, setText] = useState("");

  const [lastOpen, setLastOpen] = useState({
    visible,
    productId: product?.id,
    initialQuantity,
  });

  if (
    lastOpen.visible !== visible ||
    lastOpen.productId !== product?.id ||
    lastOpen.initialQuantity !== initialQuantity
  ) {
    const start = initialQuantity > 0 ? initialQuantity : 0;
    setLastOpen({ visible, productId: product?.id, initialQuantity });
    setText(start > 0 ? start.toFixed(Math.min(decimals, 3)) : "");
  }

  const quantity = (() => {
    const n = parseFloat(text);
    if (isNaN(n) || n < 0) return 0;
    return Math.round(n * 1000) / 1000;
  })();

  const exceedStock = product ? quantity > product.stock : false;
  const belowMin = product ? minQty > 0 && quantity > 0 && quantity < minQty : false;
  const invalidQty = quantity <= 0 || exceedStock || belowMin;
  const total = quantity * (product?.price ?? 0);

  const setQuantity = (value: number) => {
    const clamped = Math.max(0, Math.round(value * 1000) / 1000);
    setText(clamped > 0 ? clamped.toFixed(Math.min(decimals, 3)) : "");
  };

  const handleTextChange = (value: string) => {
    if (!validDecimal(value) || value.split(".")[1]?.length > 3) {
      return;
    }
    setText(value);
  };

  const handleSubmit = () => {
    if (!product) return;
    Keyboard.dismiss();
    onAdd(product, quantity);
  };

  const showTotal = quantity > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar" />

        <View
          style={{
            backgroundColor: D.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: D.border,
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 30,
          }}
        >
          <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: D.border, marginBottom: 12 }} />

          <Text style={{ fontSize: 12, fontWeight: "700", color: D.textSecondary, letterSpacing: 1.2, textAlign: "center" }}>
            {mode === "edit" ? "EDITAR CANTIDAD" : "AGREGAR"}
          </Text>

          {product ? (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: D.bg, borderRadius: 12, padding: 12, marginTop: 12 }}>
              <ProductThumb category={product.category} size={42} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: D.textPrimary }}>
                  {product.name}
                </Text>
                <Text style={{ fontSize: 12, color: D.textSecondary, marginTop: 2 }}>
                  {formatCurrency(product.price)}
                  {isVariable ? ` / ${getUnitSymbol(unit)}` : ""}
                </Text>
              </View>
              {mode === "edit" && initialQuantity > 0 ? (
                <Text style={{ fontSize: 11, color: D.textSecondary }}>
                  Actual: {formatQtyText(initialQuantity, decimals)} {getUnitSymbol(unit)}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={{ fontSize: 10, fontWeight: "700", color: D.textSecondary, letterSpacing: 0.6, marginTop: 16, textAlign: "center" }}>
            CANTIDAD
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
            <Pressable
              onPress={() => setQuantity(quantity - step)}
              disabled={quantity <= 0}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: D.field,
                borderWidth: 1,
                borderColor: D.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: quantity <= 0 ? 0.4 : 1,
              }}
            >
              <Icon name="remove" size={20} weight={700} color={D.textPrimary} />
            </Pressable>

            <TextInput
              value={text}
              onChangeText={handleTextChange}
              onBlur={() => setQuantity(quantity)}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={D.textSecondary}
              selectTextOnFocus
              style={{
                minWidth: 110,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: D.field,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: exceedStock ? D.red : D.border,
                marginHorizontal: 10,
                fontSize: 26,
                fontWeight: "700",
                color: D.textPrimary,
                textAlign: "center",
              }}
            />

            <Pressable
              onPress={() => setQuantity(quantity + step)}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: isVariable ? D.blue : D.green,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="add" size={20} weight={700} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={{ fontSize: 12, fontWeight: "600", color: D.textSecondary, textAlign: "center", marginTop: 6 }}>
            {getUnitLabel(unit)}
          </Text>

          {frequent.length > 0 ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              {frequent.map((q) => {
                const active = Math.abs(quantity - q) < 0.0005;
                return (
                  <Pressable
                    key={q}
                    onPress={() => setQuantity(q)}
                    style={{
                      flex: 1,
                      backgroundColor: active ? D.blue : D.field,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: active ? D.blue : D.border,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: active ? "#FFFFFF" : D.textPrimary }}>
                      {q.toFixed(Math.min(decimals, 3))}
                    </Text>
                    <Text style={{ fontSize: 9, fontWeight: "600", color: active ? "rgba(255,255,255,0.8)" : D.textSecondary, marginTop: 1 }}>
                      {getUnitSymbol(unit)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View
            style={{
              backgroundColor: D.bg,
              borderRadius: 12,
              padding: 14,
              marginTop: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: D.border,
            }}
          >
            {showTotal ? (
              <>
                <Text style={{ fontSize: 11, color: D.textSecondary }}>
                  {text || "0"} {getUnitSymbol(unit)} × {formatCurrency(product?.price ?? 0)}
                </Text>
                <Text style={{ fontSize: 10, color: D.textSecondary, marginTop: 2 }}>═</Text>
                <Text style={{ fontSize: 26, fontWeight: "700", color: showTotal && !invalidQty ? D.green : D.red, marginTop: 6 }}>
                  {formatCurrency(total)}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 12, color: D.textSecondary }}>
                Ingresa una cantidad para ver el importe
              </Text>
            )}
          </View>

          {exceedStock && product ? (
            <Text style={{ fontSize: 12, color: D.red, textAlign: "center", marginTop: 8 }}>
              Supera el stock disponible: {product.stock.toFixed(Math.min(decimals, 3))} {getUnitSymbol(unit)}
            </Text>
          ) : null}
          {belowMin && product ? (
            <Text style={{ fontSize: 12, color: D.red, textAlign: "center", marginTop: 8 }}>
              Mínimo: {minQty.toFixed(Math.min(decimals, 3))} {getUnitSymbol(unit)}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={invalidQty || !product}
            style={{
              backgroundColor: invalidQty || !product ? D.field : D.blue,
              borderRadius: 14,
              height: 54,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 16,
              gap: 8,
            }}
          >
            <Icon name="shopping_cart" size={18} color={invalidQty || !product ? D.textSecondary : "#FFFFFF"} />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: invalidQty || !product ? D.textSecondary : "#FFFFFF",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {mode === "edit" ? "Actualizar cantidad" : "Agregar al carrito"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function formatQtyText(value: number, decimals: number): string {
  const d = Math.min(Math.max(decimals, 0), 3);
  return value.toFixed(value % 1 === 0 ? 0 : d);
}