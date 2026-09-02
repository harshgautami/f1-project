import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion";

/* ---------------------------------------------------------------------------
   Motion primitives for the F1 "Apex" UI. All of them respect the user's
   prefers-reduced-motion setting (framer-motion's useReducedMotion).
   ------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1];

/** Per-page enter/exit transition. Wrap each routed page in this. */
export function PageTransition({ children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Reveals its children with a fade-up as they scroll into view. */
export function Reveal({ children, delay = 0, y = 24, className, as = "div" }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: Math.min(y, 16) }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, ease: EASE, delay: Math.min(delay, 0.25) }}
    >
      {children}
    </MotionTag>
  );
}

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.03 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
};

/** Container that staggers its <StaggerItem> children into view. */
export function Stagger({ children, className, once = true }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={reduce ? undefined : staggerParent}
      initial={reduce ? false : "hidden"}
      animate={reduce ? false : inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style, onClick }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      onClick={onClick}
      variants={reduce ? undefined : staggerChild}
    >
      {children}
    </motion.div>
  );
}

/** Count-up number for hero stats. */
export function AnimatedNumber({ value, duration = 1.1, decimals = 0, className }) {
  const reduce = useReducedMotion();
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);

  return (
    <span className={className}>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

/** Infinite horizontal "speed" marquee of short phrases. */
export function Marquee({ items = [] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}

/** Re-export framer bits so pages import from one place. */
export { motion, AnimatePresence, useReducedMotion };
