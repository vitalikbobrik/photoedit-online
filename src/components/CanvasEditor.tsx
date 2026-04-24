import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { renderToCanvas } from '../core/renderer';
import DropZone from './DropZone';
import CropOverlay from './CropOverlay';

const CanvasEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const state = useEditorStore();
  const { image, version, activeTool, zoom: storeZoom, panX: storePanX, panY: storePanY, setView } = state;

  const [zoom, setZoom] = useState(storeZoom);
  const [panX, setPanX] = useState(storePanX);
  const [panY, setPanY] = useState(storePanY);

  const isPanning = useRef(false);
  const panOrigin = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Re-render pipeline on state change
  useEffect(() => {
    if (!canvasRef.current || !image) return;
    renderToCanvas(canvasRef.current, state);
  }, [version, image]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit to view when image loads
  useEffect(() => {
    if (!image || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const iw = canvasRef.current?.width || image.width;
    const ih = canvasRef.current?.height || image.height;
    const fit = Math.min(1, (cw - 80) / iw, (ch - 80) / ih);
    setZoom(fit);
    setPanX(0);
    setPanY(0);
    setView(fit, 0, 0);
  }, [image]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom (toward cursor)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => {
      const nz = Math.max(0.05, Math.min(20, z * factor));
      setView(nz, panX, panY);
      return nz;
    });
  }, [panX, panY, setView]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pan: middle mouse or Space+drag
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      isPanning.current = true;
      panOrigin.current = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panOrigin.current.x;
    const dy = e.clientY - panOrigin.current.y;
    const nx = panOrigin.current.px + dx;
    const ny = panOrigin.current.py + dy;
    setPanX(nx); setPanY(ny);
    setView(zoom, nx, ny);
  };
  const onMouseUp = () => { isPanning.current = false; };

  // Double-click to reset view
  const onDblClick = () => {
    if (!image || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const iw = canvasRef.current?.width || image.width;
    const ih = canvasRef.current?.height || image.height;
    const fit = Math.min(1, (cw - 80) / iw, (ch - 80) / ih);
    setZoom(fit); setPanX(0); setPanY(0);
    setView(fit, 0, 0);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDoubleClick={onDblClick}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isPanning.current ? 'grabbing' : 'default',
      }}
    >
      {!image ? (
        <DropZone />
      ) : (
        <div
          style={{
            position: 'relative',
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          />
          {(activeTool === 'crop' || activeTool === 'circlecrop') && canvasRef.current && (
            <CropOverlay canvas={canvasRef.current} zoom={zoom} />
          )}
        </div>
      )}

      {/* Zoom indicator */}
      {image && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(17,17,24,0.8)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border2)', borderRadius: 100, padding: '4px 14px',
          fontSize: 11, color: 'var(--text3)', pointerEvents: 'none',
        }}>
          {Math.round(zoom * 100)}% · {canvasRef.current?.width ?? 0} × {canvasRef.current?.height ?? 0} px · double-click to fit
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
