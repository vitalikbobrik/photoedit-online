import React, { useEffect } from 'react';
import TopBar from './components/TopBar';
import Toolbar from './components/Toolbar';
import CanvasEditor from './components/CanvasEditor';
import SettingsPanel from './components/SettingsPanel';
import { useEditorStore } from './store/editorStore';
import { pasteImageFromClipboard } from './utils/download';

const App: React.FC = () => {
  const loadImage = useEditorStore(s => s.loadImage);
  const image = useEditorStore(s => s.image);

  // Ctrl+V paste
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) { await loadImage(file); return; }
        }
      }
      // Fallback: try Clipboard API
      const file = await pasteImageFromClipboard();
      if (file) loadImage(file);
    };
    document.addEventListener('paste', handler as unknown as EventListener);
    return () => document.removeEventListener('paste', handler as unknown as EventListener);
  }, [loadImage]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <TopBar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <div style={{
          width: image ? 64 : 0, overflow: 'hidden', flexShrink: 0,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
          opacity: image ? 1 : 0,
        }}>
          <Toolbar />
        </div>
        <CanvasEditor />
        <div style={{
          width: image ? 220 : 0, overflow: 'hidden', flexShrink: 0,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
          opacity: image ? 1 : 0,
        }}>
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
