import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "./motion";
import LightGantry from "./LightGantry";

/* Post-login cinematic — the F1 start ritual, straight to the point.

   The start gantry, close up against the night sky: five columns arm one by
   one, hold all-red for a randomized beat (like the real thing), then
   LIGHTS OUT — a breath of darkness, the kinetic type slams in, and the
   frame gently scales and dissolves onto the home page that lazy-loaded
   underneath. Click anywhere to skip. */

export default function RaceLaunch({ onComplete, interval = 400 }) {
  const reduce = useReducedMotion();
  const [lit, setLit] = useState(0); // red columns illuminated
  // gantry → hold → dark → type
  const [phase, setPhase] = useState("gantry");

  // Keep the latest onComplete without letting its identity restart the
  // timeline — a parent re-render (e.g. the home page loading underneath) must
  // not reset the light countdown.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current?.();
  };

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(finish, 450);
      return () => clearTimeout(t);
    }
    const timers = [];
    const lightsStart = 600;
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLit(i), lightsStart + (i - 1) * interval));
    }
    const allLitAt = lightsStart + 4 * interval;
    timers.push(setTimeout(() => setPhase("hold"), allLitAt));
    // The hold before lights-out is never the same twice.
    const outAt = allLitAt + 650 + Math.random() * 450;
    timers.push(setTimeout(() => setPhase("dark"), outAt));
    const typeAt = outAt + 300; // beat of darkness, then the words land
    timers.push(setTimeout(() => setPhase("type"), typeAt));
    timers.push(setTimeout(finish, typeAt + 1050));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, interval]);

  const out = phase === "dark" || phase === "type";

  return (
    <motion.div
      className="race-launch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.045 }}
      transition={{
        default: { duration: 0.7, ease: [0.3, 0.1, 0.25, 1] },
        opacity: { duration: 0.45, ease: "easeOut" },
      }}
      onClick={finish}
    >
      <div className={`shot shot-gantry ph-${phase}`}>
        <div className="sg-sky" />
        <div className="sg-haze" />
        <div className="sg-stars" />
        <LightGantry lit={lit} out={out} className="sg-gantry" />
        {/* red ambience rising off the tarmac as columns arm */}
        <div className="sg-bloom" style={{ opacity: out ? 0 : lit * 0.17 }} />
        {!out && (
          <div className="launch-status">
            {lit < 5 ? "Grid · Formation Complete" : "It's lights out…"}
          </div>
        )}
      </div>

      <div className="launch-grain" aria-hidden="true" />
      <div className="launch-vignette" aria-hidden="true" />

      {/* the pit-wall call, styled like the broadcast team-radio graphic:
          mic chip + live waveform, then BOX BOX! slams in per-letter */}
      {phase === "type" && (
        <div className="launch-radio" aria-hidden="true">
          <div className="radio-chip">
            <span className="radio-dot" />
            <span className="radio-label">Team Radio · Car 1</span>
            <span className="radio-wave">
              {Array.from({ length: 5 }).map((_, i) => (
                <i key={i} style={{ "--i": i }} />
              ))}
            </span>
          </div>
          <div className="launch-type">
            {["BOX", "BOX!"].map((word, w) => (
              <span className={`lt-word ${w === 1 ? "lt-outline" : ""}`} key={w}>
                {word.split("").map((ch, i) => (
                  <span className="lt-mask" key={i}>
                    <span className="lt-ch" style={{ "--i": w * 4 + i }}>
                      {ch}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="launch-skip">Tap to skip</div>
    </motion.div>
  );
}
