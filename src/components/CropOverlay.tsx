import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { CropRect, AspectRatio } from '../types';

interface Props { canvas: HTMLCanvasElement; zoom: number; }
type Handle = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'move';
const MIN = 20;

function clampRect(r: CropRect, W: number, H: number): CropRect {
  let { x, y, width, height } = r;
  width  = Math.max(MIN, width);
  height = Math.max(MIN, height);
  x = Math.max(0, Math.min(x, W - width));
  y = Math.max(0, Math.min(y, H - height));
  width  = Math.min(width, W - x);
  height = Math.min(height, H - y);
  return { x, y, width, height };
}

function aspectOf(a: AspectRatio): number | null {
  const m: Record<string, number> = { '1:1': 1, '4:3': 4/3, '3:4': 3/4, '16:9': 16/9, '9:16': 9/16, '2:3': 2/3 };
  return m[a] ?? null;
}

const CropOverlay: React.FC<Props> = ({ canvas, zoom }) => {
  const {
    crop, cropAspect, cropCircular, effects, setCrop, pushHistory, bump,
    cropTrigger, circleRadius, setCircleRadius,
  } = useEditorStore();
  const W = canvas.width;
  const H = canvas.height;

  const initRect: CropRect = crop.width > 0 ? crop : { x: 0, y: 0, width: W, height: H };
  const [rect, setRect] = useState<CropRect>(initRect);

  // Refs for stale-closure-safe event handlers
  const rectRef          = useRef(rect);
  const aspectRef        = useRef(cropAspect);
  const zoomRef          = useRef(zoom);
  const dimRef           = useRef({ W, H });
  const circularRef      = useRef(cropCircular);   // tracks "was already circular"
  const cropCircularLive = useRef(cropCircular);   // always-current value for drag handler
  const setCircleRadiusRef = useRef(setCircleRadius);

  useEffect(() => { rectRef.current          = rect;           }, [rect]);
  useEffect(() => { aspectRef.current        = cropAspect;     }, [cropAspect]);
  useEffect(() => { zoomRef.current          = zoom;           }, [zoom]);
  useEffect(() => { dimRef.current           = { W, H };       }, [W, H]);
  useEffect(() => { cropCircularLive.current = cropCircular;   }, [cropCircular]);
  useEffect(() => { setCircleRadiusRef.current = setCircleRadius; }, [setCircleRadius]);

  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; startRect: CropRect } | null>(null);

  // Sync rect when committed crop changes
  useEffect(() => {
    const r = clampRect(
      crop.width > 0 ? crop : { x: 0, y: 0, width: W, height: H },
      W, H
    );
    setRect(r);
    rectRef.current = r;
  }, [crop, W, H]);

  // Apply aspect ratio immediately when user picks one (skip first render)
  const isFirstAspectRender = useRef(true);
  useEffect(() => {
    if (isFirstAspectRender.current) { isFirstAspectRender.current = false; return; }
    if (cropCircular) return;
    const ar = aspectOf(cropAspect);
    if (!ar) return;
    const { W: w, H: h } = dimRef.current;
    let fw = w, fh = fw / ar;
    if (fh > h) { fh = h; fw = fh * ar; }
    fw = Math.round(fw); fh = Math.round(fh);
    const nr = clampRect({ x: Math.round((w - fw) / 2), y: Math.round((h - fh) / 2), width: fw, height: fh }, w, h);
    setRect(nr);
    rectRef.current = nr;
  }, [cropAspect]); // eslint-disable-line react-hooks/exhaustive-deps

  // When cropCircular turns ON: snap rect to square and init radius
  useEffect(() => {
    if (!cropCircular) { circularRef.current = false; return; }
    if (circularRef.current) return;
    circularRef.current = true;
    const { W: w, H: h } = dimRef.current;
    const s  = Math.round(Math.min(rectRef.current.width, rectRef.current.height) / 2);
    setCircleRadius(s);
    const d  = s * 2;
    const cx = rectRef.current.x + rectRef.current.width  / 2;
    const cy = rectRef.current.y + rectRef.current.height / 2;
    const nr = clampRect({ x: cx - s, y: cy - s, width: d, height: d }, w, h);
    setRect(nr);
    rectRef.current = nr;
  });

  // When circleRadius changes from slider (0 = reset/reinitialise)
  const prevRadiusRef = useRef(circleRadius);
  useEffect(() => {
    if (!cropCircular) { prevRadiusRef.current = circleRadius; return; }
    if (circleRadius === 0) {
      prevRadiusRef.current = 0;
      circularRef.current   = false;
      return;
    }
    if (circleRadius === prevRadiusRef.current) return;
    prevRadiusRef.current = circleRadius;
    const { W: w, H: h } = dimRef.current;
    const d  = circleRadius * 2;
    const cx = rectRef.current.x + rectRef.current.width  / 2;
    const cy = rectRef.current.y + rectRef.current.height / 2;
    const nr = clampRect({ x: cx - circleRadius, y: cy - circleRadius, width: d, height: d }, w, h);
    setRect(nr);
    rectRef.current = nr;
  });

  const startDrag = useCallback((e: React.MouseEvent, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startRect: { ...rectRef.current } };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { handle, startX, startY, startRect: sr } = dragRef.current;
      const z  = zoomRef.current;
      const { W: w, H: h } = dimRef.current;
      const dx = (e.clientX - startX) / z;
      const dy = (e.clientY - startY) / z;
      let nr: CropRect = { ...sr };

      if (handle === 'move') {
        nr.x = sr.x + dx;
        nr.y = sr.y + dy;
        nr = clampRect(nr, w, h);
      } else if (cropCircularLive.current) {
        // Circle resize: maintain center, change radius
        const cx = sr.x + sr.width  / 2;
        const cy = sr.y + sr.height / 2;
        let newR: number;
        if      (handle === 'n') newR = sr.height / 2 - dy;
        else if (handle === 's') newR = sr.height / 2 + dy;
        else if (handle === 'e') newR = sr.width  / 2 + dx;
        else                     newR = sr.width  / 2 - dx; // 'w'
        const maxR = Math.min(cx, cy, w - cx, h - cy);
        const r = Math.max(MIN / 2, Math.min(newR, maxR));
        nr = clampRect({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 }, w, h);
        setCircleRadiusRef.current(Math.round(r));
      } else {
        // Rectangular resize
        if (handle.includes('w')) { nr.x = sr.x + dx; nr.width  = sr.width  - dx; }
        if (handle.includes('e')) { nr.width  = sr.width  + dx; }
        if (handle.includes('n')) { nr.y = sr.y + dy; nr.height = sr.height - dy; }
        if (handle.includes('s')) { nr.height = sr.height + dy; }
        const ar = aspectOf(aspectRef.current);
        if (ar) {
          const byH = handle.includes('n') || handle.includes('s');
          if (byH) nr.width = nr.height * ar; else nr.height = nr.width / ar;
        }
        nr = clampRect(nr, w, h);
      }

      setRect(nr);
      rectRef.current = nr;
    };

    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const apply = () => { pushHistory(); setCrop(rect); bump(); };

  const cropTriggerRef = useRef(cropTrigger);
  useEffect(() => {
    if (cropTrigger !== cropTriggerRef.current) {
      cropTriggerRef.current = cropTrigger;
      apply();
    }
  });

  const { x, y, width, height } = rect;
  const cornerR = Math.min(effects.roundedCorners, Math.floor(width / 2), Math.floor(height / 2));

  const hStyle = (
    cursor: string,
    top: number | string, left: number | string,
    bottom?: number | string, right?: number | string,
  ): React.CSSProperties => ({
    position: 'absolute', width: 14, height: 14,
    background: '#fff', border: '2px solid var(--accent)',
    borderRadius: 3, cursor, zIndex: 5,
    top: top as string, left: left as string,
    ...(bottom !== undefined ? { top: 'auto', bottom: bottom as string } : {}),
    ...(right  !== undefined ? { left: 'auto', right: right as string } : {}),
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

      {/* ── Dimming layer ── */}
      {cropCircular ? (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', left: x, top: y, width, height,
            borderRadius: '50%',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }} />
        </div>
      ) : (
        <>
          <div style={{ position:'absolute', top:0, left:0, right:0, height: y, background:'rgba(0,0,0,0.55)' }} />
          <div style={{ position:'absolute', top: y+height, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)' }} />
          <div style={{ position:'absolute', top: y, left:0, width: x, height, background:'rgba(0,0,0,0.55)' }} />
          <div style={{ position:'absolute', top: y, left: x+width, right:0, height, background:'rgba(0,0,0,0.55)' }} />
        </>
      )}

      {/* ── Crop frame ── */}
      <div
        onMouseDown={e => startDrag(e, 'move')}
        style={{
          position: 'absolute', left: x, top: y, width, height,
          border: '2px solid rgba(255,255,255,0.9)',
          cursor: 'move', pointerEvents: 'all',
          borderRadius: cropCircular ? '50%' : `${cornerR}px`,
          boxSizing: 'border-box',
        }}
      >
        {/* Rule-of-thirds grid (rectangular only) */}
        {!cropCircular && [1/3, 2/3].map(t => (
          <React.Fragment key={t}>
            <div style={{ position:'absolute', top:`${t*100}%`, left:0, right:0, height:1, background:'rgba(255,255,255,0.2)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', left:`${t*100}%`, top:0, bottom:0, width:1, background:'rgba(255,255,255,0.2)', pointerEvents:'none' }} />
          </React.Fragment>
        ))}

        {/* Rectangular resize handles */}
        {!cropCircular && <>
          <div style={hStyle('nw-resize', -7, -7)}                         onMouseDown={e => startDrag(e,'nw')} />
          <div style={hStyle('ne-resize', -7, 'auto', undefined, '-7px')}  onMouseDown={e => startDrag(e,'ne')} />
          <div style={hStyle('sw-resize', 'auto', -7, '-7px')}             onMouseDown={e => startDrag(e,'sw')} />
          <div style={hStyle('se-resize', 'auto', 'auto', '-7px', '-7px')} onMouseDown={e => startDrag(e,'se')} />
          <div style={{ ...hStyle('n-resize', -7, '50%'), transform:'translateX(-50%)' }}             onMouseDown={e => startDrag(e,'n')} />
          <div style={{ ...hStyle('s-resize', 'auto', '50%', '-7px'), transform:'translateX(-50%)' }} onMouseDown={e => startDrag(e,'s')} />
          <div style={{ ...hStyle('w-resize', '50%', -7), transform:'translateY(-50%)' }}             onMouseDown={e => startDrag(e,'w')} />
          <div style={{ ...hStyle('e-resize', '50%', 'auto', undefined, '-7px'), transform:'translateY(-50%)' }} onMouseDown={e => startDrag(e,'e')} />
        </>}

        {/* Circle resize handles — 4 edges only */}
        {cropCircular && <>
          <div style={{ ...hStyle('ns-resize', -7, '50%'), transform:'translateX(-50%)' }}             onMouseDown={e => startDrag(e,'n')} />
          <div style={{ ...hStyle('ns-resize', 'auto', '50%', '-7px'), transform:'translateX(-50%)' }} onMouseDown={e => startDrag(e,'s')} />
          <div style={{ ...hStyle('ew-resize', '50%', -7), transform:'translateY(-50%)' }}             onMouseDown={e => startDrag(e,'w')} />
          <div style={{ ...hStyle('ew-resize', '50%', 'auto', undefined, '-7px'), transform:'translateY(-50%)' }} onMouseDown={e => startDrag(e,'e')} />
        </>}
      </div>

      {/* ── Dimensions badge ── */}
      <div style={{
        position:'absolute', left: x + width/2, top: y - 52,
        transform:'translateX(-50%)', pointerEvents:'none',
        background:'rgba(0,0,0,0.78)', borderRadius:10,
        padding:'8px 20px', fontSize:22, fontWeight:700, color:'#fff',
        whiteSpace:'nowrap', letterSpacing:'0.5px',
        boxShadow:'0 2px 12px rgba(0,0,0,0.5)',
      }}>
        {cropCircular ? `⌀ ${Math.round(width)}` : `${Math.round(width)} × ${Math.round(height)}`}
      </div>

      {/* ── Apply button ── */}
      <button
        onClick={apply}
        style={{
          position:'absolute', pointerEvents:'all',
          top: y + height + 18, left: x + width / 2,
          transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 14, padding: '16px 48px', fontSize: 22, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 6px 28px var(--accent-glow)',
          letterSpacing: '0.4px',
        }}
      >
        {cropCircular ? '⭕ Crop Circle' : '✂️ Crop'}
      </button>
    </div>
  );
};

export default CropOverlay;
