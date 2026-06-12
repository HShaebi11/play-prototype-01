import { useVariableStoreApi } from "@/hooks/useVariableStore";

export function readBinding(
  variableId: string | undefined,
  fallback = 0.5,
): number {
  if (!variableId) {
    return fallback;
  }
  return useVariableStoreApi.getState().get(variableId);
}
