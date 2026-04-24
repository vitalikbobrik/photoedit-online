import React from 'react';
import { useEditorStore } from '../store/editorStore';
import CropPanel from './panels/CropPanel';
import CircleCropPanel from './panels/CircleCropPanel';
import FiltersPanel from './panels/FiltersPanel';
import AdjustPanel from './panels/AdjustPanel';
import EffectsPanel from './panels/EffectsPanel';
import EraserPanel from './panels/EraserPanel';
import BgRemovePanel from './panels/BgRemovePanel';
import WatermarkPanel from './panels/WatermarkPanel';
import ResizePanel from './panels/ResizePanel';
import ExportPanel from './panels/ExportPanel';

const PANEL_MAP: Record<string, React.FC> = {
  crop: CropPanel,
  circlecrop: CircleCropPanel,
  eraser: EraserPanel,
  filters: FiltersPanel,
  adjust: AdjustPanel,
  effects: EffectsPanel,
  bgremove: BgRemovePanel,
  watermark: WatermarkPanel,
  resize: ResizePanel,
  export: ExportPanel,
};

const SettingsPanel: React.FC = () => {
  const activeTool = useEditorStore(s => s.activeTool);
  const Panel = PANEL_MAP[activeTool];

  return (
    <div style={{
      width: 220, background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
    }}>
      {Panel ? <Panel /> : null}
    </div>
  );
};

export default SettingsPanel;
