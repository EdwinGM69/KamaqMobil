import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      setIsOffline(state.isConnected === false);
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
      setIsOffline(state.isConnected === false);
    });

    return () => unsubscribe();
  }, []);

  return { isOffline, isConnected };
}
