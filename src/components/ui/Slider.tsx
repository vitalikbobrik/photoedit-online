import React from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onReset?: () => void;
  onStart?: () => void;  // called on mousedown — use for pushHistory
  unit?: string;
}

const Slider: React.FC<Props> = ({ label, value, min, max, step = 1, onChange, onReset, onStart, unit = '' }) => (
  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:7 }}>
      <span>{label}</span>
      <span style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ color:'var(--accent)', fontWeight:600 }}>{value}{unit}</span>
        {onReset && (
          <button onClick={() => { onStart?.(); onReset(); }} style={{
            background:'none', border:'none', color:'var(--text3)', fontSize:10,
            cursor:'pointer', padding:'0 2px',
          }} title="Сбросить">↺</button>
        )}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onMouseDown={() => onStart?.()}
      onChange={e => onChange(Number(e.target.value))}
    />
  </div>
);

export default Slider;
