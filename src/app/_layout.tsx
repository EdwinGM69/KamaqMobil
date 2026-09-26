import { Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { SQLiteProvider } from "expo-sqlite";
import { useFonts } from "@expo-google-fonts/material-symbols";
import {
  MaterialSymbols_400Regular,
  MaterialSymbols_600SemiBold,
  MaterialSymbols_700Bold,
} from "@expo-google-fonts/material-symbols";

import { queryClient } from "@/infrastructure/api/queryClient";
import { setupOnlineManager } from "@/infrastructure/api/onlineManager";
import { useFocusManager } from "@/infrastructure/api/focusManager";
import { useAuthStore } from "@/stores/useAuthStore";
import { DATABASE_NAME } from "@/infrastructure/database/schema";
import { migrateDbIfNeeded } from "@/infrastructure/database/migrations";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MaterialSymbols_400Regular,
    MaterialSymbols_600SemiBold,
    MaterialSymbols_700Bold,
  });

  useEffect(() => {
    setupOnlineManager();
  }, []);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-kamaq-background">
        <ActivityIndicator size="large" color="#0F4C81" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        useSuspense
      >
        <Suspense
          fallback={
            <View className="flex-1 items-center justify-center bg-kamaq-background">
              <ActivityIndicator size="large" color="#0F4C81" />
            </View>
          }
        >
          <RootNavigator />
        </Suspense>
      </SQLiteProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  useFocusManager();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="scanner" />
        <Stack.Screen name="sales" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="customer" />
        <Stack.Screen name="cash" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
