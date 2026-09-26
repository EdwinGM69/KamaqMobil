import { useRouter } from "expo-router";
import { CashOpenScreen } from "@/features/cash/components/CashOpenScreen";

export default function CashOpenScreenRoute() {
  const router = useRouter();

  return (
    <CashOpenScreen onOpened={() => router.replace("/(tabs)/cash")} />
  );
}