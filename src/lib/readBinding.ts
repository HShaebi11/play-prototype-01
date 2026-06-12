import { useVariableStoreApi } from "@/hooks/useVariableStore";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function readBinding(
  variableId: string | undefined,
  fallback = 0.5,
): number {
  if (!variableId) {
    return fallback;
  }
  return useVariableStoreApi.getState().get(variableId);
}

export function readScaledBinding(
  variableId: string | undefined,
  fallback: string,
  scale = 1,
): number {
  const value = readBinding(variableId ?? fallback);
  return clamp01(value * scale);
}
