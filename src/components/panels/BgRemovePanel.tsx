import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { removeBg } from '../../core/renderer';
import Slider from '../ui/Slider';

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const BgRemovePanel: React.FC = () => {
  const { image, bgThreshold, bgPickedColor, setBgThreshold, setBgColor, loadImage, pushHistory, restoreSource } = useEditorStore();
  const colorRef = useRef<HTMLInputElement>(null);

  const handleRemove = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    removeBg(canvas, image, bgThreshold, bgPickedColor);
    canvas.toBlob(blob => { if (blob) loadImage(blob); }, 'image/png');
  };

  const hexToRgb = (hex: string): [number, number, number] | null => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : null;
  };

  return (
    <>
      <PanelLabel>Settings</PanelLabel>
      <Slider label="Sensitivity" value={bgThreshold} min={1} max={150}
        onStart={pushHistory}
        onChange={setBgThreshold} unit="" />

      <PanelLabel>Background Color</PanelLabel>
      <div style={{ padding:'6px 14px 10px', borderBottom:'1px solid var(--border)' }}>
        <label style={{ fontSize:12, color:'var(--text2)', display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:8 }}>
          <input type="checkbox" checked={bgPickedColor !== null}
            onChange={e => setBgColor(e.target.checked ? [255,255,255] : null)}
            style={{ accentColor:'var(--accent)' }} />
          Set color manually
        </label>
        {bgPickedColor && (
          <input ref={colorRef} type="color" defaultValue="#ffffff"
            onChange={e => { const rgb = hexToRgb(e.target.value); if (rgb) setBgColor(rgb); }}
            style={{ width:'100%', height:32, borderRadius:8, border:'1px solid var(--border)', cursor:'pointer' }} />
        )}
      </div>

      <div style={{ padding:'10px 12px' }}>
        <button onClick={handleRemove} disabled={!image} style={{
          width:'100%', padding:'10px', borderRadius:10, border:'none',
          background: image ? 'rgba(108,248,168,0.12)' : 'var(--surface2)',
          color: image ? 'var(--green)' : 'var(--text3)',
          borderColor: 'rgba(108,248,168,0.2)', fontSize:13, fontWeight:600, cursor: image ? 'pointer' : 'not-allowed',
        }}>
          ✨ Remove BG
        </button>
      </div>

      <div style={{ padding:'8px 14px', fontSize:11, color:'var(--text3)', lineHeight:1.6, borderTop:'1px solid var(--border)' }}>
        The algorithm samples the 4 corners and removes pixels of similar color. Works best with solid backgrounds.
      </div>
      <div style={{ padding:'0 12px 10px' }}>
        <button onClick={() => { setBgColor(null); restoreSource(); }} style={{ width:'100%', padding:'7px', border:'1px solid var(--border)', borderRadius:8, background:'none', color:'var(--text3)', fontSize:11, cursor:'pointer' }}>
          ↺ Restore Original
        </button>
      </div>
    </>
  );
};

export default BgRemovePanel;
