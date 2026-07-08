import React, { useState, useMemo } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { useRaceSimulation } from "../../hooks/useRaceSimulation";
import { PageTransition, motion, AnimatePresence } from "../../components/motion";
import { PageHeader, Loader, EmptyState } from "../../components/ui";
import StartLights from "../../components/StartLights";
import TrackMap from "../../components/TrackMap";
import { getCircuit } from "../../data/circuits";
import { RACE_SEASON } from "../../config/season";
import { IconChart } from "../../components/Icons";

const SPEEDS = [1, 2, 4, 8];

function RaceSim({ drivers, race }) {
  const totalLaps = Math.min(race?.laps || 50, 60);
  const {
    snapshot,
    running,
    finished,
    speed,
    leaderLap,
    start,
    pause,
    reset,
    setSpeed,
  } = useRaceSimulation(drivers, { totalLaps });

  const [launching, setLaunching] = useState(false);
  const handleStart = () => (running ? pause() : setLaunching(true));

  return (
    <div className="live-grid">
      <AnimatePresence>
        {launching && (
          <StartLights
            label={race?.name || "Formation lap"}
            onComplete={() => {
              setLaunching(false);
              start();
            }}
          />
        )}
      </AnimatePresence>
      <div>
        <div className="live-controls">
          <button
            className={`btn ${running ? "btn-secondary" : "btn-primary"}`}
            onClick={handleStart}
            disabled={finished || launching}
          >
            {running ? "⏸ Pause" : finished ? "Finished" : "▶ Start Race"}
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            ↺ Reset
          </button>
          <div className="speed-toggle">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? "active" : ""}`}
                onClick={() => setSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
          <div className="live-lap mono-num">
            <span className="text-muted">LAP</span> {leaderLap}
            <span className="text-muted"> / {totalLaps}</span>
          </div>
          {running && <span className="live-dot" title="Live" />}
        </div>

        <TrackMap
          cars={snapshot}
          path={getCircuit(race?.circuit, race?.city, race?.country)?.d}
          name={race?.name}
        />

        {finished && (
          <div className="live-winner">
            🏆 Winner: <strong>{snapshot[0]?.name}</strong> — {snapshot[0]?.team}
          </div>
        )}
      </div>

      <div className="live-standings-panel">
        <div className="live-standings-head">
          Live Order {running && <span className="text-muted">· updating</span>}
        </div>
        <div className="live-standings">
          {snapshot.map((c) => (
            <motion.div
              layout
              key={c.id}
              transition={{ type: "spring", stiffness: 700, damping: 40 }}
              className="live-row"
              style={{ "--team-accent": c.color }}
            >
              <span className="live-pos mono-num">{c.pos}</span>
              <span
                className={`live-delta ${c.delta > 0 ? "up" : c.delta < 0 ? "down" : ""}`}
              >
                {c.delta > 0 ? "▲" : c.delta < 0 ? "▼" : "—"}
              </span>
              <span className="live-num mono-num" style={{ color: c.color }}>
                {c.number}
              </span>
              <span className="live-name">{c.name}</span>
              <span className="live-gap mono-num">
                {c.pos === 1 ? "LEADER" : `+${c.gap.toFixed(1)}`}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LiveRace() {
  const { data, loading, error } = useFetch(async () => {
    const [drivers, races] = await Promise.all([
      API.get("/drivers"),
      API.get(`/races?season=${RACE_SEASON}`),
    ]);
    return { drivers: drivers.data, races: races.data };
  }, []);

  const races = useMemo(
    () => (data?.races || []).slice().sort((a, b) => a.round - b.round),
    [data],
  );
  const [round, setRound] = useState(null);

  if (loading) return <Loader label="Entering the pit lane" />;

  const drivers = data?.drivers || [];
  if (error || !drivers.length || !races.length) {
    return (
      <PageTransition>
        <EmptyState
          icon="🏎️"
          title="Race control unavailable"
          message="We need drivers and a race calendar to run the simulation. Seed the database and try again."
        />
      </PageTransition>
    );
  }

  const selectedRound = round ?? races[0].round;
  const race = races.find((r) => r.round === selectedRound) || races[0];

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Race Control"
        accent="Live"
        title="Race Tracker"
        subtitle="A real-time race simulation — watch the grid circulate and the order change the instant a driver makes a move."
        actions={
          <span className="live-badge">
            <IconChart /> Simulation
          </span>
        }
      />

      <div className="filter-bar">
        <label style={{ color: "var(--text-muted)", fontSize: 13, alignSelf: "center" }}>
          Grand Prix:
        </label>
        <select
          value={selectedRound}
          onChange={(e) => setRound(Number(e.target.value))}
        >
          {races.map((r) => (
            <option key={r._id} value={r.round}>
              R{r.round} · {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* keyed by round so switching Grand Prix starts a fresh race */}
      <RaceSim key={selectedRound} drivers={drivers} race={race} />
    </PageTransition>
  );
}
