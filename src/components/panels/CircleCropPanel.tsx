import React, { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const CircleCropPanel: React.FC = () => {
  const {
    setCropCircular, resetCrop, setCircleRadius,
    circleRadius, imageWidth, imageHeight, pushHistory, triggerCrop,
  } = useEditorStore();

  // Enable circle mode on mount, disable on unmount
  useEffect(() => {
    setCropCircular(true);
    return () => setCropCircular(false);
  }, [setCropCircular]);

  const maxRadius = Math.max(20, Math.floor(Math.min(imageWidth, imageHeight) / 2));
  const displayRadius = circleRadius > 0 ? circleRadius : Math.floor(maxRadius / 2);

  const handleReset = () => {
    resetCrop();
    setCircleRadius(0); // triggers reinitialisation in CropOverlay
  };

  return (
    <>
      <PanelLabel>Circle Crop</PanelLabel>
      <div style={{ padding:'6px 14px 10px', fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
        Drag the circle to reposition. Use the slider to resize.
      </div>

      <Slider
        label="Radius"
        value={displayRadius}
        min={20}
        max={maxRadius}
        unit="px"
        onStart={pushHistory}
        onChange={setCircleRadius}
      />

      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
        <button onClick={triggerCrop} style={{
          width:'100%', padding:'10px', border:'none',
          borderRadius:10, background:'var(--accent)', color:'#fff',
          fontSize:13, fontWeight:700, cursor:'pointer',
          boxShadow:'0 0 16px var(--accent-glow)',
        }}>⭕ Crop Circle</button>
        <button onClick={handleReset} style={{
          width:'100%', padding:'8px', border:'1px solid var(--border)',
          borderRadius:10, background:'none', color:'var(--text3)',
          fontSize:12, cursor:'pointer',
        }}>↺ Reset</button>
      </div>
    </>
  );
};

export default CircleCropPanel;
