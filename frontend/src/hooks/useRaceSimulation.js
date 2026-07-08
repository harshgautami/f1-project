import { useRef, useState, useEffect, useCallback } from "react";

/* ---------------------------------------------------------------------------
   A lightweight, always-on race simulator. Each car accumulates "distance"
   measured in laps; pace is seeded from the driver's real stats (stronger
   drivers are quicker) with per-tick variation so genuine overtakes occur.
   The track position is distance % 1; the running order is distance, sorted.

   Returns a snapshot (committed ~20x/sec) plus play/pause/speed/reset controls.
   ------------------------------------------------------------------------- */

// Laps advanced per millisecond at pace 1.0, speed 1x. ~1 lap / 4.5s.
const RATE = 1 / 4500;
const COMMIT_MS = 50; // ~20 fps state commits

function seedPace(driver) {
  const pts = driver.totalPoints || 0;
  const wins = driver.totalRaceWins || 0;
  const titles = driver.worldChampionships || 0;
  // Normalize into a small pace band so the field stays close and racy.
  const strength = titles * 0.05 + wins * 0.0015 + pts * 0.00004;
  return 0.94 + Math.min(strength, 0.12);
}

export function useRaceSimulation(drivers, { totalLaps = 50 } = {}) {
  const carsRef = useRef([]);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const accRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(2);

  const [speed, setSpeedState] = useState(2);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [snapshot, setSnapshot] = useState([]);

  const buildCars = useCallback(
    () =>
      drivers.map((d, i) => ({
        id: d._id,
        name: `${d.firstName} ${d.lastName}`,
        short: (d.lastName || d.firstName || "").slice(0, 3).toUpperCase(),
        number: d.number,
        color: d.team?.color || "#e10600",
        team: d.team?.name || "",
        dist: -i * 0.006, // grid stagger — pole leads
        pace: seedPace(d),
        pos: i + 1,
        prevPos: i + 1,
        delta: 0,
      })),
    [drivers],
  );

  const commit = useCallback(() => {
    const cars = carsRef.current;
    const ordered = [...cars].sort((a, b) => b.dist - a.dist);
    ordered.forEach((c, idx) => {
      const pos = idx + 1;
      if (pos !== c.pos) {
        c.prevPos = c.pos;
        c.delta = c.pos - pos; // + = gained places
        c.pos = pos;
      }
    });
    const leader = ordered[0];
    if (leader && leader.dist >= totalLaps && runningRef.current) {
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
        lap: Math.max(0, Math.floor(c.dist)),
        trackPos: ((c.dist % 1) + 1) % 1,
        gap: leader ? Math.max(0, leader.dist - c.dist) : 0,
      })),
    );
  }, [totalLaps]);

  const tick = useCallback(
    (now) => {
      if (!runningRef.current) return;
      const dt = Math.min(now - lastRef.current, 80);
      lastRef.current = now;
      const cars = carsRef.current;
      for (const c of cars) {
        if (c.dist >= totalLaps) continue;
        const jitter = 1 + (Math.random() - 0.5) * 0.35;
        c.dist += c.pace * jitter * RATE * speedRef.current * dt;
      }
      accRef.current += dt;
      if (accRef.current >= COMMIT_MS) {
        accRef.current = 0;
        commit();
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [commit, totalLaps],
  );

  const start = useCallback(() => {
    if (runningRef.current || !carsRef.current.length) return;
    runningRef.current = true;
    setRunning(true);
    setFinished(false);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

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
    carsRef.current = buildCars();
    accRef.current = 0;
    commit();
  }, [buildCars, commit]);

  const setSpeed = useCallback((s) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  // (Re)initialize whenever the driver set changes.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    runningRef.current = false;
    setRunning(false);
    setFinished(false);
    carsRef.current = buildCars();
    accRef.current = 0;
    commit();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [buildCars, commit]);

  const leaderLap = snapshot.length ? snapshot[0].lap : 0;

  return {
    snapshot,
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
