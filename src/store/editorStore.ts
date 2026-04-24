import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { castDraft } from 'immer';
import type {
  Tool, AspectRatio, CropRect,
  FilterState, AdjustState, EffectsState, WatermarkState, ExportSettings,
} from '../types';
import { PRESETS } from '../types';

// ── Snapshot for undo/redo ──────────────────────────────────────────────────
type Snapshot = {
  rotation: number; flipX: boolean; flipY: boolean;
  crop: CropRect; cropAspect: AspectRatio; cropCircular: boolean;
  filters: FilterState; adjustments: AdjustState; effects: EffectsState;
  watermark: WatermarkState;
};

function snapshot(s: EditorStore): Snapshot {
  return {
    rotation: s.rotation, flipX: s.flipX, flipY: s.flipY,
    crop: { ...s.crop }, cropAspect: s.cropAspect, cropCircular: s.cropCircular,
    filters: { ...s.filters }, adjustments: { ...s.adjustments },
    effects: { ...s.effects }, watermark: { ...s.watermark },
  };
}

// ── Store ───────────────────────────────────────────────────────────────────
export interface EditorStore {
  // image
  image: HTMLImageElement | null;
  sourceImage: HTMLImageElement | null; // original File load, never overwritten by internal ops
  imageWidth: number;
  imageHeight: number;
  fileName: string;

  // active tool
  activeTool: Tool;

  // transform
  rotation: number;
  flipX: boolean;
  flipY: boolean;

  // crop
  crop: CropRect;
  cropAspect: AspectRatio;
  cropCircular: boolean;

  // filters
  filters: FilterState;

  // adjustments
  adjustments: AdjustState;

  // effects
  effects: EffectsState;

  // watermark
  watermark: WatermarkState;

  // export
  exportSettings: ExportSettings;

  // bg remove
  bgThreshold: number;
  bgPickedColor: [number, number, number] | null;

  // view (zoom/pan managed in CanvasEditor, stored globally for reset)
  zoom: number;
  panX: number;
  panY: number;

  // resize preview (non-destructive, cleared on apply or tab switch)
  resizePreview: { w: number; h: number } | null;

  // history
  past: Snapshot[];
  future: Snapshot[];

  // version counter to trigger re-render
  version: number;

  // counter incremented by panel "Crop" button; CropOverlay watches and fires apply()
  cropTrigger: number;

  // radius (px) of the circle crop frame; 0 = not yet initialized
  circleRadius: number;

  // ── Actions ──
  loadImage: (file: File | Blob) => Promise<void>;
  setTool: (t: Tool) => void;
  rotate90: () => void;
  flipH: () => void;
  flipV: () => void;
  setCrop: (r: Partial<CropRect>) => void;
  setCropAspect: (a: AspectRatio) => void;
  setCropCircular: (c: boolean) => void;
  resetCrop: () => void;
  setFilter: <K extends keyof FilterState>(k: K, v: FilterState[K]) => void;
  setAdjust: <K extends keyof AdjustState>(k: K, v: AdjustState[K]) => void;
  setEffect: <K extends keyof EffectsState>(k: K, v: EffectsState[K]) => void;
  applyPreset: (name: string) => void;
  setWatermark: (u: Partial<WatermarkState>) => void;
  setExport: (u: Partial<ExportSettings>) => void;
  setView: (zoom: number, panX: number, panY: number) => void;
  setResizePreview: (v: { w: number; h: number } | null) => void;
  setBgThreshold: (v: number) => void;
  setBgColor: (c: [number, number, number] | null) => void;
  resetAll: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  bump: () => void;
  triggerCrop: () => void;
  setCircleRadius: (r: number) => void;
  restoreSource: () => void;
}

const defaultFilters: FilterState = { grayscale: 0, sepia: 0, invert: 0, blur: 0, sharpen: 0 };
const defaultAdjust: AdjustState = { brightness: 0, contrast: 0, saturation: 0 };
const defaultEffects: EffectsState = {
  grain: 0, vignetteEnabled: false, vignetteRadius: 50, vignetteStrength: 60,
  pixelate: 0, roundedCorners: 0,
};
const defaultWm: WatermarkState = {
  enabled: false, text: '© photoedit.online', x: 0.5, y: 0.5,
  opacity: 50, fontSize: 32, color: '#ffffff', rotation: 0,
};
const defaultCrop: CropRect = { x: 0, y: 0, width: 0, height: 0 };

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    image: null, sourceImage: null, imageWidth: 0, imageHeight: 0, fileName: 'image',
    activeTool: 'adjust',
    rotation: 0, flipX: false, flipY: false,
    crop: defaultCrop, cropAspect: 'free', cropCircular: false,
    filters: { ...defaultFilters },
    adjustments: { ...defaultAdjust },
    effects: { ...defaultEffects },
    watermark: { ...defaultWm },
    exportSettings: { format: 'png', quality: 90 },
    bgThreshold: 40, bgPickedColor: null,
    zoom: 1, panX: 0, panY: 0,
    resizePreview: null,
    past: [], future: [],
    version: 0,
    cropTrigger: 0,
    circleRadius: 0,

    loadImage: async (file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = url;
      });
      // Downscale if >4000px
      let src: HTMLImageElement = img;
      if (img.width > 4000 || img.height > 4000) {
        const scale = Math.min(4000 / img.width, 4000 / img.height);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        const smallImg = new Image();
        await new Promise<void>(res => { smallImg.onload = () => res(); smallImg.src = c.toDataURL(); });
        src = smallImg;
      }
      URL.revokeObjectURL(url);
      set(s => {
        s.image = castDraft(src);
        s.imageWidth = src.width;
        s.imageHeight = src.height;
        if (file instanceof File) {
          s.sourceImage = castDraft(src);
          s.fileName = file.name.replace(/\.[^.]+$/, '');
        }
        s.crop = defaultCrop;
        s.rotation = 0; s.flipX = false; s.flipY = false;
        s.filters = { ...defaultFilters };
        s.adjustments = { ...defaultAdjust };
        s.effects = { ...defaultEffects };
        s.watermark = { ...defaultWm };
        s.past = []; s.future = [];
        s.zoom = 1; s.panX = 0; s.panY = 0;
        s.version++;
      });
    },

    setTool: (t) => set(s => { s.activeTool = t; }),

    rotate90: () => {
      get().pushHistory();
      set(s => {
        s.rotation = (s.rotation + 90) % 360;
        if (s.crop.width > 0) {
          const { x, y, width, height } = s.crop;
          const ih = s.imageHeight;
          s.crop = { x: ih - y - height, y: x, width: height, height: width };
        }
        s.version++;
      });
    },

    flipH: () => { get().pushHistory(); set(s => { s.flipX = !s.flipX; s.version++; }); },
    flipV: () => { get().pushHistory(); set(s => { s.flipY = !s.flipY; s.version++; }); },

    setCrop: (r) => set(s => { Object.assign(s.crop, r); s.version++; }),
    setCropAspect: (a) => set(s => { s.cropAspect = a; }),
    setCropCircular: (c) => set(s => { s.cropCircular = c; s.version++; }),
    resetCrop: () => set(s => { s.crop = { ...defaultCrop }; s.version++; }),

    setFilter: (k, v) => set(s => { (s.filters as FilterState)[k] = v; s.version++; }),
    setAdjust: (k, v) => set(s => { (s.adjustments as AdjustState)[k] = v; s.version++; }),
    setEffect: (k, v) => set(s => { (s.effects as Record<string, unknown>)[k] = v; s.version++; }),

    applyPreset: (name) => {
      get().pushHistory();
      const p = PRESETS[name];
      if (!p) return;
      set(s => {
        s.adjustments.brightness = p.brightness;
        s.adjustments.contrast = p.contrast;
        s.adjustments.saturation = p.saturation;
        s.filters.grayscale = p.grayscale;
        s.filters.sepia = p.sepia;
        s.version++;
      });
    },

    setWatermark: (u) => set(s => { Object.assign(s.watermark, u); s.version++; }),
    setExport: (u) => set(s => { Object.assign(s.exportSettings, u); }),
    setView: (zoom, panX, panY) => set(s => { s.zoom = zoom; s.panX = panX; s.panY = panY; }),
    setResizePreview: (v) => set(s => { s.resizePreview = v; s.version++; }),
    setBgThreshold: (v) => set(s => { s.bgThreshold = v; }),
    setBgColor: (c) => set(s => { s.bgPickedColor = c; }),

    resetAll: () => set(s => {
      s.rotation = 0; s.flipX = false; s.flipY = false;
      s.crop = { ...defaultCrop };
      s.filters = { ...defaultFilters };
      s.adjustments = { ...defaultAdjust };
      s.effects = { ...defaultEffects };
      s.watermark = { ...defaultWm, enabled: s.watermark.enabled };
      s.past = []; s.future = [];
      s.version++;
    }),

    pushHistory: () => set(s => {
      s.past.push(snapshot(s as unknown as EditorStore));
      if (s.past.length > 50) s.past.shift();
      s.future = [];
    }),

    undo: () => set(s => {
      if (s.past.length === 0) return;
      const current = snapshot(s as unknown as EditorStore);
      s.future.unshift(current);
      const prev = s.past.pop()!;
      Object.assign(s, prev);
      s.version++;
    }),

    redo: () => set(s => {
      if (s.future.length === 0) return;
      const current = snapshot(s as unknown as EditorStore);
      s.past.push(current);
      const next = s.future.shift()!;
      Object.assign(s, next);
      s.version++;
    }),

    bump: () => set(s => { s.version++; }),
    triggerCrop: () => set(s => { s.cropTrigger++; }),
    setCircleRadius: (r) => set(s => { s.circleRadius = r; }),

    restoreSource: () => {
      const src = get().sourceImage;
      if (!src) return;
      set(s => {
        s.image = castDraft(src);
        s.imageWidth = src.width;
        s.imageHeight = src.height;
        s.crop = defaultCrop;
        s.rotation = 0; s.flipX = false; s.flipY = false;
        s.filters = { ...defaultFilters };
        s.adjustments = { ...defaultAdjust };
        s.effects = { ...defaultEffects };
        s.past = []; s.future = [];
        s.zoom = 1; s.panX = 0; s.panY = 0;
        s.version++;
      });
    },
  }))
);
