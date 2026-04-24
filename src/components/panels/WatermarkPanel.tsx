import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import Slider from '../ui/Slider';

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding:'10px 14px 4px', fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--text3)' }}>
    {children}
  </div>
);

const COLORS = ['#ffffff','#000000','#7c6cf8','#f87c6c','#6cf8a8','#f8c86c'];

const POS_GRID = [
  ['↖','↑','↗'],
  ['←','✛','→'],
  ['↙','↓','↘'],
];
const POS_MAP: Record<string, [number, number]> = {
  '↖':[0.05,0.05],'↑':[0.5,0.05],'↗':[0.95,0.05],
  '←':[0.05,0.5], '✛':[0.5,0.5], '→':[0.95,0.5],
  '↙':[0.05,0.95],'↓':[0.5,0.95],'↘':[0.95,0.95],
};

const WatermarkPanel: React.FC = () => {
  const { watermark, setWatermark, pushHistory } = useEditorStore();
  const wm = watermark;

  const currentPos = Object.entries(POS_MAP).find(
    ([, [x, y]]) => Math.abs(x - wm.x) < 0.1 && Math.abs(y - wm.y) < 0.1
  )?.[0] ?? '✛';

  return (
    <>
      <PanelLabel>Watermark</PanelLabel>
      <div style={{ padding:'6px 14px', borderBottom:'1px solid var(--border)' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
          <input type="checkbox" checked={wm.enabled}
            onChange={e => setWatermark({ enabled: e.target.checked })}
            style={{ accentColor:'var(--accent)', cursor:'pointer' }} />
          Enable
        </label>
      </div>

      <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)' }}>
        <input type="text" value={wm.text} onChange={e => setWatermark({ text: e.target.value })}
          style={{
            width:'100%', padding:'7px 10px', background:'var(--surface2)',
            border:'1px solid var(--border)', borderRadius:8, color:'var(--text)',
            fontSize:13, outline:'none',
          }} />
      </div>

      <Slider label="Font Size" value={wm.fontSize} min={8} max={120}
        onStart={pushHistory}
        onChange={v => setWatermark({ fontSize: v })} unit="px" />
      <Slider label="Opacity" value={wm.opacity} min={0} max={100}
        onStart={pushHistory}
        onChange={v => setWatermark({ opacity: v })} unit="%" />
      <Slider label="Rotation" value={wm.rotation} min={-180} max={180}
        onStart={pushHistory}
        onChange={v => setWatermark({ rotation: v })} unit="°" />

      <PanelLabel>Position</PanelLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, padding:'4px 14px 10px' }}>
        {POS_GRID.flat().map(sym => (
          <button key={sym} onClick={() => { const [x,y]=POS_MAP[sym]; setWatermark({ x, y }); }}
            style={{
              padding:'8px', borderRadius:8, border:'1px solid',
              borderColor: currentPos === sym ? 'rgba(124,108,248,0.4)' : 'var(--border)',
              background: currentPos === sym ? 'rgba(124,108,248,0.15)' : 'var(--surface2)',
              color: currentPos === sym ? 'var(--accent)' : 'var(--text3)',
              fontSize:13, cursor:'pointer',
            }}>{sym}</button>
        ))}
      </div>

      <PanelLabel>Text Color</PanelLabel>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', padding:'6px 14px 12px' }}>
        {COLORS.map(c => (
          <div key={c} onClick={() => setWatermark({ color: c })} style={{
            width:26, height:26, borderRadius:7, background:c, cursor:'pointer',
            border: wm.color === c ? '2px solid var(--accent)' : '2px solid transparent',
            boxShadow: wm.color === c ? '0 0 8px var(--accent-glow)' : 'none',
            transition:'all .15s',
          }} />
        ))}
        <input type="color" value={wm.color} onChange={e => setWatermark({ color: e.target.value })}
          title="Custom color"
          style={{ width:26, height:26, borderRadius:7, border:'2px solid var(--border)', cursor:'pointer', padding:0 }} />
      </div>
    </>
  );
};

export default WatermarkPanel;
