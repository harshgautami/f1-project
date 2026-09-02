import React from "react";
import { useReducedMotion } from "framer-motion";
import FaultyTerminal from "./FaultyTerminal";

/* Login backdrop: a full-bleed faulty-terminal shader in F1 red, mounted in
   the same fixed, behind-everything slot the ambient circuit backdrop uses on
   every other page (see `.login-terminal` in index.css). With reduced motion
   requested it holds a single frame instead of animating. */

const GRID_MUL = [2, 1];

export default function LoginTerminal() {
  const reduce = useReducedMotion();
  return (
    <div className="login-terminal" aria-hidden="true">
      <FaultyTerminal
        scale={1.5}
        gridMul={GRID_MUL}
        digitSize={1.2}
        timeScale={1}
        pause={!!reduce}
        scanlineIntensity={1}
        glitchAmount={1}
        flickerAmount={1}
        noiseAmp={1}
        chromaticAberration={0}
        dither={0}
        curvature={0}
        tint="#f92304"
        mouseReact={!reduce}
        mouseStrength={0.5}
        pageLoadAnimation={false}
        brightness={1}
      />
    </div>
  );
}
