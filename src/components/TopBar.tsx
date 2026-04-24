import React, { useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { downloadCanvas } from '../utils/download';
import { renderToCanvas } from '../core/renderer';

const S: Record<string, React.CSSProperties> = {
  bar: {
    height: 52, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0, zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    paddingRight: 16, borderRight: '1px solid var(--border)', marginRight: 4,
  },
  mark: {
    width: 28, height: 28, background: 'var(--accent)', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, color: '#fff', boxShadow: '0 0 16px var(--accent-glow)',
  },
  logoTxt: { fontSize: 15, fontWeight: 700, letterSpacing: -0.3 },
  spacer: { flex: 1 },
  iconBtn: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '6px 10px', color: 'var(--text2)',
    fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all .15s',
  },
  uploadBtn: {
    background: 'var(--accent)', border: 'none', borderRadius: 10,
    padding: '8px 16px', color: '#fff', fontWeight: 600, fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 0 20px var(--accent-glow)', transition: 'all .2s',
  },
  sep: { width: 1, height: 24, background: 'var(--border)', margin: '0 4px' },
};

const TopBar: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { image, past, future, undo, redo, loadImage, exportSettings, resetAll, fileName } = useEditorStore();
  const state = useEditorStore();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await loadImage(f);
    e.target.value = '';
  };

  const handleExport = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, state);
    downloadCanvas(canvas, exportSettings.format, exportSettings.quality, fileName);
  };

  return (
    <div style={S.bar}>
      <div style={S.logo}>
        <div style={S.mark}>P</div>
        <span style={S.logoTxt}>photo<span style={{ color:'var(--accent)' }}>edit</span>.online</span>
      </div>

      <button style={{ ...S.iconBtn, opacity: past.length ? 1 : 0.35 }} onClick={undo} title="Undo (Ctrl+Z)">
        ↩ Undo
      </button>
      <button style={{ ...S.iconBtn, opacity: future.length ? 1 : 0.35 }} onClick={redo} title="Redo (Ctrl+Y)">
        ↪ Redo
      </button>
      <button style={{ ...S.iconBtn, opacity: image ? 1 : 0.35 }} onClick={resetAll}>
        ↺ Reset
      </button>

      <div style={S.spacer} />

      <button style={S.iconBtn} onClick={() => fileRef.current?.click()}>
        + Upload
      </button>
      <div style={S.sep} />
      <button style={{ ...S.uploadBtn, opacity: image ? 1 : 0.4 }} onClick={handleExport}>
        ↓ Export
      </button>

      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
    </div>
  );
};

export default TopBar;
