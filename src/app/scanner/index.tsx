import { StatusBar } from "expo-status-bar";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useProductByBarcode } from "@/features/sales/hooks/useProducts";
import { useCart } from "@/features/sales/hooks/useCart";
import { useBarcodeHandler } from "@/features/barcode/hooks/useBarcode";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const { handleBarcode } = useBarcodeHandler();

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <View className="items-center justify-center flex-1">
          <Text className="text-white text-xl font-bold text-center mb-4">
            Permiso de cámara requerido
          </Text>
          <Text className="text-white/70 text-center mb-8">
            Necesitamos acceso a la cámara para escanear códigos de barras.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-kamaq-primary px-8 py-4 rounded-2xl"
          >
            <Text className="text-white font-bold text-lg">Permitir Cámara</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isScanning) return;
    setIsScanning(true);
    handleBarcode(result.data);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "code128", "code39", "upc_a"],
        }}
      />

      <View className="absolute top-0 left-0 right-0 p-4 pt-14 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 bg-black/50 rounded-full items-center justify-center"
        >
          <Text className="text-white text-2xl">✕</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold ml-4 flex-1">
          Escanear Código
        </Text>
      </View>

      <View
        style={{
          position: "absolute",
          top: "30%",
          alignSelf: "center",
          width: 260,
          height: 260,
          borderRadius: 20,
          borderWidth: 3,
          borderColor: "#fff",
          backgroundColor: "transparent",
        }}
      >
        <View className="absolute -top-8 left-0 right-0 items-center">
          <Text className="text-white/80 text-xs font-mono tracking-widest">
            EAN-13 / CODE-128
          </Text>
        </View>
      </View>

      <View className="absolute bottom-10 left-0 right-0 items-center">
        <Text className="text-white/80 text-sm mb-4">
          Apunte la cámara al código de barras
        </Text>
      </View>
    </View>
  );
}
