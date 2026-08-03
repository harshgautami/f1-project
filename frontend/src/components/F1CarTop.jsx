import React, { useId } from "react";

/* A modern F1 car seen from directly above, facing up — the broadcast/game
   "grid shot" silhouette: full-width front wing, long slender nose, halo ring
   over the helmet, floor edges peeking out beside straight-flanked sidepods,
   coke-bottle taper into the rear wing. Painted with side-lit gradients
   (light from the upper-left) plus an offset ground shadow so it sits on the
   asphalt instead of floating. Recolor whole cars cheaply with CSS filters
   (hue-rotate/grayscale) on a wrapper. */
export default function F1CarTop({ className = "" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = (name) => `f1t-${name}-${uid}`;
  const url = (name) => `url(#${g(name)})`;

  // Tire from above: near-rectangular carcass, inner tread band, curvature
  // highlights top and bottom.
  const Tire = ({ x, y, w, h }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.24} fill="#060609" />
      <rect x={x + 6} y={y + 8} width={w - 12} height={h - 16} rx={(w - 12) * 0.22} fill={url("tread")} />
      <rect x={x + 10} y={y + h * 0.12} width={w - 20} height={h * 0.09} rx={4} fill="rgba(255,255,255,0.08)" />
      <rect x={x + 10} y={y + h * 0.78} width={w - 20} height={h * 0.07} rx={4} fill="rgba(255,255,255,0.04)" />
      <line x1={x + 8} y1={y + h / 2} x2={x + w - 8} y2={y + h / 2} stroke="rgba(0,0,0,0.5)" strokeWidth="3" />
    </g>
  );

  return (
    <svg
      viewBox="0 0 440 1100"
      className={`f1car-top ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* light from the upper-left */}
        <linearGradient id={g("body")} x1="0" y1="0" x2="1" y2="0.18">
          <stop offset="0" stopColor="#f5301c" />
          <stop offset="0.45" stopColor="#cf0a00" />
          <stop offset="1" stopColor="#800300" />
        </linearGradient>
        <linearGradient id={g("nose")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4331" />
          <stop offset="0.5" stopColor="#d90d02" />
          <stop offset="1" stopColor="#8a0400" />
        </linearGradient>
        <linearGradient id={g("spine")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c00800" />
          <stop offset="0.5" stopColor="#870300" />
          <stop offset="1" stopColor="#570100" />
        </linearGradient>
        <linearGradient id={g("wing")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e81205" />
          <stop offset="1" stopColor="#8a0400" />
        </linearGradient>
        <linearGradient id={g("carbon")} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#1a1c22" />
          <stop offset="1" stopColor="#0a0b0e" />
        </linearGradient>
        <linearGradient id={g("tread")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#212127" />
          <stop offset="0.5" stopColor="#141419" />
          <stop offset="1" stopColor="#0c0c10" />
        </linearGradient>
        <radialGradient id={g("shadow")}>
          <stop offset="0" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="0.7" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id={g("helmet")} fx="0.35" fy="0.3">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#dfe3ea" />
          <stop offset="1" stopColor="#99a0ad" />
        </radialGradient>
      </defs>

      {/* ground shadow, offset down-right of the light */}
      <ellipse cx="240" cy="580" rx="180" ry="500" fill={url("shadow")} />

      {/* ===== floor plan — edges peek out beside the sidepods ===== */}
      <path
        d="M 130 400 L 310 400 C 350 410, 378 430, 382 470 L 384 750 C 384 810, 360 850, 320 870 L 120 870 C 80 850, 56 810, 56 750 L 58 470 C 62 430, 90 410, 130 400 Z"
        fill={url("carbon")}
      />

      {/* ===== front wing ===== */}
      <rect x="24" y="28" width="30" height="68" rx="9" fill={url("carbon")} />
      <rect x="386" y="28" width="30" height="68" rx="9" fill={url("carbon")} />
      <rect x="24" y="28" width="8" height="68" rx="4" fill="rgba(225,6,0,0.85)" />
      <rect x="408" y="28" width="8" height="68" rx="4" fill="rgba(225,6,0,0.85)" />
      <path
        d="M 54 36 C 130 27, 310 27, 386 36 L 386 82 C 310 91, 130 91, 54 82 Z"
        fill={url("wing")}
      />
      <path d="M 56 50 C 130 42, 310 42, 384 50" stroke="rgba(6,6,10,0.55)" strokeWidth="3.5" fill="none" />
      <path d="M 56 64 C 130 57, 310 57, 384 64" stroke="rgba(6,6,10,0.5)" strokeWidth="3.5" fill="none" />
      <path d="M 55 39 C 130 31, 310 31, 385 39" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />

      {/* ===== nose — long and slim ===== */}
      <path
        d="M 205 34 C 202 120, 198 220, 190 320 L 250 320 C 242 220, 238 120, 235 34 Z"
        fill={url("nose")}
      />
      <path d="M 220 40 L 220 310" stroke="rgba(255,255,255,0.16)" strokeWidth="2" fill="none" />
      <text
        x="220"
        y="200"
        textAnchor="middle"
        fontFamily="'Titillium Web', Inter, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="44"
        fill="rgba(255,255,255,0.95)"
      >
        1
      </text>

      {/* ===== front suspension (swept back, nose to wheels) ===== */}
      <g stroke="#0f1015" strokeWidth="8" strokeLinecap="round">
        <line x1="194" y1="180" x2="122" y2="168" />
        <line x1="194" y1="240" x2="122" y2="252" />
        <line x1="246" y1="180" x2="318" y2="168" />
        <line x1="246" y1="240" x2="318" y2="252" />
      </g>
      <g stroke="rgba(255,255,255,0.07)" strokeWidth="2" strokeLinecap="round">
        <line x1="194" y1="178" x2="122" y2="166" />
        <line x1="246" y1="178" x2="318" y2="166" />
      </g>

      {/* ===== front tyres ===== */}
      <Tire x={28} y={126} w={94} h={182} />
      <Tire x={318} y={126} w={94} h={182} />
      {/* brake-duct winglets inboard of the tyres */}
      <path d="M 124 150 L 146 158 L 146 172 L 124 166 Z" fill="#0d0e12" />
      <path d="M 316 150 L 294 158 L 294 172 L 316 166 Z" fill="#0d0e12" />

      {/* ===== chassis: nose base running back into the cockpit ===== */}
      <path d="M 190 320 L 250 320 C 256 355, 260 390, 262 420 L 178 420 C 180 390, 184 355, 190 320 Z" fill={url("body")} />

      {/* ===== sidepods + mid body — wide and straight, late coke-bottle ===== */}
      <path
        d="M 178 420 L 262 420
           C 320 422, 356 440, 362 474
           L 364 640
           C 360 700, 342 750, 322 790
           L 318 800 L 122 800 L 118 790
           C 98 750, 80 700, 76 640
           L 78 474
           C 84 440, 120 422, 178 420 Z"
        fill={url("body")}
      />
      {/* sidepod top shading (undercut roll-over) */}
      <path d="M 92 480 L 90 640 C 94 696, 110 742, 128 778 C 114 740, 102 696, 100 640 L 102 484 Z" fill="rgba(0,0,0,0.3)" />
      <path d="M 348 480 L 350 640 C 346 696, 330 742, 312 778 C 326 740, 338 696, 340 640 L 338 484 Z" fill="rgba(0,0,0,0.4)" />
      {/* radiator intake slots at the pod leading edges */}
      <path d="M 100 448 C 122 438, 148 432, 172 430 L 172 446 C 150 448, 128 454, 108 462 Z" fill="#060709" />
      <path d="M 340 448 C 318 438, 292 432, 268 430 L 268 446 C 290 448, 312 454, 332 462 Z" fill="#060709" />
      {/* mirrors */}
      <rect x="140" y="428" width="26" height="12" rx="4" fill="#0c0d10" />
      <rect x="274" y="428" width="26" height="12" rx="4" fill="#0c0d10" />

      {/* ===== cockpit + halo + helmet ===== */}
      <path d="M 192 366 C 204 360, 236 360, 248 366 L 252 500 C 236 508, 204 508, 188 500 Z" fill="#0a0b0e" />
      <circle cx="220" cy="452" r="26" fill={url("helmet")} />
      <path d="M 201 440 A 26 26 0 0 1 239 440 L 233 447 A 18 18 0 0 0 207 447 Z" fill="#0a0c12" />
      <path d="M 220 426 L 220 478" stroke="#c00500" strokeWidth="7" />
      {/* halo ring */}
      <ellipse cx="220" cy="438" rx="48" ry="56" fill="none" stroke="#171921" strokeWidth="12" />
      <rect x="215" y="360" width="10" height="30" fill="#171921" />
      <path d="M 176 414 A 48 56 0 0 1 264 414" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />

      {/* ===== airbox + T-cam + engine cover ===== */}
      <rect x="202" y="496" width="36" height="12" rx="5" fill="#0b0c10" />
      <rect x="202" y="496" width="10" height="12" rx="4" fill="#e10600" />
      <ellipse cx="220" cy="522" rx="19" ry="9" fill="#050507" stroke="#26262c" strokeWidth="1" />
      {/* engine cover: wide over the pods, tapering back */}
      <path
        d="M 178 516 C 190 508, 250 508, 262 516 C 268 570, 264 640, 252 710 C 246 760, 240 810, 236 880 L 204 880 C 200 810, 194 760, 188 710 C 176 640, 172 570, 178 516 Z"
        fill={url("spine")}
      />
      <path d="M 220 520 L 220 875" stroke="rgba(255,255,255,0.13)" strokeWidth="2.5" fill="none" />
      <text
        x="220"
        y="640"
        textAnchor="middle"
        fontFamily="'Titillium Web', Inter, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="30"
        fill="rgba(255,255,255,0.85)"
      >
        F1M
      </text>

      {/* ===== rear deck / beam between the rear wheels ===== */}
      <path d="M 150 800 L 290 800 L 282 890 L 158 890 Z" fill={url("carbon")} />
      <g stroke="rgba(0,0,0,0.55)" strokeWidth="3">
        <line x1="176" y1="808" x2="174" y2="884" />
        <line x1="264" y1="808" x2="266" y2="884" />
      </g>

      {/* ===== rear suspension ===== */}
      <g stroke="#0f1015" strokeWidth="8" strokeLinecap="round">
        <line x1="162" y1="806" x2="116" y2="796" />
        <line x1="162" y1="846" x2="116" y2="856" />
        <line x1="278" y1="806" x2="324" y2="796" />
        <line x1="278" y1="846" x2="324" y2="856" />
      </g>

      {/* ===== rear tyres (wider) ===== */}
      <Tire x={12} y={754} w={106} h={196} />
      <Tire x={322} y={754} w={106} h={196} />

      {/* ===== rear wing ===== */}
      <rect x="52" y="964" width="30" height="104" rx="8" fill={url("carbon")} />
      <rect x="358" y="964" width="30" height="104" rx="8" fill={url("carbon")} />
      <rect x="52" y="964" width="8" height="104" rx="4" fill="rgba(225,6,0,0.85)" />
      <rect x="380" y="964" width="8" height="104" rx="4" fill="rgba(225,6,0,0.85)" />
      {/* DRS flap + main plane */}
      <path d="M 82 976 C 160 967, 280 967, 358 976 L 358 1006 C 280 998, 160 998, 82 1006 Z" fill={url("wing")} />
      <path d="M 82 1014 C 160 1007, 280 1007, 358 1014 L 358 1046 C 280 1054, 160 1054, 82 1046 Z" fill={url("carbon")} />
      <path d="M 84 979 C 160 970, 280 970, 356 979" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" />
      <rect x="206" y="958" width="28" height="22" rx="7" fill="#14161a" />
      {/* rain light */}
      <rect x="210" y="1052" width="20" height="12" rx="4" fill="#e10600" opacity="0.95" />

      {/* glossy sheen sweeping across the whole car */}
      <path d="M 60 300 L 400 190 L 400 265 L 60 400 Z" fill="rgba(255,255,255,0.05)" />
    </svg>
  );
}
