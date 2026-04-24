export type Tool =
  | 'crop'
  | 'circlecrop'
  | 'eraser'
  | 'filters'
  | 'adjust'
  | 'effects'
  | 'bgremove'
  | 'watermark'
  | 'resize'
  | 'export';

export type AspectRatio = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FilterState {
  grayscale: number;   // 0–100
  sepia: number;       // 0–100
  invert: number;      // 0–100
  blur: number;        // 0–20 px
  sharpen: number;     // 0–5
}

export interface AdjustState {
  brightness: number;  // -100–100
  contrast: number;    // -100–100
  saturation: number;  // -100–100
}

export interface EffectsState {
  grain: number;
  vignetteEnabled: boolean;
  vignetteRadius: number;   // 0–100
  vignetteStrength: number; // 0–100
  pixelate: number;         // 0 = off, pixel size 1–50
  roundedCorners: number;   // 0–300
}

export interface WatermarkState {
  enabled: boolean;
  text: string;
  x: number;  // 0–1
  y: number;  // 0–1
  opacity: number;    // 0–100
  fontSize: number;   // 8–120
  color: string;
  rotation: number;   // degrees
}

export interface ExportSettings {
  format: 'png' | 'jpeg';
  quality: number; // 0–100
}

export interface Preset {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
}

export const PRESETS: Record<string, Preset> = {
  none:   { brightness: 0, contrast: 0, saturation: 0, grayscale: 0, sepia: 0 },
  vivid:  { brightness: 10, contrast: 30, saturation: 50, grayscale: 0, sepia: 0 },
  fade:   { brightness: 20, contrast: -30, saturation: -30, grayscale: 0, sepia: 0 },
  cold:   { brightness: 0, contrast: 10, saturation: -10, grayscale: 0, sepia: 0 },
  warm:   { brightness: 10, contrast: 10, saturation: 10, grayscale: 0, sepia: 20 },
  bwhc:   { brightness: 0, contrast: 60, saturation: -100, grayscale: 0, sepia: 0 },
  cinema: { brightness: -10, contrast: 20, saturation: -20, grayscale: 0, sepia: 0 },
};
