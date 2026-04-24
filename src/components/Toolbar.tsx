import React from 'react';
import { useEditorStore } from '../store/editorStore';
import type { Tool } from '../types';

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'crop',      icon: '✂️',  label: 'Crop'      },
  { id: 'circlecrop',icon: '⭕',   label: 'Circle'    },
  { id: 'filters',   icon: '🎞️',  label: 'Filters'   },
  { id: 'adjust',    icon: '🎚️',  label: 'Adjust'    },
  { id: 'effects',   icon: '✨',   label: 'Effects'   },
  { id: 'bgremove',  icon: '🪄',   label: 'BG'        },
  { id: 'watermark', icon: '💧',   label: 'Watermark' },
  { id: 'resize',    icon: '↔️',  label: 'Resize'    },
  { id: 'export',    icon: '📤',   label: 'Export'    },
];

const Toolbar: React.FC = () => {
  const { activeTool, setTool } = useEditorStore();

  return (
    <div style={{
      width: 64, background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2,
      flexShrink: 0, overflowY: 'auto',
    }}>
      {TOOLS.map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setTool(t.id)}
          style={{
            width: 48, height: 48, borderRadius: 10,
            border: activeTool === t.id ? '1px solid rgba(124,108,248,0.5)' : '1px solid transparent',
            background: activeTool === t.id ? 'rgba(124,108,248,0.15)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, cursor: 'pointer', transition: 'all .15s',
          }}
        >
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 9, color: activeTool === t.id ? 'var(--accent)' : 'var(--text3)', fontWeight: 600 }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
