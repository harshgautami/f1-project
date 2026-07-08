import React, { useRef, useState, useLayoutEffect } from "react";

// Generic fallback loop (1000x600 viewBox) used only if a circuit can't be
// resolved — every current-calendar race maps to a real outline.
const FALLBACK =
  "M250 300 C250 170 420 140 560 180 C700 220 720 330 820 320 C900 312 900 440 760 435 C650 431 600 360 480 380 C360 400 300 470 250 300 Z";

/**
 * Renders a real F1 circuit outline (SVG path in a 1000x600 viewBox) with the
 * cars positioned along it via getPointAtLength(trackPos * length).
 */
export default function TrackMap({ cars = [], path, name }) {
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  const d = path || FALLBACK;

  useLayoutEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [d]);

  const pointAt = (t) => {
    if (!pathRef.current || !len) return { x: 0, y: 0 };
    const p = pathRef.current.getPointAtLength((((t % 1) + 1) % 1) * len);
    return { x: p.x, y: p.y };
  };
  const start = pointAt(0);
  const painted = [...cars].sort((a, b) => b.pos - a.pos); // leaders on top

  return (
    <div className="track-wrap">
      <svg viewBox="0 0 1000 600" className="track-svg" preserveAspectRatio="xMidYMid meet">
        <path ref={pathRef} d={d} fill="none" stroke="none" />
        <path d={d} className="track-asphalt" />
        <path d={d} className="track-line" />
        {len > 0 && (
          <g transform={`translate(${start.x} ${start.y})`} className="track-start">
            <rect x="-3.5" y="-13" width="7" height="26" rx="1" />
          </g>
        )}
        {len > 0 &&
          painted.map((c) => {
            const p = pointAt(c.trackPos);
            return (
              <g
                key={c.id}
                className="track-car"
                style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
              >
                <circle
                  r={c.pos === 1 ? 13 : 11}
                  fill={c.color}
                  stroke="#08080c"
                  strokeWidth="2.5"
                />
                <text className="track-car-num" textAnchor="middle" dy="4">
                  {c.number}
                </text>
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
