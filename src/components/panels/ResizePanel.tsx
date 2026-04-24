import React, { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const PRESETS = [
  { label:'1080 × 1080', w:1080, h:1080 },
  { label:'1920 × 1080', w:1920, h:1080 },
  { label:'800 × 600',   w:800,  h:600  },
  { label:'512 × 512',   w:512,  h:512  },
  { label:'2048 × 2048', w:2048, h:2048 },
];

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'7px 10px', background:'var(--surface2)',
  border:'1px solid var(--border)', borderRadius:8,
  color:'var(--text)', fontSize:12, outline:'none',
};

const ResizePanel: React.FC = () => {
  const { image, loadImage, imageWidth, imageHeight, setResizePreview } = useEditorStore();
  const [w, setW] = useState(imageWidth);
  const [h, setH] = useState(imageHeight);
  const [lock, setLock] = useState(true);

  // Reset local dims when a new image loads
  useEffect(() => {
    setW(imageWidth);
    setH(imageHeight);
    setResizePreview(null);
  }, [imageWidth, imageHeight, setResizePreview]);

  // Clear preview on unmount (tab switch)
  useEffect(() => () => setResizePreview(null), [setResizePreview]);

  // Push preview whenever w/h change
  const pushPreview = useCallback((newW: number, newH: number) => {
    if (newW > 0 && newH > 0) setResizePreview({ w: newW, h: newH });
  }, [setResizePreview]);

  const changeW = (val: number) => {
    setW(val);
    if (lock && imageWidth > 0) {
      const nh = Math.max(1, Math.round(val / imageWidth * imageHeight));
      setH(nh);
      pushPreview(val, nh);
    } else {
      pushPreview(val, h);
    }
  };

  const changeH = (val: number) => {
    setH(val);
    if (lock && imageHeight > 0) {
      const nw = Math.max(1, Math.round(val / imageHeight * imageWidth));
      setW(nw);
      pushPreview(nw, val);
    } else {
      pushPreview(w, val);
    }
  };

  const applyPreset = (pw: number, ph: number) => {
    setW(pw); setH(ph);
    pushPreview(pw, ph);
  };

  const handleApply = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = w || imageWidth;
    canvas.height = h || imageHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    setResizePreview(null);
    canvas.toBlob(blob => { if (blob) loadImage(blob); }, 'image/png');
  };

  const handleReset = () => {
    setW(imageWidth); setH(imageHeight);
    setResizePreview(null);
  };

  return (
    <>
      <PanelLabel>Size (px)</PanelLabel>
      <div style={{ padding:'6px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:5 }}>Width</div>
        <input type="number" style={inputStyle} value={w} min={1} max={8000}
          onChange={e => changeW(Number(e.target.value))} />
      </div>
      <div style={{ padding:'6px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:5 }}>Height</div>
        <input type="number" style={inputStyle} value={h} min={1} max={8000}
          onChange={e => changeH(Number(e.target.value))} />
      </div>
      <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
          <input type="checkbox" checked={lock} onChange={e => setLock(e.target.checked)}
            style={{ accentColor:'var(--accent)' }} />
          Keep aspect ratio
        </label>
      </div>

      <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)', fontSize:11, color:'var(--text3)', lineHeight:1.7 }}>
        <div>Original: <span style={{ color:'var(--text2)' }}>{imageWidth} × {imageHeight}</span></div>
        <div>Preview: <span style={{ color:'var(--accent)', fontWeight:600 }}>{w} × {h}</span></div>
      </div>

      <PanelLabel>Presets</PanelLabel>
      {PRESETS.map(p => (
        <button key={p.label} onClick={() => applyPreset(p.w, p.h)}
          style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px',
            background:'none', border:'none', borderBottom:'1px solid var(--border)',
            color:'var(--text2)', fontSize:12, cursor:'pointer' }}>
          {p.label}
        </button>
      ))}

      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
        <button onClick={handleApply} disabled={!image} style={{
          width:'100%', padding:'10px', borderRadius:10, border:'none',
          background: image ? 'rgba(108,248,168,0.12)' : 'var(--surface2)',
          color: image ? 'var(--green)' : 'var(--text3)',
          fontSize:13, fontWeight:600, cursor: image ? 'pointer' : 'not-allowed',
        }}>✓ Apply</button>
        <button onClick={handleReset} style={{
          width:'100%', padding:'7px', border:'1px solid var(--border)',
          borderRadius:8, background:'none', color:'var(--text3)', fontSize:11, cursor:'pointer',
        }}>↺ Reset</button>
      </div>
    </>
  );
};

export default ResizePanel;
