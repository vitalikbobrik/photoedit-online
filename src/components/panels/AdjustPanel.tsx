import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';
import { PRESETS } from '../../types';

const PRESET_LIST = [
  { id: 'none',   label: 'Original' },
  { id: 'vivid',  label: 'Vivid'    },
  { id: 'fade',   label: 'Fade'     },
  { id: 'cold',   label: 'Cold'     },
  { id: 'warm',   label: 'Warm'     },
  { id: 'bwhc',   label: 'B&W'      },
  { id: 'cinema', label: 'Cinema'   },
];

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const AdjustPanel: React.FC = () => {
  const { adjustments, setAdjust, setFilter, pushHistory } = useEditorStore();

  const applyPreset = (id: string) => {
    pushHistory();
    const p = PRESETS[id];
    if (!p) return;
    setAdjust('brightness', p.brightness);
    setAdjust('contrast',   p.contrast);
    setAdjust('saturation', p.saturation);
    setFilter('grayscale',  p.grayscale);
    setFilter('sepia',      p.sepia);
  };

  return (
    <>
      <PanelLabel>Presets</PanelLabel>
      <div style={{ padding:'4px 12px 8px' }}>
        {PRESET_LIST.map(p => (
          <button key={p.id} onClick={() => applyPreset(p.id)} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            width:'100%', padding:'8px 10px', border:'none',
            borderBottom:'1px solid var(--border)', background:'none',
            color:'var(--text2)', fontSize:12, cursor:'pointer', textAlign:'left',
          }}>
            {p.label}
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--surface3)', flexShrink:0 }} />
          </button>
        ))}
      </div>

      <PanelLabel>Adjustments</PanelLabel>
      <Slider label="Brightness" value={adjustments.brightness} min={-100} max={100}
        onStart={pushHistory}
        onChange={v => setAdjust('brightness', v)}
        onReset={() => setAdjust('brightness', 0)} />
      <Slider label="Contrast" value={adjustments.contrast} min={-100} max={100}
        onStart={pushHistory}
        onChange={v => setAdjust('contrast', v)}
        onReset={() => setAdjust('contrast', 0)} />
      <Slider label="Saturation" value={adjustments.saturation} min={-100} max={100}
        onStart={pushHistory}
        onChange={v => setAdjust('saturation', v)}
        onReset={() => setAdjust('saturation', 0)} />

      <div style={{ padding:'10px 12px' }}>
        <button onClick={() => {
          pushHistory();
          setAdjust('brightness',0); setAdjust('contrast',0); setAdjust('saturation',0);
        }} style={{ width:'100%', padding:'8px', border:'1px solid var(--border)', borderRadius:10, background:'none', color:'var(--text3)', fontSize:12, cursor:'pointer' }}>
          ↺ Reset All
        </button>
      </div>
    </>
  );
};

export default AdjustPanel;
