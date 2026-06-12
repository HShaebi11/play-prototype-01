import {
  useLayerStore as useLayerStoreBase,
  type Layer,
  type LayerStore,
  type LayerType,
  type MediaLayerConfig,
  type P5LayerConfig,
  type ThreeJSLayerConfig,
} from "@/lib/layers";

export type {
  Layer,
  LayerStore,
  LayerType,
  MediaLayerConfig,
  P5LayerConfig,
  ThreeJSLayerConfig,
};

export function useLayerStore<T>(selector: (state: LayerStore) => T): T {
  return useLayerStoreBase(selector);
}

export { useLayerStoreBase as useLayerStoreApi };
