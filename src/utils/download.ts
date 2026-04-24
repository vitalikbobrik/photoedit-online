export function downloadCanvas(canvas: HTMLCanvasElement, format: 'png' | 'jpeg', quality: number, name = 'image') {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const url = canvas.toDataURL(mimeType, quality / 100);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}_edited(photoedit.online).${format}`;
  a.click();
}

export async function pasteImageFromClipboard(): Promise<File | null> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          return new File([blob], 'paste.png', { type });
        }
      }
    }
  } catch {
    // Clipboard API might not be available
  }
  return null;
}
