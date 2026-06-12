"use client";

import { useMemo, useRef, type Ref } from "react";
import { Canvas, useFrame } from "@react-three/fiber/legacy";
import * as THREE from "three";
import { useVariableStoreApi } from "@/hooks/useVariableStore";
import type {
  ThreeGeometry,
  ThreeJSLayerConfig,
  ThreeLight,
  ThreeObject,
} from "@/lib/layers";

type ThreeLayerProps = {
  layerId: string;
  config: ThreeJSLayerConfig;
};

const DEFAULT_CAMERA = {
  position: new THREE.Vector3(0, 0, 8),
  fov: 50,
};

const BLOB_VERTEX_SHADER = `
uniform float uTime;
uniform float uDisplacement;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec3 pos = position;
  float noise = snoise(normalize(pos) * 2.0 + uTime * 0.5);
  pos += normal * noise * uDisplacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const BLOB_FRAGMENT_SHADER = `
uniform vec3 uColor;
void main() {
  gl_FragColor = vec4(uColor, 1.0);
}
`;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mapPosition(value: number): number {
  return (clamp01(value) - 0.5) * 8;
}

function mapScale(value: number): number {
  return 0.1 + clamp01(value) * 2.9;
}

function mapRotationSpeed(value: number): number {
  return clamp01(value) * 0.05;
}

function mapIntensity(value: number, defaultIntensity: number): number {
  return clamp01(value) * 10;
}

function applyHueToHex(hex: string, hueOffset01: number): string {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL((hsl.h + hueOffset01) % 1, hsl.s, hsl.l);
  return `#${color.getHexString()}`;
}

function readBinding(variableId: string | undefined, fallback = 0.5): number {
  if (!variableId) {
    return fallback;
  }
  return useVariableStoreApi.getState().get(variableId);
}

function createScatterOffsets(count: number): THREE.Vector3[] {
  return Array.from({ length: count }, () => {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
    );
  });
}

function createPointsPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  return positions;
}

function CameraController({
  cameraBindings,
}: {
  cameraBindings: ThreeJSLayerConfig["cameraBindings"];
}) {
  const target = useRef(new THREE.Vector3(0, 0, 8));

  useFrame(({ camera }) => {
    if (cameraBindings.posX) {
      target.current.x = mapPosition(readBinding(cameraBindings.posX));
    }
    if (cameraBindings.posY) {
      target.current.y = mapPosition(readBinding(cameraBindings.posY));
    }
    if (cameraBindings.posZ) {
      target.current.z = 4 + readBinding(cameraBindings.posZ) * 8;
    }

    camera.position.lerp(target.current, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function SceneLight({ light }: { light: ThreeLight }) {
  const ref = useRef<THREE.Light>(null);

  useFrame(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const intensityBinding = light.bindings.intensity;
    const hueBinding = light.bindings.colourHue;

    if (intensityBinding) {
      node.intensity = mapIntensity(
        readBinding(intensityBinding),
        light.defaultIntensity,
      );
    } else {
      node.intensity = light.defaultIntensity;
    }

    const baseColor = applyHueToHex(
      light.defaultColour,
      hueBinding ? readBinding(hueBinding) : 0,
    );
    node.color.set(baseColor);

    if (
      light.type === "point" ||
      light.type === "spot" ||
      light.type === "directional"
    ) {
      const posX = light.bindings.posX
        ? mapPosition(readBinding(light.bindings.posX))
        : 3;
      const posY = light.bindings.posY
        ? mapPosition(readBinding(light.bindings.posY))
        : 3;
      const posZ = light.bindings.posZ
        ? mapPosition(readBinding(light.bindings.posZ))
        : 3;
      node.position.set(posX, posY, posZ);
    }
  });

  switch (light.type) {
    case "ambient":
      return <ambientLight ref={ref as Ref<THREE.AmbientLight>} />;
    case "point":
      return <pointLight ref={ref as Ref<THREE.PointLight>} />;
    case "directional":
      return <directionalLight ref={ref as Ref<THREE.DirectionalLight>} />;
    case "spot":
      return <spotLight ref={ref as Ref<THREE.SpotLight>} />;
  }
}

function BlobMesh({ object }: { object: ThreeObject }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const rotationRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDisplacement: { value: 0.3 },
      uColor: { value: new THREE.Color(object.colour) },
    }),
    [object.colour],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) {
      return;
    }

    const posX = object.bindings.posX
      ? mapPosition(readBinding(object.bindings.posX))
      : 0;
    const posY = object.bindings.posY
      ? mapPosition(readBinding(object.bindings.posY))
      : 0;
    const posZ = object.bindings.posZ
      ? mapPosition(readBinding(object.bindings.posZ))
      : 0;
    const scaleBinding = object.bindings.scale;
    const rotationBinding = object.bindings.rotationSpeed;
    const scale = scaleBinding ? mapScale(readBinding(scaleBinding)) : 1;
    const rotationSpeed = rotationBinding
      ? mapRotationSpeed(readBinding(rotationBinding))
      : 0;

    rotationRef.current += rotationSpeed;
    mesh.position.set(posX, posY, posZ);
    mesh.scale.setScalar(scale);
    mesh.rotation.y = rotationRef.current;
    material.uniforms.uTime.value += delta;
    material.uniforms.uDisplacement.value = 0.1 + scale * 0.2;
    material.uniforms.uColor.value.set(object.colour);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={BLOB_VERTEX_SHADER}
        fragmentShader={BLOB_FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function PointsObject({ object }: { object: ThreeObject }) {
  const pointsRef = useRef<THREE.Points>(null);
  const rotationRef = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(createPointsPositions(object.count), 3),
    );
    return geo;
  }, [object.count]);

  useFrame(() => {
    const points = pointsRef.current;
    if (!points) {
      return;
    }

    const posX = object.bindings.posX
      ? mapPosition(readBinding(object.bindings.posX))
      : 0;
    const posY = object.bindings.posY
      ? mapPosition(readBinding(object.bindings.posY))
      : 0;
    const posZ = object.bindings.posZ
      ? mapPosition(readBinding(object.bindings.posZ))
      : 0;
    const scale = object.bindings.scale
      ? mapScale(readBinding(object.bindings.scale))
      : 1;
    const rotationSpeed = object.bindings.rotationSpeed
      ? mapRotationSpeed(readBinding(object.bindings.rotationSpeed))
      : 0;

    rotationRef.current += rotationSpeed;
    points.position.set(posX, posY, posZ);
    points.scale.setScalar(scale);
    points.rotation.y = rotationRef.current;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.05} color={object.colour} />
    </points>
  );
}

function InstancedObject({ object }: { object: ThreeObject }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const offsets = useMemo(
    () => createScatterOffsets(object.count),
    [object.count],
  );
  const rotationRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const posX = object.bindings.posX
      ? mapPosition(readBinding(object.bindings.posX))
      : 0;
    const posY = object.bindings.posY
      ? mapPosition(readBinding(object.bindings.posY))
      : 0;
    const posZ = object.bindings.posZ
      ? mapPosition(readBinding(object.bindings.posZ))
      : 0;
    const scale = object.bindings.scale
      ? mapScale(readBinding(object.bindings.scale))
      : 1;
    const rotationSpeed = object.bindings.rotationSpeed
      ? mapRotationSpeed(readBinding(object.bindings.rotationSpeed))
      : 0;

    rotationRef.current += rotationSpeed;

    for (let i = 0; i < object.count; i += 1) {
      const offset = offsets[i];
      dummy.position.set(
        offset.x + posX,
        offset.y + posY,
        offset.z + posZ,
      );
      dummy.scale.setScalar(scale);
      dummy.rotation.y = rotationRef.current;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, object.count]}>
      {renderGeometry(object.geometry)}
      {renderMaterial(object)}
    </instancedMesh>
  );
}

function SingleObject({ object }: { object: ThreeObject }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationRef = useRef(0);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const posX = object.bindings.posX
      ? mapPosition(readBinding(object.bindings.posX))
      : 0;
    const posY = object.bindings.posY
      ? mapPosition(readBinding(object.bindings.posY))
      : 0;
    const posZ = object.bindings.posZ
      ? mapPosition(readBinding(object.bindings.posZ))
      : 0;
    const scale = object.bindings.scale
      ? mapScale(readBinding(object.bindings.scale))
      : 1;
    const rotationSpeed = object.bindings.rotationSpeed
      ? mapRotationSpeed(readBinding(object.bindings.rotationSpeed))
      : 0;

    rotationRef.current += rotationSpeed;
    mesh.position.set(posX, posY, posZ);
    mesh.scale.setScalar(scale);
    mesh.rotation.y = rotationRef.current;
  });

  if (object.geometry === "blob") {
    return <BlobMesh object={object} />;
  }

  if (object.geometry === "points") {
    return <PointsObject object={object} />;
  }

  return (
    <mesh ref={meshRef}>
      {renderGeometry(object.geometry)}
      {renderMaterial(object)}
    </mesh>
  );
}

function ThreeObjectRenderer({ object }: { object: ThreeObject }) {
  if (object.geometry === "points") {
    return <PointsObject object={object} />;
  }

  if (object.count > 1) {
    return <InstancedObject object={object} />;
  }

  return <SingleObject object={object} />;
}

function renderGeometry(geometry: ThreeGeometry) {
  switch (geometry) {
    case "sphere":
      return <sphereGeometry args={[1, 32, 32]} />;
    case "box":
      return <boxGeometry args={[1, 1, 1]} />;
    case "icosahedron":
      return <icosahedronGeometry args={[1, 0]} />;
    case "torus":
      return <torusGeometry args={[1, 0.4, 16, 100]} />;
    case "blob":
      return <sphereGeometry args={[1, 64, 64]} />;
    case "points":
      return null;
  }
}

function renderMaterial(object: ThreeObject) {
  if (object.material === "wireframe") {
    return (
      <meshStandardMaterial color={object.colour} wireframe />
    );
  }

  if (object.material === "points") {
    return <pointsMaterial size={0.05} color={object.colour} />;
  }

  return <meshStandardMaterial color={object.colour} />;
}

function ThreeScene({ config }: { config: ThreeJSLayerConfig }) {
  return (
    <>
      <CameraController cameraBindings={config.cameraBindings} />
      {config.lights.map((light) => (
        <SceneLight key={light.id} light={light} />
      ))}
      {config.objects.map((object) => (
        <ThreeObjectRenderer key={object.id} object={object} />
      ))}
    </>
  );
}

export function ThreeLayer({ config }: ThreeLayerProps) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ background: "transparent" }}
      renderer={{ alpha: true, antialias: true }}
      camera={DEFAULT_CAMERA}
    >
      <ThreeScene config={config} />
    </Canvas>
  );
}
