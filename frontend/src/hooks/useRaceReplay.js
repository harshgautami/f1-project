import { useRef, useState, useEffect, useCallback } from "react";

/* ---------------------------------------------------------------------------
   Result-accurate race replay.

   Given the REAL classified result of a Grand Prix (finishing order + starting
   grid + status per driver), this animates the field from the real grid to the
   real finishing order. Each car's running position interpolates grid → finish
   with a little organic wobble that decays to zero, so mid-race overtakes look
   natural but the final order is exactly the real result. Retirements (DNFs)
   park on track at the lap they actually dropped out.

   Classification (who's Nth) is driven by `orderVal`; physical placement on the
   circuit is driven by `dist`. Keeping them separate lets a crashed car sit
   still on the tarmac while still being classified last, like reality.

   Returns the same shape as useRaceSimulation so TrackMap / the standings panel
   consume it unchanged.
   ------------------------------------------------------------------------- */

const RATE = 1 / 4500; // laps per ms at 1x (~1 lap / 4.5s)
const COMMIT_MS = 50; // ~20 fps state commits
const STAGGER = 0.016; // track spacing between consecutive positions, in laps

const isClassifiedFinish = (status) =>
  status === "Finished" || /^\+\d+ Lap/.test(status || "");

export function useRaceReplay(results = [], { totalLaps: totalLapsOpt } = {}) {
  const carsRef = useRef([]);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const accRef = useRef(0);
  const progressRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(2);

  const [speed, setSpeedState] = useState(2);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [snapshot, setSnapshot] = useState([]);

  const totalLaps =
    totalLapsOpt ||
    Math.max(1, ...results.map((r) => r.laps || 0));

  const fieldSize = results.length || 1;

  const buildCars = useCallback(
    () =>
      results.map((r, i) => {
        const grid = r.grid && r.grid > 0 ? r.grid : fieldSize + i * 0.01;
        const finish = r.position && r.position <= fieldSize ? r.position : fieldSize;
        return {
          id: r._id || `${r.number}-${r.code}-${i}`,
          name: r.driver,
          short: r.code || (r.driver || "").slice(0, 3).toUpperCase(),
          number: r.number,
          color: r.color || "#e10600",
          team: r.team || "",
          status: r.status || "",
          grid,
          finish,
          finisher: isClassifiedFinish(r.status),
          lapsDone: r.laps || totalLaps,
          // dynamic state
          orderVal: grid,
          dist: -(grid - 1) * STAGGER, // lined up on the grid at the start
          frozenDist: null,
          out: false,
          pos: Math.round(grid),
          prevPos: Math.round(grid),
          delta: 0,
          // deterministic per-car wobble (no Math.random → stable replays)
          nFreq: 1.3 + ((i * 7) % 5) * 0.33,
          nPhase: (i * 1.7) % (Math.PI * 2),
          nAmp: 1.1 + ((i * 3) % 4) * 0.35,
        };
      }),
    [results, fieldSize, totalLaps],
  );

  const commit = useCallback(() => {
    const cars = carsRef.current;
    const progress = progressRef.current;
    const ordered = [...cars].sort(
      (a, b) => a.orderVal - b.orderVal || a.finish - b.finish,
    );
    ordered.forEach((c, idx) => {
      const pos = idx + 1;
      if (pos !== c.pos) {
        c.prevPos = c.pos;
        c.delta = c.pos - pos; // + = gained places
        c.pos = pos;
      }
    });
    const leader = ordered[0];
    if (progress >= totalLaps && runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      setFinished(true);
    }
    setSnapshot(
      ordered.map((c) => ({
        id: c.id,
        name: c.name,
        short: c.short,
        number: c.number,
        color: c.color,
        team: c.team,
        pos: c.pos,
        delta: c.delta,
        lap: Math.min(totalLaps, Math.max(0, Math.floor(progress))),
        trackPos: ((c.dist % 1) + 1) % 1,
        gap: leader ? Math.max(0, leader.dist - c.dist) : 0,
        out: c.out,
        status: c.status,
      })),
    );
  }, [totalLaps]);

  const advance = useCallback(() => {
    const progress = progressRef.current;
    const t = Math.min(1, Math.max(0, progress / totalLaps));
    const eased = t * t * (3 - 2 * t); // smoothstep grid → finish
    for (const c of carsRef.current) {
      // Retire non-finishers once the replay passes the lap they completed.
      if (!c.finisher && !c.out && progress >= c.lapsDone) {
        c.out = true;
        c.frozenDist = c.dist;
      }
      if (c.out) {
        c.orderVal = c.finish; // classified at its real (retired) position
        c.dist = c.frozenDist; // parked where it stopped
        continue;
      }
      const wobble =
        Math.sin(t * Math.PI * c.nFreq + c.nPhase) * c.nAmp * (1 - t);
      const base = c.grid + (c.finish - c.grid) * eased;
      c.orderVal = Math.max(1, base + wobble);
      c.dist = progress - (c.orderVal - 1) * STAGGER;
    }
  }, [totalLaps]);

  const tick = useCallback(
    (now) => {
      if (!runningRef.current) return;
      const dt = Math.min(now - lastRef.current, 80);
      lastRef.current = now;
      progressRef.current = Math.min(
        totalLaps,
        progressRef.current + RATE * speedRef.current * dt,
      );
      advance();
      accRef.current += dt;
      if (accRef.current >= COMMIT_MS) {
        accRef.current = 0;
        commit();
      }
      if (progressRef.current >= totalLaps) {
        commit();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [advance, commit, totalLaps],
  );

  const start = useCallback(() => {
    if (runningRef.current || !carsRef.current.length) return;
    if (progressRef.current >= totalLaps) return;
    runningRef.current = true;
    setRunning(true);
    setFinished(false);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, totalLaps]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    runningRef.current = false;
    setRunning(false);
    setFinished(false);
    progressRef.current = 0;
    carsRef.current = buildCars();
    accRef.current = 0;
    advance();
    commit();
  }, [buildCars, advance, commit]);

  const setSpeed = useCallback((s) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  // (Re)initialize whenever the race result changes.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    runningRef.current = false;
    setRunning(false);
    setFinished(false);
    progressRef.current = 0;
    carsRef.current = buildCars();
    accRef.current = 0;
    advance();
    commit();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [buildCars, advance, commit]);

  const leaderLap = snapshot.length
    ? Math.min(totalLaps, Math.floor(progressRef.current))
    : 0;

  return {
    snapshot,
    carsRef,
    running,
    finished,
    speed,
    leaderLap,
    totalLaps,
    start,
    pause,
    reset,
    setSpeed,
  };
}
