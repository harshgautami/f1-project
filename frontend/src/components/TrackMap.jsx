import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from "react";

// Generic fallback loop (1000x600 viewBox) used only if a circuit can't be
// resolved — every current-calendar race maps to a real outline.
const FALLBACK =
  "M250 300 C250 170 420 140 560 180 C700 220 720 330 820 320 C900 312 900 440 760 435 C650 431 600 360 480 380 C360 400 300 470 250 300 Z";

/**
 * Renders a real F1 circuit outline (SVG path in a 1000x600 viewBox).
 *
 * Cars are placed by sampling the path with getPointAtLength every animation
 * frame from the live `carsRef` (not the throttled snapshot), so they follow
 * the actual curve and never cut corners — smooth and accurate at any speed.
 * A selected driver can be highlighted.
 */
export default function TrackMap({
  carsRef,
  snapshot = [],
  path,
  name,
  selectedId = null,
  onSelectCar,
}) {
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  const carNodes = useRef(new Map()); // id -> car <g> DOM node
  const d = path || FALLBACK;

  useLayoutEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [d]);

  // Point at a track fraction t in [0,1).
  const sample = useCallback(
    (t) => {
      const el = pathRef.current;
      if (!el || !len) return { x: 0, y: 0 };
      const p = el.getPointAtLength((((t % 1) + 1) % 1) * len);
      return { x: p.x, y: p.y };
    },
    [len],
  );

  // Per-frame placement loop. Runs continuously (also while paused/finished so
  // positions stay correct) and reads live distances straight from the ref.
  useEffect(() => {
    if (!len) return undefined;
    let raf;
    const draw = () => {
      const cars = carsRef?.current || [];
      for (const c of cars) {
        const node = carNodes.current.get(c.id);
        if (node) {
          const p = sample(c.dist);
          node.style.transform = `translate(${p.x}px, ${p.y}px)`;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [len, carsRef, sample]);

  // Leaders painted last (on top). Selected car always on top of all.
  const painted = [...snapshot].sort((a, b) => {
    if (a.id === selectedId) return 1;
    if (b.id === selectedId) return -1;
    return b.pos - a.pos;
  });

  return (
    <div className="track-wrap">
      <svg
        viewBox="0 0 1000 600"
        className="track-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <path ref={pathRef} d={d} fill="none" stroke="none" />
        <path d={d} className="track-asphalt" />
        <path d={d} className="track-line" />
        {len > 0 && (
          <g
            transform={`translate(${sample(0).x} ${sample(0).y})`}
            className="track-start"
          >
            <rect x="-3.5" y="-14" width="7" height="28" rx="1" />
          </g>
        )}

        {len > 0 &&
          painted.map((c) => {
            const isSel = c.id === selectedId;
            const dimmed = selectedId != null && !isSel;
            const p0 = sample(c.trackPos);
            return (
              <g
                key={c.id}
                ref={(el) => {
                  if (el) carNodes.current.set(c.id, el);
                  else carNodes.current.delete(c.id);
                }}
                className={`track-car${isSel ? " selected" : ""}${
                  dimmed ? " dimmed" : ""
                }`}
                style={{ transform: `translate(${p0.x}px, ${p0.y}px)` }}
                onClick={() => onSelectCar?.(isSel ? null : c.id)}
              >
                {isSel && (
                  <circle className="track-car-halo" r="20" fill={c.color} />
                )}
                <circle
                  r={isSel ? 16 : c.pos === 1 ? 15 : 13}
                  fill={c.color}
                  stroke="#08080c"
                  strokeWidth="2.5"
                />
                <text className="track-car-num" textAnchor="middle" dy="4">
                  {c.number}
                </text>
                {isSel && (
                  <text className="track-car-label" textAnchor="middle" y="-24">
                    {c.short}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      {name && (
        <div className="track-name">
          <span>{name}</span>
        </div>
      )}
    </div>
  );
}
