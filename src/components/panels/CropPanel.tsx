import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';
import type { AspectRatio } from '../../types';

const ASPECTS: { id: AspectRatio; label: string }[] = [
  { id: 'free',  label: 'Free'  },
  { id: '1:1',   label: '1 : 1' },
  { id: '4:3',   label: '4 : 3' },
  { id: '3:4',   label: '3 : 4' },
  { id: '16:9',  label: '16:9'  },
  { id: '9:16',  label: '9:16'  },
  { id: '2:3',   label: '2 : 3' },
];

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const Btn: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid',
    borderColor: active ? 'rgba(124,108,248,0.4)' : 'var(--border)',
    background: active ? 'rgba(124,108,248,0.15)' : 'var(--surface2)',
    color: active ? 'var(--accent)' : 'var(--text3)',
    fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
  }}>{children}</button>
);

const CropPanel: React.FC = () => {
  const { cropAspect, setCropAspect, resetCrop, rotate90, flipH, flipV, pushHistory, triggerCrop, effects, setEffect } = useEditorStore();

  return (
    <>
      <PanelLabel>Aspect Ratio</PanelLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, padding:'4px 14px 10px' }}>
        {ASPECTS.map(a => (
          <Btn key={a.id} active={cropAspect === a.id} onClick={() => setCropAspect(a.id)}>
            {a.label}
          </Btn>
        ))}
      </div>

      <PanelLabel>Transform</PanelLabel>
      {[
        { label: '↻ Rotate 90°', fn: () => { pushHistory(); rotate90(); } },
        { label: '⇄ Flip H',     fn: () => flipH() },
        { label: '⇅ Flip V',     fn: () => flipV() },
      ].map(({ label, fn }) => (
        <button key={label} onClick={fn} style={{
          display:'block', width:'100%', textAlign:'left', padding:'9px 14px',
          background:'none', border:'none', borderBottom:'1px solid var(--border)',
          color:'var(--text2)', fontSize:13, cursor:'pointer',
        }}>{label}</button>
      ))}

      <PanelLabel>Corner Radius</PanelLabel>
      <Slider
        label="Radius"
        value={effects.roundedCorners}
        min={0} max={300} unit="px"
        onStart={pushHistory}
        onChange={v => setEffect('roundedCorners', v)}
        onReset={() => setEffect('roundedCorners', 0)}
      />

      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
        <button onClick={triggerCrop} style={{
          width:'100%', padding:'10px', border:'none',
          borderRadius:10, background:'var(--accent)', color:'#fff',
          fontSize:13, fontWeight:700, cursor:'pointer',
          boxShadow:'0 0 16px var(--accent-glow)',
        }}>✂️ Crop</button>
        <button onClick={resetCrop} style={{
          width:'100%', padding:'8px', border:'1px solid var(--border)',
          borderRadius:10, background:'none', color:'var(--text3)',
          fontSize:12, cursor:'pointer',
        }}>↺ Reset Crop</button>
      </div>
    </>
  );
};

export default CropPanel;
