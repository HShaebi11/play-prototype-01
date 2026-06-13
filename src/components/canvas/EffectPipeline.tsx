"use client";

import { useFrame, useThree } from "@react-three/fiber/legacy";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { compositeLayersToCanvas } from "@/lib/compositeLayers";
import {
  buildMixPass,
  EFFECT_VERTEX_SHADER,
  getPassesForPreset,
  type EffectPass,
} from "@/lib/effectShaders";
import type { EffectsLayerConfig, EffectPreset } from "@/lib/layers";
import { getPresetUniformParams } from "@/lib/effectPresetParams";
import { readScaledBinding } from "@/lib/readBinding";

type EffectPipelineProps = {
  sourceRef: RefObject<HTMLElement | null>;
  config: EffectsLayerConfig;
  opacity: number;
};

function validateFragmentShader(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): boolean {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vs || !fs) {
    return false;
  }

  gl.shaderSource(vs, vertexSource);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return false;
  }

  gl.shaderSource(fs, fragmentSource);
  gl.compileShader(fs);
  const ok = Boolean(gl.getShaderParameter(fs, gl.COMPILE_STATUS));
  if (!ok) {
    console.warn(
      "[EffectsLayer] Shader compile error:",
      gl.getShaderInfoLog(fs),
    );
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return ok;
}

function resolveEffectPasses(
  gl: THREE.WebGLRenderer,
  preset: EffectPreset,
  shaderSource: string | undefined,
  cacheKey: string,
  cache: { key: string; passes: EffectPass[]; effectivePreset: EffectPreset },
): { passes: EffectPass[]; effectivePreset: EffectPreset } {
  if (cache.key === cacheKey) {
    return { passes: cache.passes, effectivePreset: cache.effectivePreset };
  }

  let passes: EffectPass[];
  let effectivePreset = preset;

  if (preset === "custom") {
    const [customPass] = getPassesForPreset("custom", shaderSource);
    const webgl = gl.getContext() as WebGLRenderingContext;
    const valid = validateFragmentShader(
      webgl,
      EFFECT_VERTEX_SHADER,
      customPass.fragmentShader,
    );
    if (!valid) {
      console.warn("[EffectsLayer] Falling back to cinema preset");
      passes = getPassesForPreset("cinema");
      effectivePreset = "cinema";
    } else {
      passes = [customPass];
    }
  } else {
    passes = getPassesForPreset(preset, shaderSource);
  }

  cache.key = cacheKey;
  cache.passes = passes;
  cache.effectivePreset = effectivePreset;
  return { passes, effectivePreset };
}

export function EffectPipeline({
  sourceRef,
  config,
  opacity,
}: EffectPipelineProps) {
  const { gl, size } = useThree();
  const timeRef = useRef(0);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const rtARef = useRef<THREE.WebGLRenderTarget | null>(null);
  const rtBRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const quadSceneRef = useRef<THREE.Scene | null>(null);
  const quadCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const passCacheRef = useRef<{
    key: string;
    passes: EffectPass[];
    effectivePreset: EffectPreset;
  }>({
    key: "",
    passes: [],
    effectivePreset: "cinema",
  });

  useEffect(() => {
    gl.autoClear = false;
  }, [gl]);

  useEffect(() => {
    return () => {
      sceneTextureRef.current?.dispose();
      rtARef.current?.dispose();
      rtBRef.current?.dispose();
      materialRef.current?.dispose();
      quadSceneRef.current?.clear();
    };
  }, []);

  const ensureResources = (width: number, height: number) => {
    if (!compositeCanvasRef.current) {
      compositeCanvasRef.current = document.createElement("canvas");
    }

    const canvas = compositeCanvasRef.current;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (!sceneTextureRef.current) {
      sceneTextureRef.current = new THREE.CanvasTexture(canvas);
      sceneTextureRef.current.minFilter = THREE.LinearFilter;
      sceneTextureRef.current.magFilter = THREE.LinearFilter;
    }

    const rtOptions: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    };

    if (
      !rtARef.current ||
      rtARef.current.width !== width ||
      rtARef.current.height !== height
    ) {
      rtARef.current?.dispose();
      rtBRef.current?.dispose();
      rtARef.current = new THREE.WebGLRenderTarget(width, height, rtOptions);
      rtBRef.current = new THREE.WebGLRenderTarget(width, height, rtOptions);
    }

    if (!quadSceneRef.current) {
      quadSceneRef.current = new THREE.Scene();
      quadCameraRef.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      materialRef.current = new THREE.ShaderMaterial({
        vertexShader: EFFECT_VERTEX_SHADER,
        fragmentShader: buildMixPass().fragmentShader,
        uniforms: {
          uInput: { value: null as THREE.Texture | null },
          uScene: { value: null as THREE.Texture | null },
          uResolution: { value: new THREE.Vector2(width, height) },
          uTime: { value: 0 },
          uIntensity: { value: 0.5 },
          uSpeed: { value: 0.5 },
          uHue: { value: 0.5 },
          uMix: { value: 1 },
          uOpacity: { value: 1 },
          uParam1: { value: 1 },
          uParam2: { value: 1 },
          uParam3: { value: 1 },
        },
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        materialRef.current,
      );
      quadSceneRef.current.add(mesh);
    }
  };

  useFrame((_, delta) => {
    timeRef.current += delta;
    const root = sourceRef.current;

    const width = Math.max(1, Math.floor(size.width));
    const height = Math.max(1, Math.floor(size.height));

    ensureResources(width, height);

    const material = materialRef.current;
    const quadScene = quadSceneRef.current;
    const quadCamera = quadCameraRef.current;
    const rtA = rtARef.current;
    const rtB = rtBRef.current;

    if (!root || !material || !quadScene || !quadCamera || !rtA || !rtB) {
      return;
    }

    const canvas = compositeCanvasRef.current;
    const sceneTexture = sceneTextureRef.current;
    if (!canvas || !sceneTexture) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    compositeLayersToCanvas(root, ctx, width, height);
    sceneTexture.needsUpdate = true;

    const bindings = config.bindings;
    const values = config.values ?? {};

    material.uniforms.uResolution.value.set(width, height);
    material.uniforms.uTime.value = timeRef.current;
    material.uniforms.uIntensity.value = readScaledBinding(
      bindings.intensity,
      values.intensity ?? 1,
      0.5,
    );
    material.uniforms.uSpeed.value = readScaledBinding(
      bindings.speed,
      values.speed ?? 1,
      0.5,
    );
    material.uniforms.uHue.value = readScaledBinding(
      bindings.hue,
      values.hue ?? 1,
      0.5,
    );
    material.uniforms.uMix.value = readScaledBinding(
      bindings.mix,
      values.mix ?? 1,
      1,
    );
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uScene.value = sceneTexture;

    const cacheKey = `${config.preset}:${config.shaderSource ?? ""}`;
    const { passes: effectPasses, effectivePreset } = resolveEffectPasses(
      gl,
      config.preset,
      config.shaderSource,
      cacheKey,
      passCacheRef.current,
    );

    const presetParams = getPresetUniformParams(
      effectivePreset,
      config.params,
    );
    material.uniforms.uParam1.value = presetParams.uParam1;
    material.uniforms.uParam2.value = presetParams.uParam2;
    material.uniforms.uParam3.value = presetParams.uParam3;

    let input: THREE.Texture = sceneTexture;
    let ping = 0;

    for (const pass of effectPasses) {
      const outputRT = ping % 2 === 0 ? rtA : rtB;
      if (material.fragmentShader !== pass.fragmentShader) {
        material.fragmentShader = pass.fragmentShader;
        material.needsUpdate = true;
      }

      material.uniforms.uInput.value = input;
      gl.setRenderTarget(outputRT);
      gl.render(quadScene, quadCamera);
      input = outputRT.texture;
      ping += 1;
    }

    const mixPass = buildMixPass();
    if (material.fragmentShader !== mixPass.fragmentShader) {
      material.fragmentShader = mixPass.fragmentShader;
      material.needsUpdate = true;
    }

    material.uniforms.uInput.value = input;
    gl.setRenderTarget(null);
    gl.render(quadScene, quadCamera);
  });

  return null;
}
