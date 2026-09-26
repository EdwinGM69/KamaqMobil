import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

type StorageLike = {
  set: (name: string, value: string) => void;
  getString: (name: string) => string | undefined;
  delete: (name: string) => void;
};

function tryCreateMMKV(): StorageLike | null {
  try {
    return new MMKV();
  } catch {
    return null;
  }
}

const memoryFallback = new Map<string, string>();

export const mmkv: StorageLike =
  tryCreateMMKV() ?? {
    set: (name, value) => memoryFallback.set(name, value),
    getString: (name) => memoryFallback.get(name),
    delete: (name) => memoryFallback.delete(name),
  };

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  getItem: (name) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};