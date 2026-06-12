import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export function createClientStorage() {
  return createJSONStorage(() =>
    typeof window === "undefined" ? noopStorage : localStorage,
  );
}
