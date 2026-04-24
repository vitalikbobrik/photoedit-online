import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';

const EraserPanel: React.FC = () => {
  const { eraserSize, setEraserSize } = useEditorStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 14px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase' }}>
        Eraser
      </div>
      <Slider label="Size" value={eraserSize} min={5} max={300} unit="px" onChange={setEraserSize} />
      <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        Drag to erase · Scroll to zoom<br />
        Alt+drag or middle mouse to pan
      </div>
    </div>
  );
};

export default EraserPanel;
