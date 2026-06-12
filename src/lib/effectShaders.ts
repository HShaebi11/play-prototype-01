import type { EffectPreset } from "@/lib/layers";

export type EffectPass = {
  id: string;
  fragmentShader: string;
};

export const EFFECT_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`.trim();

const UNIFORM_PREAMBLE = `
precision mediump float;

uniform sampler2D uInput;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uSpeed;
uniform float uHue;
uniform float uMix;
uniform float uOpacity;

varying vec2 vUv;

vec3 hueRotate(vec3 color, float hue) {
  float angle = hue * 6.28318;
  float cosA = cos(angle);
  float sinA = sin(angle);
  mat3 rot = mat3(
    0.299 + 0.701 * cosA + 0.168 * sinA,
    0.587 - 0.587 * cosA + 0.330 * sinA,
    0.114 - 0.114 * cosA - 0.497 * sinA,
    0.299 - 0.299 * cosA - 0.328 * sinA,
    0.587 + 0.413 * cosA + 0.035 * sinA,
    0.114 - 0.114 * cosA + 0.292 * sinA,
    0.299 - 0.300 * cosA + 1.250 * sinA,
    0.587 - 0.588 * cosA - 1.050 * sinA,
    0.114 + 0.886 * cosA - 0.203 * sinA
  );
  return clamp(rot * color, 0.0, 1.0);
}
`.trim();

function wrapFragment(body: string): string {
  return `${UNIFORM_PREAMBLE}\n\n${body}`;
}

const PASS_VIGNETTE_GRADE = wrapFragment(`
void main() {
  vec4 col = texture2D(uInput, vUv);
  vec3 graded = hueRotate(col.rgb, uHue * 0.5);
  graded *= 0.9 + uIntensity * 0.2;
  float dist = distance(vUv, vec2(0.5));
  float vignette = 1.0 - smoothstep(0.35, 0.85, dist) * uIntensity * 0.7;
  gl_FragColor = vec4(graded * vignette, col.a);
}
`);

const PASS_GRAIN = wrapFragment(`
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec4 col = texture2D(uInput, vUv);
  float grain = (hash(vUv * uResolution + uTime * uSpeed * 10.0) - 0.5) * uIntensity * 0.15;
  gl_FragColor = vec4(col.rgb + grain, col.a);
}
`);

const PASS_GLITCH_DISPLACE = wrapFragment(`
void main() {
  float block = floor(vUv.y * 20.0 + uTime * uSpeed * 30.0);
  float shift = (fract(sin(block * 12.9898) * 43758.5453) - 0.5) * uIntensity * 0.08;
  vec4 col = texture2D(uInput, vUv + vec2(shift, 0.0));
  gl_FragColor = col;
}
`);

const PASS_RGB_SPLIT = wrapFragment(`
void main() {
  float offset = uIntensity * 0.02;
  float r = texture2D(uInput, vUv + vec2(offset, 0.0)).r;
  float g = texture2D(uInput, vUv).g;
  float b = texture2D(uInput, vUv - vec2(offset, 0.0)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`);

const PASS_CHROMATIC = wrapFragment(`
void main() {
  float offset = uIntensity * 0.015 * (1.0 + sin(uTime * uSpeed * 2.0) * 0.5);
  float r = texture2D(uInput, vUv + vec2(offset, 0.0)).r;
  float g = texture2D(uInput, vUv).g;
  float b = texture2D(uInput, vUv - vec2(offset, 0.0)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`);

const PASS_SOFT_BLUR = wrapFragment(`
void main() {
  vec2 texel = 1.0 / uResolution;
  float radius = uIntensity * 2.0;
  vec4 col = vec4(0.0);
  col += texture2D(uInput, vUv + texel * vec2(-radius, 0.0)) * 0.2;
  col += texture2D(uInput, vUv + texel * vec2(radius, 0.0)) * 0.2;
  col += texture2D(uInput, vUv + texel * vec2(0.0, -radius)) * 0.2;
  col += texture2D(uInput, vUv + texel * vec2(0.0, radius)) * 0.2;
  col += texture2D(uInput, vUv) * 0.2;
  gl_FragColor = col;
}
`);

const PASS_HUE_ROTATE = wrapFragment(`
void main() {
  vec4 col = texture2D(uInput, vUv);
  gl_FragColor = vec4(hueRotate(col.rgb, uHue), col.a);
}
`);

const PASS_SOFT_VIGNETTE = wrapFragment(`
void main() {
  vec4 col = texture2D(uInput, vUv);
  float dist = distance(vUv, vec2(0.5));
  float vignette = 1.0 - smoothstep(0.4, 0.9, dist) * uIntensity * 0.6;
  gl_FragColor = vec4(col.rgb * vignette, col.a);
}
`);

export function buildMixPass(): EffectPass {
  return {
    id: "mix",
    fragmentShader: wrapFragment(`
void main() {
  vec4 dry = texture2D(uScene, vUv);
  vec4 wet = texture2D(uInput, vUv);
  gl_FragColor = mix(dry, wet, uMix * uOpacity);
}
`),
  };
}

export function buildCopyPass(): EffectPass {
  return {
    id: "copy",
    fragmentShader: wrapFragment(`
void main() {
  gl_FragColor = texture2D(uScene, vUv);
}
`),
  };
}

export function buildCustomPass(body: string): EffectPass {
  return {
    id: "custom",
    fragmentShader: wrapFragment(`
void main() {
  vec4 color = texture2D(uInput, vUv);

  // USER_CODE_START
  ${body}
  // USER_CODE_END

  vec4 dry = texture2D(uScene, vUv);
  gl_FragColor = mix(dry, color, uMix * uOpacity);
}
`),
  };
}

const PRESET_PASSES: Record<
  Exclude<EffectPreset, "off" | "custom">,
  EffectPass[]
> = {
  cinema: [
    { id: "cinema-vignette", fragmentShader: PASS_VIGNETTE_GRADE },
    { id: "cinema-grain", fragmentShader: PASS_GRAIN },
  ],
  glitch: [
    { id: "glitch-displace", fragmentShader: PASS_GLITCH_DISPLACE },
    { id: "glitch-rgb", fragmentShader: PASS_RGB_SPLIT },
  ],
  rgb_split: [{ id: "rgb-chromatic", fragmentShader: PASS_CHROMATIC }],
  dream: [
    { id: "dream-blur", fragmentShader: PASS_SOFT_BLUR },
    { id: "dream-hue", fragmentShader: PASS_HUE_ROTATE },
    { id: "dream-vignette", fragmentShader: PASS_SOFT_VIGNETTE },
  ],
};

export function getPassesForPreset(
  preset: EffectPreset,
  customBody?: string,
): EffectPass[] {
  if (preset === "off") {
    return [];
  }

  if (preset === "custom") {
    return [buildCustomPass(customBody?.trim() || "color = color;")];
  }

  return PRESET_PASSES[preset];
}
