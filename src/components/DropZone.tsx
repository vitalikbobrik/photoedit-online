import React, { useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';

const DropZone: React.FC = () => {
  const loadImage = useEditorStore(s => s.loadImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      style={{
        position: 'absolute', inset: 20,
        border: `1.5px dashed ${drag ? 'var(--accent)' : 'rgba(124,108,248,0.3)'}`,
        borderRadius: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        cursor: 'pointer', transition: 'all .25s',
        background: drag ? 'rgba(124,108,248,0.08)' : 'rgba(124,108,248,0.03)',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 72, height: 72, background: 'var(--surface2)',
        border: '1px solid var(--border2)', borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
      }}>🖼️</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drop photo here</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>or click to select a file</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>JPG · PNG · WEBP · or Ctrl+V</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); e.target.value=''; }} />
    </div>
  );
};

export default DropZone;
