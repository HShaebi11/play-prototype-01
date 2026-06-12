import {
  DEFAULT_VARIABLES,
  useVariableStore as useVariableStoreBase,
  type Variable,
  type VariableStore,
} from "@/lib/variables";

export type { Variable, VariableStore };

export function useVariableStore<T>(selector: (state: VariableStore) => T): T {
  return useVariableStoreBase(selector);
}

export { DEFAULT_VARIABLES, useVariableStoreBase as useVariableStoreApi };
