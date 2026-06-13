/**
 * DOM capture contract — each content layer wrapper must expose:
 * - data-layer-surface
 * - data-layer-type (must not be "effects")
 * - data-layer-visible ("true" | "false")
 * - data-layer-opacity (0–1 string)
 * - data-layer-z-index (integer string for draw order)
 */
export function compositeLayersToCanvas(
  root: HTMLElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  const surfaces = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-layer-surface]:not([data-layer-type='effects'])",
    ),
  );

  surfaces.sort((a, b) => {
    const zA = Number(a.dataset.layerZIndex ?? "0");
    const zB = Number(b.dataset.layerZIndex ?? "0");
    return zA - zB;
  });

  for (const surface of surfaces) {
    if (surface.dataset.layerVisible === "false") {
      continue;
    }

    const opacity = Number(surface.dataset.layerOpacity ?? "1");
    ctx.globalAlpha = opacity;

    const canvas = surface.querySelector("canvas");
    const video = surface.querySelector("video");
    const img = surface.querySelector("img");

    if (canvas && canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(canvas, 0, 0, width, height);
    } else if (
      video &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      ctx.drawImage(video, 0, 0, width, height);
    } else if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, width, height);
    }
  }

  ctx.globalAlpha = 1;
}
