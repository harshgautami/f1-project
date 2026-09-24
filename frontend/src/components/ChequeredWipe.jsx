import React, { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useReducedMotion } from "./motion";

/* Post-login cinematic: a chequered flag sweeps across the screen right → left.

   The flag is a full-screen WebGL shader rather than an image, so it stays
   razor sharp at any resolution: the checks are computed per pixel with
   derivative-based anti-aliasing, and a travelling cloth wave displaces the
   fabric and shades its folds (diffuse + a satin sheen).

   Timeline — the pole leads, the cloth streams out behind it (to the right):
     in    the flag flies in from the right edge until it covers the screen
     hold  it billows in place; `onCovered` fires so the home page mounts
           underneath, out of sight
     out   it accelerates away to the left, its trailing edge wiping the new
           page into view, then `onDone`
   Click anywhere to skip. */

const IN = 0.95;
const HOLD = 0.6;
const OUT = 0.85;
const FLAG_W = 1.35; // flag width as a fraction of the viewport width

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x) => x * x * x;

// Shared body; the header differs between WebGL2 (GLSL 300 es) and WebGL1.
const FRAG_BODY = /* glsl */ `
uniform vec2 uRes;      // canvas size in device px
uniform float uTime;
uniform float uPole;    // pole x in device px
uniform float uFlagW;   // flag width in device px
uniform float uCell;    // check size in device px
uniform float uAmp;     // wave amplitude in device px

const float PI = 3.14159265;
const vec3 INK = vec3(0.035, 0.035, 0.045);
const vec3 SILK = vec3(0.95, 0.95, 0.96);
const vec3 BG = vec3(0.012, 0.012, 0.02); // .launch-holding, so the join is invisible

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Vertical cloth displacement at flag-local u (0 at the pole, 1 at the fly
// end) and height v. Two travelling waves; amplitude grows away from the pole.
float wave(float u, float v, out float slope) {
  float a1 = u * 7.5 - uTime * 6.2 + v * 1.4;
  float a2 = u * 13.0 - uTime * 9.1 - v * 2.3;
  float grow = 0.15 + 0.85 * u;
  slope = grow * (cos(a1) * 7.5 + 0.35 * cos(a2) * 13.0) + 0.85 * (sin(a1) + 0.35 * sin(a2));
  return grow * (sin(a1) + 0.35 * sin(a2));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); // top-left origin
  float x = p.x - uPole;

  // Left of the pole: the dark screen the flag is sweeping over.
  if (x < 0.0) {
    float poleW = max(uRes.y * 0.006, 3.0);
    if (x > -poleW) {
      // brushed-metal pole
      float s = (x + poleW) / poleW;
      float lit = 0.35 + 0.65 * pow(sin(s * PI), 0.6) + 0.35 * smoothstep(0.55, 0.7, s) * (1.0 - smoothstep(0.7, 0.85, s));
      OUTCOLOR = vec4(vec3(0.62, 0.64, 0.68) * lit, 1.0);
      return;
    }
    OUTCOLOR = vec4(BG, 1.0);
    return;
  }

  float u = x / uFlagW;
  // Horizontal flutter makes the fly end ragged instead of a ruler-straight edge.
  float v0 = p.y / uRes.y;
  float flutter = 0.012 * sin(v0 * 9.0 - uTime * 7.0) * u + 0.006 * sin(v0 * 23.0 + uTime * 5.0) * u;
  float uf = u + flutter;

  if (uf > 1.0) {
    // Soft shadow the cloth throws on the page it just revealed.
    float d = (uf - 1.0) * uFlagW / uRes.y;
    float sh = 0.4 * (1.0 - smoothstep(0.0, 0.07, d));
    OUTCOLOR = vec4(0.0, 0.0, 0.0, sh);
    return;
  }

  float slope;
  float dy = wave(uf, v0, slope) * uAmp;
  vec2 cloth = vec2(uf * uFlagW, p.y - dy); // position on the undeformed cloth

  // Anti-aliased checks: sign of a product of sines, smoothed over 1px.
  vec2 c = cloth / uCell;
  float s = sin(PI * c.x) * sin(PI * c.y);
  float w = fwidth(s) * 1.25 + 1e-4;
  vec3 base = mix(INK, SILK, smoothstep(-w, w, s));

  // Fold shading from the wave slope: the cloth normal tilts along u as the
  // wave rises and falls; key light from the upper left.
  vec3 n = normalize(vec3(-slope * uAmp / uFlagW * 5.0, 0.0, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.3, 0.78));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(clamp(dot(n, H), 0.0, 1.0), 40.0);
  float shade = 0.2 + 1.05 * diff;

  // Fine weave + grain so the fabric reads as cloth, not a flat vector.
  float weave = 0.5 + 0.5 * sin(cloth.x * 1.9) * sin(cloth.y * 1.9);
  float grain = hash(floor(p)) - 0.5;
  vec3 col = base * shade * (0.97 + 0.03 * weave) + spec * 0.22 + grain * 0.018;

  // Darken the hem where the cloth meets the pole, and the frayed fly end.
  col *= 0.78 + 0.22 * smoothstep(0.0, 0.02, uf);
  col *= 1.0 - 0.25 * smoothstep(0.97, 1.0, uf);
  // Anti-aliased fly edge.
  float edge = 1.0 - smoothstep(1.0 - fwidth(uf) * 1.5, 1.0, uf);

  OUTCOLOR = vec4(col, edge);
}
`;

const VERT2 = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAG2 = `#version 300 es
precision highp float;
out vec4 fragColor;
#define OUTCOLOR fragColor
${FRAG_BODY}`;
const VERT1 = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAG1 = `#extension GL_OES_standard_derivatives : enable
precision highp float;
#define OUTCOLOR gl_FragColor
${FRAG_BODY}`;

export default function ChequeredWipe({ onCovered, onDone }) {
  const reduce = useReducedMotion();
  const hostRef = useRef(null);
  const cb = useRef({ onCovered, onDone });
  cb.current = { onCovered, onDone };
  const skipRef = useRef(() => {});

  useEffect(() => {
    let covered = false;
    let done = false;
    const cover = () => {
      if (covered) return;
      covered = true;
      cb.current.onCovered?.();
    };
    const finish = () => {
      if (done) return;
      done = true;
      cover();
      cb.current.onDone?.();
    };
    skipRef.current = finish;

    if (reduce) {
      cover();
      const t = setTimeout(finish, 250);
      return () => clearTimeout(t);
    }

    let renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        webgl: 2,
      });
    } catch {
      finish(); // no WebGL: go straight to the page
      return undefined;
    }
    const gl = renderer.gl;
    const webgl2 = renderer.isWebgl2;
    if (!webgl2 && !gl.getExtension("OES_standard_derivatives")) {
      finish();
      return undefined;
    }
    gl.clearColor(0, 0, 0, 0);

    const host = hostRef.current;
    host.appendChild(gl.canvas);

    const uniforms = {
      uRes: { value: [1, 1] },
      uTime: { value: 0 },
      uPole: { value: 0 },
      uFlagW: { value: 1 },
      uCell: { value: 1 },
      uAmp: { value: 1 },
    };
    const program = new Program(gl, {
      vertex: webgl2 ? VERT2 : VERT1,
      fragment: webgl2 ? FRAG2 : FRAG1,
      uniforms,
      transparent: true,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let W = 1;
    let H = 1;
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      W = gl.canvas.width;
      H = gl.canvas.height;
      uniforms.uRes.value = [W, H];
      uniforms.uFlagW.value = W * FLAG_W;
      uniforms.uCell.value = H / 7; // seven rows of checks top to bottom
      uniforms.uAmp.value = H * 0.036;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pole position over time (device px). The cloth trails to its right.
    const poleAt = (t) => {
      const flagW = W * FLAG_W;
      const start = W + 4;
      const settle = -0.06 * W;
      const drift = -0.14 * W;
      const end = -(flagW + 0.12 * W);
      if (t < IN) return start + (settle - start) * easeOutCubic(t / IN);
      if (t < IN + HOLD) return settle + (drift - settle) * ((t - IN) / HOLD);
      return drift + (end - drift) * easeInCubic(Math.min(1, (t - IN - HOLD) / OUT));
    };

    let raf = 0;
    const t0 = performance.now();
    const frame = (now) => {
      const t = (now - t0) / 1000;
      uniforms.uTime.value = t;
      uniforms.uPole.value = poleAt(t);
      renderer.render({ scene: mesh });
      if (t >= IN) cover();
      if (t >= IN + HOLD + OUT) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  return (
    <div
      className="chequered-wipe"
      ref={hostRef}
      onClick={() => skipRef.current()}
      role="presentation"
    >
      <span className="chequered-wipe-skip">Tap to skip</span>
    </div>
  );
}
