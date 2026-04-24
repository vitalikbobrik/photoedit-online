import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { renderToCanvas, renderBaseToCanvas } from '../core/renderer';
import { editorCanvasRef } from '../editorCanvasRef';
import DropZone from './DropZone';
import CropOverlay from './CropOverlay';

const CanvasEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const state = useEditorStore();
  const {
    image, version, activeTool,
    zoom: storeZoom, panX: storePanX, panY: storePanY,
    setView, eraserSize, setEraserSize, pushHistory, bakeErase,
  } = state;

  const [zoom, setZoom] = useState(storeZoom);
  const [panX, setPanX] = useState(storePanX);
  const [panY, setPanY] = useState(storePanY);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const isPanning = useRef(false);
  const panOrigin = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Eraser
  const eraserIsDrawing = useRef(false);
  const lastErasePosRef = useRef<{ x: number; y: number } | null>(null);
  const historyPushed = useRef(false);
  const eraserMaskRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  // Keep a stable ref to state for use inside async callbacks
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // Re-render pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    renderToCanvas(canvas, state);
    editorCanvasRef.current = canvas;
    // Reset eraser mask dimensions when canvas changes size
    if (eraserMaskRef.current.width !== canvas.width || eraserMaskRef.current.height !== canvas.height) {
      eraserMaskRef.current.width = canvas.width;
      eraserMaskRef.current.height = canvas.height;
    }
  }, [version, image]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit to view on image load
  useEffect(() => {
    if (!image || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const iw = canvasRef.current?.width || image.width;
    const ih = canvasRef.current?.height || image.height;
    const fit = Math.min(1, (cw - 80) / iw, (ch - 80) / ih);
    setZoom(fit); setPanX(0); setPanY(0);
    setView(fit, 0, 0);
    eraserMaskRef.current.width = 0;
    eraserMaskRef.current.height = 0;
  }, [image]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom
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

  // Screen → canvas pixel coords
  const screenToCanvas = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return null;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - (rect.left + rect.width / 2);
    const my = e.clientY - (rect.top + rect.height / 2);
    return {
      x: (mx - panX) / zoom + canvas.width / 2,
      y: (my - panY) / zoom + canvas.height / 2,
    };
  }, [panX, panY, zoom]);

  // Draw erase stroke on both the display canvas and the mask
  const eraseAtPos = useCallback((pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const mask = eraserMaskRef.current;
    if (!canvas) return;

    // Ensure mask matches canvas size
    if (mask.width !== canvas.width || mask.height !== canvas.height) {
      mask.width = canvas.width;
      mask.height = canvas.height;
    }

    const last = lastErasePosRef.current;
    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = eraserSize;
      if (last) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw on mask (opaque black = areas to erase)
    const mCtx = mask.getContext('2d')!;
    mCtx.fillStyle = '#000';
    mCtx.strokeStyle = '#000';
    draw(mCtx);

    // Draw on display canvas for immediate feedback
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    draw(ctx);
    ctx.globalCompositeOperation = 'source-over';

    lastErasePosRef.current = pos;
  }, [eraserSize]);

  // Bake eraser strokes into image on stroke end
  const commitErase = useCallback(() => {
    const st = stateRef.current;
    const mask = eraserMaskRef.current;
    if (!mask.width) return;

    // Render base image (crop + rotation, no filters)
    const base = document.createElement('canvas');
    renderBaseToCanvas(base, st);

    // Apply erase mask
    const ctx = base.getContext('2d')!;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(mask, 0, 0, base.width, base.height);
    ctx.globalCompositeOperation = 'source-over';

    // Load as new image and bake into store
    const dataUrl = base.toDataURL('image/png');
    const newImg = new Image();
    newImg.onload = () => bakeErase(newImg, base.width, base.height);
    newImg.src = dataUrl;

    // Reset mask
    mask.width = 0;
    mask.height = 0;
    historyPushed.current = false;
  }, [bakeErase]);

  const onContextMenu = (e: React.MouseEvent) => {
    if (activeTool !== 'eraser' || !image) return;
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (contextMenu) { setContextMenu(null); return; }
    if (activeTool === 'eraser' && e.button === 0 && !e.altKey) {
      if (!historyPushed.current) {
        pushHistory();
        historyPushed.current = true;
      }
      eraserIsDrawing.current = true;
      lastErasePosRef.current = null;
      const pos = screenToCanvas(e);
      if (pos) eraseAtPos(pos);
      return;
    }
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      isPanning.current = true;
      panOrigin.current = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (activeTool === 'eraser') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setCursorPos(null);
    }

    if (eraserIsDrawing.current) {
      const pos = screenToCanvas(e);
      if (pos) eraseAtPos(pos);
      return;
    }

    if (!isPanning.current) return;
    const dx = e.clientX - panOrigin.current.x;
    const dy = e.clientY - panOrigin.current.y;
    const nx = panOrigin.current.px + dx;
    const ny = panOrigin.current.py + dy;
    setPanX(nx); setPanY(ny);
    setView(zoom, nx, ny);
  };

  const finishErase = () => {
    if (eraserIsDrawing.current) {
      eraserIsDrawing.current = false;
      lastErasePosRef.current = null;
      commitErase();
    }
    isPanning.current = false;
  };

  const onMouseLeave = () => {
    setCursorPos(null);
    finishErase();
  };

  const onDblClick = () => {
    if (!image || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const iw = canvasRef.current?.width || image.width;
    const ih = canvasRef.current?.height || image.height;
    const fit = Math.min(1, (cw - 80) / iw, (ch - 80) / ih);
    setZoom(fit); setPanX(0); setPanY(0);
    setView(fit, 0, 0);
  };

  const isEraser = activeTool === 'eraser';
  const eraserCursorSize = eraserSize * zoom;

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finishErase}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDblClick}
      onContextMenu={onContextMenu}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isEraser ? 'none' : 'default',
      }}
    >
      {/* Checkerboard background for transparency — outside the scaled div so tiles stay fixed size */}
      {isEraser && image && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(45deg,#ccc 25%,transparent 25%)',
            'linear-gradient(-45deg,#ccc 25%,transparent 25%)',
            'linear-gradient(45deg,transparent 75%,#ccc 75%)',
            'linear-gradient(-45deg,transparent 75%,#ccc 75%)',
          ].join(','),
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0,0 8px,8px -8px,-8px 0px',
          backgroundColor: '#fff',
        }} />
      )}

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
            style={{
              display: 'block', borderRadius: 4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          />
          {(activeTool === 'crop' || activeTool === 'circlecrop') && canvasRef.current && (
            <CropOverlay canvas={canvasRef.current} zoom={zoom} />
          )}
        </div>
      )}

      {/* Eraser cursor */}
      {isEraser && cursorPos && image && (
        <div style={{
          position: 'absolute',
          left: cursorPos.x - eraserCursorSize / 2,
          top: cursorPos.y - eraserCursorSize / 2,
          width: eraserCursorSize,
          height: eraserCursorSize,
          border: '1.5px solid rgba(255,255,255,0.9)',
          borderRadius: '50%',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Eraser right-click context menu */}
      {contextMenu && (
        <div onMouseDown={e => e.stopPropagation()} style={{
          position: 'absolute',
          left: contextMenu.x, top: contextMenu.y,
          background: 'var(--surface2)', border: '1px solid var(--border2)',
          borderRadius: 10, padding: '6px 0', minWidth: 180,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100,
        }}>
          <div style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Eraser size
          </div>
          {[5, 10, 20, 40, 80, 150, 300].map(size => (
            <button key={size} onClick={() => { setEraserSize(size); setContextMenu(null); }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '6px 14px', border: 'none', background: 'none',
              color: eraserSize === size ? 'var(--accent)' : 'var(--text)',
              cursor: 'pointer', fontSize: 13, textAlign: 'left',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,108,248,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{
                width: Math.min(size / 2, 24), height: Math.min(size / 2, 24),
                borderRadius: '50%', background: eraserSize === size ? 'var(--accent)' : 'var(--text3)',
                flexShrink: 0,
              }} />
              {size}px
              {eraserSize === size && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
          <div style={{ padding: '4px 14px 6px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Custom: {eraserSize}px</div>
            <input
              type="range" min={5} max={300} value={eraserSize}
              onChange={e => setEraserSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
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
