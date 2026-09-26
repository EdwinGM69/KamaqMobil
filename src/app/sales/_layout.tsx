import { Stack } from "expo-router";

export default function SalesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="cart" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="receipt" />
    </Stack>
  );
}
