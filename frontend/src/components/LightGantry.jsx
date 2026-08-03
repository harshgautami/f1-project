import React, { useId } from "react";

const POD_CENTERS = [320, 460, 600, 740, 880];

/* The real F1 start-light gantry: a truss beam spanning the track with five
   light pods hung off it. `lit` columns show red (left to right); `out` kills
   them all at once. Pure SVG with pre-softened glow gradients (no filters).
   Shared by the post-login cinematic and the live-race start overlay. */
export default function LightGantry({ lit = 0, out = false, className = "" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = (name) => `lg-${name}-${uid}`;
  const url = (name) => `url(#${g(name)})`;

  return (
    <svg viewBox="0 0 1200 260" className={`gantry-svg ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={g("pod")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#181b22" />
          <stop offset="1" stopColor="#0b0c10" />
        </linearGradient>
        <radialGradient id={g("off")} fx="0.4" fy="0.35">
          <stop offset="0" stopColor="#2f1010" />
          <stop offset="0.7" stopColor="#1a0909" />
          <stop offset="1" stopColor="#120606" />
        </radialGradient>
        <radialGradient id={g("on")} fx="0.4" fy="0.35">
          <stop offset="0" stopColor="#fff3ef" />
          <stop offset="0.22" stopColor="#ff7a68" />
          <stop offset="0.55" stopColor="#e10600" />
          <stop offset="1" stopColor="#8a0300" />
        </radialGradient>
        <radialGradient id={g("halo")}>
          <stop offset="0" stopColor="rgba(255,40,20,0.55)" />
          <stop offset="0.5" stopColor="rgba(225,6,0,0.22)" />
          <stop offset="1" stopColor="rgba(225,6,0,0)" />
        </radialGradient>
      </defs>

      {/* truss beam */}
      <g stroke="#2a2e37" strokeWidth="6" strokeLinecap="round">
        <line x1="24" y1="18" x2="1176" y2="18" />
        <line x1="24" y1="58" x2="1176" y2="58" />
      </g>
      <g stroke="#22252d" strokeWidth="3.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const x = 24 + i * 57.6;
          return i % 2 === 0 ? (
            <line key={i} x1={x} y1="18" x2={x + 57.6} y2="58" />
          ) : (
            <line key={i} x1={x} y1="58" x2={x + 57.6} y2="18" />
          );
        })}
        <line x1="24" y1="18" x2="24" y2="58" />
        <line x1="1176" y1="18" x2="1176" y2="58" />
      </g>

      {/* pods */}
      {POD_CENTERS.map((cx, col) => {
        const on = !out && col < lit;
        return (
          <g key={col}>
            {/* mounting strut */}
            <rect x={cx - 3} y="58" width="6" height="28" fill="#22252d" />
            {/* housing */}
            <rect x={cx - 46} y="86" width="92" height="130" rx="10" fill={url("pod")} stroke="#2b2f38" strokeWidth="1.5" />
            <rect x={cx - 38} y="94" width="76" height="114" rx="7" fill="#07080b" />
            {/* lamps */}
            {[124, 178].map((cy) => (
              <g key={cy}>
                {on && <circle cx={cx} cy={cy} r="46" fill={url("halo")} className="gl-halo" />}
                <circle
                  cx={cx}
                  cy={cy}
                  r="26"
                  fill={on ? url("on") : url("off")}
                  className={on ? "gl-on" : ""}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="1.5"
                />
                {on && <circle cx={cx - 8} cy={cy - 9} r="6" fill="rgba(255,255,255,0.7)" />}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
