import React, { useRef, useState, useLayoutEffect } from "react";

/* Stylized closed-loop circuits. Not geographically accurate — one is chosen
   per Grand Prix (by round) so different races look different. Cars are placed
   with SVGPathElement.getPointAtLength(trackPos * totalLength). */
const TRACKS = [
  "M120,300 C90,170 210,90 360,110 C500,128 520,215 630,205 C760,193 760,380 600,372 C500,367 440,300 330,322 C210,346 145,410 120,300 Z",
  "M140,230 C140,120 300,110 380,170 C450,222 470,120 590,130 C710,140 720,250 640,300 C560,350 640,400 470,400 C300,400 300,320 220,330 C150,339 140,330 140,230 Z",
  "M110,250 C110,150 200,120 300,140 C380,156 380,90 470,90 C600,90 620,200 690,240 C760,278 700,380 560,360 C470,347 500,290 400,300 C280,312 260,400 180,360 C120,330 110,330 110,250 Z",
  "M150,320 C110,220 180,120 320,120 C430,120 430,200 520,190 C640,177 660,110 710,190 C760,270 690,330 600,340 C500,351 500,400 380,390 C250,379 210,410 150,320 Z",
];

export default function TrackMap({ cars = [], variant = 0, name }) {
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  const d = TRACKS[variant % TRACKS.length];

  useLayoutEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [d]);

  const pointAt = (t) => {
    if (!pathRef.current || !len) return { x: 0, y: 0 };
    const p = pathRef.current.getPointAtLength((((t % 1) + 1) % 1) * len);
    return { x: p.x, y: p.y };
  };
  const start = pointAt(0);
  // Draw back-markers first so leaders render on top.
  const painted = [...cars].sort((a, b) => b.pos - a.pos);

  return (
    <div className="track-wrap">
      <svg viewBox="0 0 800 470" className="track-svg" preserveAspectRatio="xMidYMid meet">
        {/* measured base path (hidden) + visible styled lines */}
        <path ref={pathRef} d={d} fill="none" stroke="none" />
        <path d={d} className="track-asphalt" />
        <path d={d} className="track-line" />
        {len > 0 && (
          <g
            transform={`translate(${start.x} ${start.y})`}
            className="track-start"
          >
            <rect x="-3" y="-11" width="6" height="22" rx="1" />
          </g>
        )}
        {len > 0 &&
          painted.map((c) => {
            const p = pointAt(c.trackPos);
            return (
              <g
                key={c.id}
                className="track-car"
                style={{
                  transform: `translate(${p.x}px, ${p.y}px)`,
                }}
              >
                <circle
                  r={c.pos === 1 ? 10 : 8}
                  fill={c.color}
                  stroke="#08080c"
                  strokeWidth="2.5"
                />
                <text className="track-car-num" textAnchor="middle" dy="3.5">
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
