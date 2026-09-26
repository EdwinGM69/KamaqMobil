import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/infrastructure/storage/mmkv";

interface SyncState {
  pendingOperations: PendingOperation[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  addOperation: (op: PendingOperation) => void;
  removeOperation: (id: string) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (at: string) => void;
  clearOperations: () => void;
}

export interface PendingOperation {
  id: string;
  type: "create_sale" | "update_stock" | "register_payment" | "create_customer";
  data: Record<string, unknown>;
  createdAt: string;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingOperations: [],
      isSyncing: false,
      lastSyncAt: null,
      addOperation: (op) =>
        set((state) => ({
          pendingOperations: [...state.pendingOperations, op],
        })),
      removeOperation: (id) =>
        set((state) => ({
          pendingOperations: state.pendingOperations.filter(
            (op) => op.id !== id
          ),
        })),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncAt: (at) => set({ lastSyncAt: at }),
      clearOperations: () => set({ pendingOperations: [] }),
    }),
    {
      name: "kamaq-sync",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
