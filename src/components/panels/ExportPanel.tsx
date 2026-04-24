import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { renderToCanvas } from '../../core/renderer';
import { editorCanvasRef } from '../../editorCanvasRef';
import { downloadCanvas } from '../../utils/download';
import Slider from '../ui/Slider';

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const ExportPanel: React.FC = () => {
  const state = useEditorStore();
  const { exportSettings, setExport, image, fileName } = state;

  const handleExport = (fmt: 'png' | 'jpeg') => {
    if (!image) return;

    // Use the live editor canvas (already has eraser mask applied).
    // Fall back to a fresh render if the ref isn't set yet.
    const src = editorCanvasRef.current;
    const canvas = document.createElement('canvas');
    if (src) {
      canvas.width = src.width;
      canvas.height = src.height;
      canvas.getContext('2d')!.drawImage(src, 0, 0);
    } else {
      renderToCanvas(canvas, state);
    }

    downloadCanvas(canvas, fmt, exportSettings.quality, fileName);
  };

  return (
    <>
      <PanelLabel>Format</PanelLabel>
      <div style={{ display:'flex', gap:6, padding:'6px 14px 10px', borderBottom:'1px solid var(--border)' }}>
        {(['png','jpeg'] as const).map(f => (
          <button key={f} onClick={() => setExport({ format: f })} style={{
            flex:1, padding:'8px', borderRadius:9, border:'1px solid',
            borderColor: exportSettings.format === f ? 'rgba(124,108,248,0.4)' : 'var(--border)',
            background: exportSettings.format === f ? 'rgba(124,108,248,0.15)' : 'var(--surface2)',
            color: exportSettings.format === f ? 'var(--accent)' : 'var(--text3)',
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {exportSettings.format === 'jpeg' && (
        <Slider label="JPEG Quality" value={exportSettings.quality} min={10} max={100}
          onChange={v => setExport({ quality: v })} unit="%" />
      )}

      <div style={{ padding:'8px 14px', fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
        PNG preserves transparency. JPEG — smaller file size.
      </div>

      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={() => handleExport(exportSettings.format)} disabled={!image} style={{
          width:'100%', padding:'11px', borderRadius:10, border:'none',
          background: image ? 'var(--accent)' : 'var(--surface2)',
          color: '#fff', fontSize:13, fontWeight:600,
          cursor: image ? 'pointer' : 'not-allowed',
          boxShadow: image ? '0 0 16px var(--accent-glow)' : 'none',
        }}>
          ↓ Download {exportSettings.format.toUpperCase()}
        </button>

        {exportSettings.format === 'jpeg' && (
          <button onClick={() => handleExport('png')} disabled={!image} style={{
            width:'100%', padding:'8px', borderRadius:10, border:'1px solid var(--border)',
            background:'none', color:'var(--text3)', fontSize:12, cursor: image ? 'pointer' : 'not-allowed',
          }}>
            Also download PNG
          </button>
        )}
      </div>
    </>
  );
};

export default ExportPanel;
