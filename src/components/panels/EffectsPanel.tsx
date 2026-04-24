import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const EffectsPanel: React.FC = () => {
  const { effects, setEffect, pushHistory } = useEditorStore();

  return (
    <>
      <PanelLabel>Film Grain</PanelLabel>
      <Slider label="Intensity" value={effects.grain} min={0} max={100}
        onStart={pushHistory}
        onChange={v => setEffect('grain', v)} onReset={() => setEffect('grain', 0)} unit="%" />

      <PanelLabel>Vignette</PanelLabel>
      <div style={{ padding:'6px 14px', borderBottom:'1px solid var(--border)' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
          <input type="checkbox" checked={effects.vignetteEnabled}
            onChange={e => setEffect('vignetteEnabled', e.target.checked)}
            style={{ accentColor:'var(--accent)', cursor:'pointer' }} />
          Enable Vignette
        </label>
      </div>
      {effects.vignetteEnabled && (
        <>
          <Slider label="Radius" value={effects.vignetteRadius} min={0} max={100}
            onStart={pushHistory}
            onChange={v => setEffect('vignetteRadius', v)} unit="%" />
          <Slider label="Strength" value={effects.vignetteStrength} min={0} max={100}
            onStart={pushHistory}
            onChange={v => setEffect('vignetteStrength', v)} unit="%" />
        </>
      )}

      <PanelLabel>Pixelate</PanelLabel>
      <Slider label="Pixel Size" value={effects.pixelate} min={0} max={50}
        onStart={pushHistory}
        onChange={v => setEffect('pixelate', v)} onReset={() => setEffect('pixelate', 0)} unit="px" />

      <PanelLabel>Rounded Corners</PanelLabel>
      <Slider label="Radius" value={effects.roundedCorners} min={0} max={300}
        onStart={pushHistory}
        onChange={v => setEffect('roundedCorners', v)} onReset={() => setEffect('roundedCorners', 0)} unit="px" />

      <div style={{ padding:'10px 12px', marginTop:'auto' }}>
        <button onClick={() => {
          pushHistory();
          setEffect('grain', 0);
          setEffect('vignetteEnabled', false);
          setEffect('pixelate', 0);
          setEffect('roundedCorners', 0);
        }} style={{ width:'100%', padding:'8px', border:'1px solid var(--border)', borderRadius:10, background:'none', color:'var(--text3)', fontSize:12, cursor:'pointer' }}>
          ↺ Reset Effects
        </button>
      </div>
    </>
  );
};

export default EffectsPanel;
