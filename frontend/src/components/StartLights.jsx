import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "./motion";

/* The F1 start gantry: five columns light up red one-by-one, hold, then all go
   out — "lights out and away we go". Calls onComplete after they go out.
   Used as the app intro splash and to launch a race in the live tracker. */
export default function StartLights({
  onComplete,
  label = "Lights out and away we go",
  interval = 550,
}) {
  const reduce = useReducedMotion();
  const [lit, setLit] = useState(0); // columns illuminated
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(() => onComplete?.(), 300);
      return () => clearTimeout(t);
    }
    const timers = [];
    for (let i = 1; i <= 5; i++) timers.push(setTimeout(() => setLit(i), i * interval));
    timers.push(setTimeout(() => setOut(true), 5 * interval + 850));
    timers.push(setTimeout(() => onComplete?.(), 5 * interval + 850 + 650));
    return () => timers.forEach(clearTimeout);
  }, [onComplete, reduce, interval]);

  return (
    <motion.div
      className="lights-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={`lights-gantry ${out ? "out" : ""}`}>
        {[0, 1, 2, 3, 4].map((col) => (
          <div className="light-col" key={col}>
            {[0, 1].map((row) => (
              <span
                key={row}
                className={`light ${!out && col < lit ? "on" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {out && (
          <motion.div
            className="lights-go"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            GO GO GO
          </motion.div>
        )}
      </AnimatePresence>
      {!out && <div className="lights-label">{label}</div>}
    </motion.div>
  );
}
