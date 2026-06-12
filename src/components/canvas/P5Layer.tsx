"use client";

import { useEffect, useRef } from "react";
import type p5 from "p5";
import { useLayerStoreApi } from "@/hooks/useLayerStore";
import { useVariableStoreApi } from "@/hooks/useVariableStore";
import {
  DEFAULT_SHADER_SOURCE,
  type P5LayerConfig,
  type P5SketchType,
} from "@/lib/layers";

type P5LayerProps = {
  layerId: string;
  config: P5LayerConfig;
};

const DEFAULT_VERT = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

function readVariable(bindingKey: string, bindings: Record<string, string>): number {
  const variableId = bindings[bindingKey];
  if (!variableId) {
    return 0.5;
  }
  return useVariableStoreApi.getState().get(variableId);
}

function createNoiseFieldSketch(
  p: p5,
  bindings: Record<string, string>,
): void {
  const particles: Array<{
    x: number;
    y: number;
    seed: number;
  }> = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    const density = readVariable("density", bindings);
    const speed = readVariable("speed", bindings);
    const hue = readVariable("hue", bindings);
    const trail = readVariable("trail", bindings);

    const count = Math.floor(50 + density * 450);
    const trailAlpha = 0.1 + trail * 0.9;
    const noiseScale = 0.002 + speed * 0.008;
    const hueDegrees = hue * 360;

    p.noStroke();
    p.fill(10, 10, 10, trailAlpha * 255);
    p.rect(0, 0, p.width, p.height);

    while (particles.length < count) {
      particles.push({
        x: p.random(p.width),
        y: p.random(p.height),
        seed: p.random(1000),
      });
    }

    while (particles.length > count) {
      particles.pop();
    }

    for (const particle of particles) {
      const angle =
        p.noise(particle.x * noiseScale, particle.y * noiseScale, particle.seed) *
        p.TWO_PI *
        4;
      const velocity = 0.5 + speed * 3;
      particle.x += p.cos(angle) * velocity;
      particle.y += p.sin(angle) * velocity;
      particle.seed += speed * 0.01;

      if (particle.x < 0) {
        particle.x = p.width;
      } else if (particle.x > p.width) {
        particle.x = 0;
      }
      if (particle.y < 0) {
        particle.y = p.height;
      } else if (particle.y > p.height) {
        particle.y = 0;
      }

      const particleHue = (hueDegrees + particle.seed * 30) % 360;
      p.fill(p.color(`hsl(${particleHue}, 75%, 78%)`));
      p.circle(particle.x, particle.y, 2 + speed * 4);
    }
  };
}

function createImageDisplaceSketch(
  p: p5,
  bindings: Record<string, string>,
  imageSrc: string | null | undefined,
  layerId: string,
): void {
  let sourceImage: p5.Image | null = null;
  let loadedSrc: string | null = null;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    const currentSrc =
      useLayerStoreApi.getState().getLayer(layerId)?.config &&
      (useLayerStoreApi.getState().getLayer(layerId)?.config as P5LayerConfig).imageSrc;

    if (currentSrc && currentSrc !== loadedSrc) {
      loadedSrc = currentSrc;
      p.loadImage(currentSrc, (img) => {
        sourceImage = img;
      });
    }

    const displace = readVariable("displace", bindings);
    const speed = readVariable("speed", bindings);
    const hue = readVariable("hue", bindings);

    p.background(10, 10, 10, 30);

    if (!sourceImage) {
      p.fill(255, 255, 255, 80);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("Upload an image in the layer panel", p.width / 2, p.height / 2);
      return;
    }

    const time = p.millis() * 0.001 * (0.2 + speed * 2);
    const amount = displace * 40;
    const imgW = sourceImage.width;
    const imgH = sourceImage.height;
    const scale = Math.max(p.width / imgW, p.height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (p.width - drawW) / 2;
    const offsetY = (p.height - drawH) / 2;

    p.image(sourceImage, offsetX, offsetY, drawW, drawH);

    p.loadPixels();
    const pixels = p.pixels;
    const copy = [...pixels];
    const step = 4;

    for (let y = 0; y < p.height; y += step) {
      for (let x = 0; x < p.width; x += step) {
        const noiseVal = p.noise(x * 0.01, y * 0.01, time);
        const dx = Math.floor((noiseVal - 0.5) * amount);
        const dy = Math.floor(
          (p.noise(x * 0.01 + 100, y * 0.01, time) - 0.5) * amount,
        );
        const srcX = x + dx;
        const srcY = y + dy;

        if (srcX < 0 || srcX >= p.width || srcY < 0 || srcY >= p.height) {
          continue;
        }

        const dstIndex = (y * p.width + x) * 4;
        const srcIndex = (srcY * p.width + srcX) * 4;

        for (let c = 0; c < 4; c += 1) {
          pixels[dstIndex + c] = copy[srcIndex + c];
        }
      }
    }

    p.updatePixels();

    if (hue > 0.01) {
      p.fill(hue * 360, 60, 50, hue * 0.35 * 255);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
    }
  };

  if (imageSrc) {
    loadedSrc = imageSrc;
    p.loadImage(imageSrc, (img) => {
      sourceImage = img;
    });
  }
}

function createTypographySketch(
  p: p5,
  bindings: Record<string, string>,
  text: string,
  layerId: string,
): void {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    const layer = useLayerStoreApi.getState().getLayer(layerId);
    const config = layer?.config as P5LayerConfig | undefined;
    const displayText = config?.text ?? text;

    const warp = readVariable("warp", bindings);
    const size = readVariable("size", bindings);
    const hue = readVariable("hue", bindings);

    p.background(10, 10, 10, 40);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);

    const fontSize = p.width * (0.08 + size * 0.2);
    p.textSize(fontSize);
    p.fill(hue * 360, 75, 78);

    const chars = displayText.split("");
    const totalWidth = p.textWidth(displayText);
    let x = p.width / 2 - totalWidth / 2;

    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      const charWidth = p.textWidth(char);
      const wave =
        p.sin(p.frameCount * 0.05 + i * 0.5) * warp * fontSize * 0.3;
      const skew = (warp - 0.5) * 0.5;

      p.push();
      p.translate(x + charWidth / 2, p.height / 2 + wave);
      p.shearX(skew);
      p.text(char, 0, 0);
      p.pop();

      x += charWidth;
    }
  };
}

function createDrawSketch(
  p: p5,
  bindings: Record<string, string>,
): void {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.pixelDensity(1);
    p.background(10, 10, 10);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.mouseDragged = () => {
    const size = readVariable("size", bindings);
    const hue = readVariable("hue", bindings);
    const speed = readVariable("speed", bindings);

    const strokeWeight = 1 + size * 20;
    const alpha = 0.2 + speed * 0.8;

    p.stroke(hue * 360, 75, 78, alpha * 255);
    p.strokeWeight(strokeWeight);
    p.line(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
  };

  p.mousePressed = () => {
    p.mouseDragged();
  };

  p.draw = () => {
    // Keep canvas alive for variable-driven stroke on drag
  };
}

function createShaderSketch(
  p: p5,
  bindings: Record<string, string>,
  shaderSource: string,
  layerId: string,
): void {
  let shader: p5.Shader | null = null;
  let compiledSource = shaderSource;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.pixelDensity(1);
    p.noStroke();

    try {
      shader = p.createShader(DEFAULT_VERT, compiledSource);
    } catch {
      shader = p.createShader(
        DEFAULT_VERT,
        DEFAULT_SHADER_SOURCE.replace("gl_FragColor", "gl_FragColor"),
      );
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    const layer = useLayerStoreApi.getState().getLayer(layerId);
    const config = layer?.config as P5LayerConfig | undefined;
    const nextSource = config?.shaderSource ?? shaderSource;

    if (nextSource !== compiledSource) {
      compiledSource = nextSource;
      try {
        shader = p.createShader(DEFAULT_VERT, compiledSource);
      } catch {
        shader = p.createShader(DEFAULT_VERT, DEFAULT_SHADER_SOURCE);
      }
    }

    if (!shader) {
      return;
    }

    const speed = readVariable("speed", bindings);
    const hue = readVariable("hue", bindings);
    const scale = readVariable("scale", bindings);

    p.shader(shader);
    shader.setUniform("uTime", p.millis() * 0.001);
    shader.setUniform("uSpeed", speed);
    shader.setUniform("uHue", hue);
    shader.setUniform("uScale", 0.5 + scale * 2);
    shader.setUniform("uResolution", [p.width, p.height]);

    p.plane(p.width, p.height);
  };
}

function createSketch(
  p: p5,
  sketch: P5SketchType,
  bindings: Record<string, string>,
  layerId: string,
  config: P5LayerConfig,
): void {
  switch (sketch) {
    case "noise_field":
      createNoiseFieldSketch(p, bindings);
      break;
    case "image_displace":
      createImageDisplaceSketch(p, bindings, config.imageSrc, layerId);
      break;
    case "typography":
      createTypographySketch(p, bindings, config.text ?? "PLAY", layerId);
      break;
    case "draw":
      createDrawSketch(p, bindings);
      break;
    case "shader":
      createShaderSketch(
        p,
        bindings,
        config.shaderSource ?? DEFAULT_SHADER_SOURCE,
        layerId,
      );
      break;
  }
}

export function P5Layer({ layerId, config }: P5LayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    const init = async () => {
      const p5Module = await import("p5");
      if (cancelled) {
        return;
      }

      const P5 = p5Module.default;
      const sketch = (p: p5) => {
        createSketch(p, config.sketch, config.bindings, layerId, config);
      };

      instanceRef.current = new P5(sketch, container);
    };

    init();

    return () => {
      cancelled = true;
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [layerId, config.sketch, config.bindings, config.imageSrc, config.text, config.shaderSource, config]);

  const isDraw = config.sketch === "draw";

  return (
    <div
      ref={containerRef}
      className="h-full w-full [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      style={{
        pointerEvents: isDraw ? "auto" : "none",
      }}
    />
  );
}
