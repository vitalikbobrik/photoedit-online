import type { EditorStore } from '../store/editorStore';

// ── helpers ─────────────────────────────────────────────────────────────────

function buildFilter(s: EditorStore): string {
  const parts: string[] = [];
  const a = s.adjustments;
  const f = s.filters;
  if (a.brightness !== 0) parts.push(`brightness(${1 + a.brightness / 100})`);
  if (a.contrast !== 0)   parts.push(`contrast(${Math.max(0, 1 + a.contrast / 100)})`);
  if (a.saturation !== 0) parts.push(`saturate(${Math.max(0, 1 + a.saturation / 100)})`);
  if (f.grayscale > 0)    parts.push(`grayscale(${f.grayscale / 100})`);
  if (f.sepia > 0)        parts.push(`sepia(${f.sepia / 100})`);
  if (f.invert > 0)       parts.push(`invert(${f.invert / 100})`);
  if (f.blur > 0)         parts.push(`blur(${f.blur}px)`);
  return parts.join(' ') || 'none';
}

function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  if (strength <= 0) return;
  const sh = strength;
  const k = [0, -sh, 0, -sh, 1 + 4 * sh, -sh, 0, -sh, 0];
  const id = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(id.data);
  const dst = id.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0, ki = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += src[((y + dy) * w + (x + dx)) * 4 + c] * k[ki++];
          }
        }
        dst[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

function applyGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  const str = intensity * 1.5;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * str;
    d[i]   = Math.max(0, Math.min(255, d[i]   + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  ctx.putImageData(id, 0, 0);
}

function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number, strength: number) {
  const cx = w / 2, cy = h / 2;
  const innerR = Math.min(w, h) * 0.5 * (radius / 100);
  const outerR = Math.sqrt(cx * cx + cy * cy);
  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength / 100})`);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function applyPixelate(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, px: number) {
  if (px <= 1) return;
  const tmp = document.createElement('canvas');
  tmp.width  = Math.max(1, Math.ceil(w / px));
  tmp.height = Math.max(1, Math.ceil(h / px));
  const tc = tmp.getContext('2d')!;
  tc.drawImage(canvas, 0, 0, tmp.width, tmp.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.restore();
}

function applyRoundedCorners(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.moveTo(rad, 0);
  ctx.arcTo(w, 0, w, h, rad);
  ctx.arcTo(w, h, 0, h, rad);
  ctx.arcTo(0, h, 0, 0, rad);
  ctx.arcTo(0, 0, w, 0, rad);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
}

function applyCircularMask(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = Math.min(w, h) / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
}

function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, wm: EditorStore['watermark']) {
  if (!wm.enabled || !wm.text) return;
  ctx.save();
  ctx.globalAlpha = wm.opacity / 100;
  ctx.font = `bold ${wm.fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = wm.color;
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(wm.text).width;
  const x = wm.x * w;
  const y = wm.y * h;
  ctx.translate(x, y);
  ctx.rotate((wm.rotation * Math.PI) / 180);
  ctx.fillText(wm.text, -tw / 2, 0);
  ctx.restore();
}

// ── base render (crop + rotation + flip only, no filters/effects) ────────────

export function renderBaseToCanvas(dest: HTMLCanvasElement, state: EditorStore): void {
  const img = state.image;
  if (!img) return;

  const rotated = state.rotation === 90 || state.rotation === 270;
  const tw = rotated ? img.height : img.width;
  const th = rotated ? img.width : img.height;

  const tfm = document.createElement('canvas');
  tfm.width = tw; tfm.height = th;
  const tc = tfm.getContext('2d')!;
  tc.save();
  tc.translate(tw / 2, th / 2);
  tc.rotate((state.rotation * Math.PI) / 180);
  tc.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
  tc.drawImage(img, -img.width / 2, -img.height / 2);
  tc.restore();

  const cx = state.crop.width > 0 ? state.crop.x : 0;
  const cy = state.crop.width > 0 ? state.crop.y : 0;
  const cw = state.crop.width > 0 ? state.crop.width : tw;
  const ch = state.crop.height > 0 ? state.crop.height : th;

  dest.width = Math.round(cw);
  dest.height = Math.round(ch);
  const ctx = dest.getContext('2d')!;
  ctx.clearRect(0, 0, dest.width, dest.height);
  ctx.drawImage(tfm, cx, cy, cw, ch, 0, 0, cw, ch);
}

// ── main render ─────────────────────────────────────────────────────────────

export function renderToCanvas(dest: HTMLCanvasElement, state: EditorStore): void {
  const img = state.image;
  if (!img) return;

  // 1. Build transform canvas
  const rotated = state.rotation === 90 || state.rotation === 270;
  const tw = rotated ? img.height : img.width;
  const th = rotated ? img.width : img.height;

  const tfm = document.createElement('canvas');
  tfm.width = tw; tfm.height = th;
  const tc = tfm.getContext('2d')!;
  tc.save();
  tc.translate(tw / 2, th / 2);
  tc.rotate((state.rotation * Math.PI) / 180);
  tc.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
  tc.drawImage(img, -img.width / 2, -img.height / 2);
  tc.restore();

  // 2. Crop region
  const cx = state.crop.width > 0 ? state.crop.x : 0;
  const cy = state.crop.width > 0 ? state.crop.y : 0;
  const cw = state.crop.width > 0 ? state.crop.width : tw;
  const ch = state.crop.height > 0 ? state.crop.height : th;

  // 3. Set output size
  dest.width  = Math.round(cw);
  dest.height = Math.round(ch);
  const ctx = dest.getContext('2d')!;
  ctx.clearRect(0, 0, dest.width, dest.height);

  // 4. Draw with CSS filters
  const flt = buildFilter(state);
  if (flt !== 'none') ctx.filter = flt;
  ctx.drawImage(tfm, cx, cy, cw, ch, 0, 0, cw, ch);
  ctx.filter = 'none';

  // 5. Sharpen
  if (state.filters.sharpen > 0) applySharpen(ctx, dest.width, dest.height, state.filters.sharpen);

  // 6. Circular crop mask
  if (state.cropCircular && state.crop.width > 0) applyCircularMask(ctx, dest.width, dest.height);

  // 7. Grain
  if (state.effects.grain > 0) applyGrain(ctx, dest.width, dest.height, state.effects.grain);

  // 8. Vignette
  if (state.effects.vignetteEnabled) {
    applyVignette(ctx, dest.width, dest.height, state.effects.vignetteRadius, state.effects.vignetteStrength);
  }

  // 9. Pixelate
  if (state.effects.pixelate > 1) applyPixelate(dest, ctx, dest.width, dest.height, state.effects.pixelate);

  // 10. Rounded corners
  if (state.effects.roundedCorners > 0) applyRoundedCorners(ctx, dest.width, dest.height, state.effects.roundedCorners);

  // 11. Watermark
  applyWatermark(ctx, dest.width, dest.height, state.watermark);

  // 12. Resize preview (non-destructive scale to target dimensions)
  if (state.resizePreview) {
    const { w, h } = state.resizePreview;
    if (w !== dest.width || h !== dest.height) {
      const tmp = document.createElement('canvas');
      tmp.width = dest.width; tmp.height = dest.height;
      tmp.getContext('2d')!.drawImage(dest, 0, 0);
      dest.width = w; dest.height = h;
      const rc = dest.getContext('2d')!;
      rc.imageSmoothingEnabled = true;
      rc.imageSmoothingQuality = 'high';
      rc.drawImage(tmp, 0, 0, w, h);
    }
  }
}

export function removeBg(
  dest: HTMLCanvasElement,
  source: HTMLImageElement | HTMLCanvasElement,
  threshold: number,
  pickedColor: [number, number, number] | null
): void {
  dest.width  = source.width;
  dest.height = source.height;
  const ctx = dest.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  const id = ctx.getImageData(0, 0, dest.width, dest.height);
  const d  = id.data;
  const w  = dest.width;
  const h  = dest.height;
  let br: number, bg: number, bb: number;
  if (pickedColor) {
    [br, bg, bb] = pickedColor;
  } else {
    const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]] as [number, number][];
    br = 0; bg = 0; bb = 0;
    corners.forEach(([x, y]) => { const i=(y*w+x)*4; br+=d[i]; bg+=d[i+1]; bb+=d[i+2]; });
    br /= 4; bg /= 4; bb /= 4;
  }
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i]-br)<threshold && Math.abs(d[i+1]-bg)<threshold && Math.abs(d[i+2]-bb)<threshold) d[i+3] = 0;
  }
  ctx.putImageData(id, 0, 0);
}
