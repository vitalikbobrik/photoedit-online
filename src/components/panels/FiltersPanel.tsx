import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';
import { PRESETS } from '../../types';

const PRESET_LIST = [
  { id: 'none',   label: 'Original'   },
  { id: 'vivid',  label: 'Vivid'      },
  { id: 'fade',   label: 'Fade'       },
  { id: 'cold',   label: 'Cold'       },
  { id: 'warm',   label: 'Warm'       },
  { id: 'bwhc',   label: 'B&W Hi-Con' },
  { id: 'cinema', label: 'Cinema'     },
];

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const FiltersPanel: React.FC = () => {
  const { filters, setFilter, setAdjust, pushHistory } = useEditorStore();

  const applyPreset = (id: string) => {
    pushHistory();
    const p = PRESETS[id];
    if (!p) return;
    setFilter('grayscale', p.grayscale);
    setFilter('sepia',     p.sepia);
    setAdjust('brightness', p.brightness);
    setAdjust('contrast',   p.contrast);
    setAdjust('saturation', p.saturation);
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

      <PanelLabel>Filters</PanelLabel>
      <Slider label="B&W" value={filters.grayscale} min={0} max={100} unit="%"
        onStart={pushHistory}
        onChange={v => setFilter('grayscale', v)}
        onReset={() => setFilter('grayscale', 0)} />
      <Slider label="Sepia" value={filters.sepia} min={0} max={100} unit="%"
        onStart={pushHistory}
        onChange={v => setFilter('sepia', v)}
        onReset={() => setFilter('sepia', 0)} />
      <Slider label="Invert" value={filters.invert} min={0} max={100} unit="%"
        onStart={pushHistory}
        onChange={v => setFilter('invert', v)}
        onReset={() => setFilter('invert', 0)} />
      <Slider label="Blur" value={filters.blur} min={0} max={20} unit="px"
        onStart={pushHistory}
        onChange={v => setFilter('blur', v)}
        onReset={() => setFilter('blur', 0)} />
      <Slider label="Sharpen" value={filters.sharpen} min={0} max={5} step={0.1}
        onStart={pushHistory}
        onChange={v => setFilter('sharpen', v)}
        onReset={() => setFilter('sharpen', 0)} />
    </>
  );
};

export default FiltersPanel;
