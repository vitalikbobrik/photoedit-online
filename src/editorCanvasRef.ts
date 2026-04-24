// Shared ref to the active editor canvas element.
// CanvasEditor writes this; ExportPanel reads it for export.
export const editorCanvasRef = { current: null as HTMLCanvasElement | null };
