import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CIRCUIT_OUTLINES } from "../data/circuitOutlines";

/* Ambient F1 backdrop behind every page: a rotation of real circuit outlines
   (Monaco, Silverstone, Bahrain, Monza, Suzuka, Spa) drawn giant and faint,
   with two light pulses lapping the active one — like headlights tracing the
   track at night — plus drifting speed streaks and a slow-breathing red glow.
   Circuits crossfade every ~14s with the circuit's name captioned in the
   corner. Everything is transform/opacity animation on a fixed z-index:-1
   layer, so it never touches layout or intercepts input. */

// Drifting speed streaks: [top%, width px, duration s, delay s, opacity, cool?]
const STREAKS = [
  [8, 130, 9, -2, 0.35, true],
  [16, 90, 14, -9, 0.22, false],
  [24, 160, 7.5, -5, 0.4, true],
  [33, 70, 17, -12, 0.18, false],
  [41, 120, 10.5, -1, 0.3, true],
  [52, 95, 13, -7, 0.24, false],
  [61, 150, 8, -3, 0.38, true],
  [69, 80, 16, -11, 0.2, false],
  [77, 125, 11, -6, 0.32, true],
  [86, 100, 12.5, -4, 0.26, false],
  [93, 140, 9.5, -8, 0.34, true],
];

const CYCLE_MS = 14000;

export default function FXBackground() {
  const [idx, setIdx] = useState(0);
  const pathRefs = useRef([]);
  const [lengths, setLengths] = useState([]);

  // Measure every outline once so each pulse's dash cycle spans exactly one lap.
  useLayoutEffect(() => {
    setLengths(pathRefs.current.map((el) => (el ? el.getTotalLength() : 0)));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CIRCUIT_OUTLINES.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const active = CIRCUIT_OUTLINES[idx];
  const len = lengths[idx] || 0;

  return (
    <div className="fx-bg" aria-hidden="true">
      <div className="fx-pulse" />
      <svg className="fx-circuit" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
        {CIRCUIT_OUTLINES.map((c, i) => (
          <g key={c.name} className={`fx-circuit-g ${i === idx ? "active" : ""}`}>
            <path
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={c.d}
              className="fx-circuit-outline"
            />
            {i === idx && len > 0 && (
              <>
                <path
                  d={c.d}
                  className="fx-circuit-dash fx-dash-red"
                  style={{ "--len": len, strokeDasharray: `${len * 0.055} ${len * 0.945}` }}
                />
                <path
                  d={c.d}
                  className="fx-circuit-dash fx-dash-white"
                  style={{ "--len": len, strokeDasharray: `${len * 0.035} ${len * 0.965}` }}
                />
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="fx-circuit-name" key={active.name}>
        {active.name}
      </div>
      <div className="fx-streaks-field">
        {STREAKS.map(([top, w, dur, delay, o, cool], i) => (
          <span
            key={i}
            className={cool ? "cool" : ""}
            style={{
              "--t": `${top}%`,
              "--w": `${w}px`,
              "--d": `${dur}s`,
              "--dl": `${delay}s`,
              "--o": o,
            }}
          />
        ))}
      </div>
    </div>
  );
}
