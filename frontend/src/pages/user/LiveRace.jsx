import React, { useState, useMemo, useEffect } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { useRaceSimulation } from "../../hooks/useRaceSimulation";
import { useRaceReplay } from "../../hooks/useRaceReplay";
import { PageTransition, motion, AnimatePresence } from "../../components/motion";
import { Loader, EmptyState } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubBar,
  HubSelect,
  RankList,
  RankRow,
  CircuitOutline,
  trackTemp,
} from "../../components/hub";
import StartLights from "../../components/StartLights";
import TrackMap from "../../components/TrackMap";
import { getCircuit } from "../../data/circuits";
import { SEASONS, RACE_SEASON } from "../../config/season";

const SPEEDS = [1, 2, 4, 8];

/* The live session view: the same hero as every other page, except its panel is
   wired straight to the running engine — lap counter, live top three and the
   start/pause CTA. Below it, the track map and the full classification.
   `filters` is injected as a node so the season/GP pickers can sit between the
   hero and the stage without the engine having to live above them. */
function SessionView({ engine, race, mode, season, filters }) {
  const {
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
  } = engine;

  const [launching, setLaunching] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const handleStart = () => (running ? pause() : setLaunching(true));
  const selected = snapshot.find((c) => c.id === selectedId);
  const isReplay = mode === "replay";
  const circuitPath = getCircuit(race?.circuit, race?.city, race?.country)?.d;

  return (
    <>
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

      <HubHero
        chip={running ? "Live" : finished ? "Chequered flag" : isReplay ? "Replay" : "Simulation"}
        chipTone={running ? "live" : finished ? "muted" : "next"}
        meta={`${trackTemp(race?.round)}°C`}
        title={race?.country || "Grand Prix"}
        ghost={race?.season || season}
        subtitle={race?.circuit || race?.name}
        art={<CircuitOutline d={circuitPath} />}
        panel={
          <>
            <HubStat tag="Lap" value={leaderLap} total={totalLaps} animate={false} />

            <RankList>
              {snapshot.slice(0, 3).map((c, i) => (
                <RankRow
                  key={c.id}
                  pos={c.pos}
                  color={c.color}
                  name={c.name}
                  right={
                    c.out ? "DNF" : c.pos === 1 ? "Leader" : `+${c.gap.toFixed(1)}`
                  }
                  index={i}
                  lead={i === 0}
                />
              ))}
            </RankList>

            <HubCTA onClick={handleStart} tone={finished ? "spent" : ""}>
              {running
                ? "Pause session"
                : finished
                  ? "Session complete"
                  : isReplay
                    ? "Join live session"
                    : "Start the race"}
            </HubCTA>
          </>
        }
      />

      {filters}

      <div className="live-grid">
        <div>
          <div className="live-controls">
            <button
              className={`btn ${running ? "btn-secondary" : "btn-primary"}`}
              onClick={handleStart}
              disabled={finished || launching}
            >
              {running ? "⏸ Pause" : finished ? "Finished" : isReplay ? "▶ Replay" : "▶ Start"}
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
            {selected && (
              <span className="focus-chip" style={{ "--team-accent": selected.color }}>
                Tracking <strong>{selected.name}</strong>
                <button
                  className="focus-clear"
                  onClick={() => setSelectedId(null)}
                  aria-label="Clear driver focus"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <TrackMap
            carsRef={carsRef}
            snapshot={snapshot}
            path={circuitPath}
            name={race?.name}
            selectedId={selectedId}
            onSelectCar={setSelectedId}
          />

          {finished && (
            <div className="live-winner">
              🏆 Winner: <strong>{snapshot[0]?.name}</strong> — {snapshot[0]?.team}
              {isReplay && race?.fastestLap && (
                <span className="text-muted"> · Fastest lap {race.fastestLap}</span>
              )}
            </div>
          )}
        </div>

        <div className="live-standings-panel">
          <div className="live-standings-head">
            {isReplay ? "Classification" : "Live order"}
            {running && <span className="text-muted"> · updating</span>}
          </div>
          <div className="live-standings">
            {snapshot.map((c) => (
              <motion.div
                layout
                key={c.id}
                transition={{ type: "spring", stiffness: 700, damping: 40 }}
                className={`live-row${c.id === selectedId ? " selected" : ""}${
                  c.out ? " out" : ""
                }`}
                style={{ "--team-accent": c.color }}
                onClick={() => setSelectedId((cur) => (cur === c.id ? null : c.id))}
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
                  {c.out
                    ? "DNF"
                    : c.pos === 1
                      ? isReplay
                        ? "P1"
                        : "LEADER"
                      : `+${c.gap.toFixed(1)}`}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* Real Grand Prix replay — resolves to the official finishing order. */
function ReplayStage(props) {
  const engine = useRaceReplay(props.race?.results || [], {
    totalLaps: props.race?.laps,
  });
  return <SessionView {...props} engine={engine} mode="replay" />;
}

/* Fallback live simulation (for races with no result yet, e.g. upcoming). */
function SimStage({ drivers, ...props }) {
  const totalLaps = Math.min(props.race?.laps || 50, 60);
  const engine = useRaceSimulation(drivers, { totalLaps });
  return <SessionView {...props} engine={engine} mode="sim" />;
}

export default function LiveRace() {
  const [season, setSeason] = useState(RACE_SEASON);
  const [round, setRound] = useState(null);

  const { data, loading, error } = useFetch(async () => {
    const [drivers, races] = await Promise.all([
      API.get("/drivers"),
      API.get(`/races?season=${season}`),
    ]);
    return { drivers: drivers.data, races: races.data };
  }, [season]);

  // Switching season clears the selected round so the default re-resolves.
  useEffect(() => {
    setRound(null);
  }, [season]);

  const races = useMemo(
    () => (data?.races || []).slice().sort((a, b) => a.round - b.round),
    [data],
  );

  if (loading) return <Loader label="Entering the pit lane" />;

  const drivers = data?.drivers || [];
  if (error || !races.length) {
    return (
      <PageTransition>
        <EmptyState
          icon="🏎️"
          title="Race control unavailable"
          message="We need a race calendar to run the tracker. Sync the season data and try again."
        />
      </PageTransition>
    );
  }

  const withResults = races.filter((r) => r.results && r.results.length > 0);
  // Default to the most recent race that actually has a result.
  const defaultRound = withResults.length
    ? withResults[withResults.length - 1].round
    : races[0].round;
  const selectedRound = round ?? defaultRound;
  const race = races.find((r) => r.round === selectedRound) || races[0];
  const hasResults = !!(race.results && race.results.length > 0);

  const filters = (
    <HubBar>
      <HubSelect
        label="Season"
        value={season}
        onChange={(e) => setSeason(Number(e.target.value))}
        options={SEASONS.map((s) => ({ value: s, label: s }))}
      />
      <HubSelect
        label="Grand Prix"
        value={selectedRound}
        onChange={(e) => setRound(Number(e.target.value))}
        options={races.map((r) => ({
          value: r.round,
          label: `R${r.round} · ${r.name}${
            r.results && r.results.length ? "" : " (upcoming)"
          }`,
        }))}
      />
      <span className="hub-bar-count mono-num">
        {hasResults ? "Real replay" : "Simulation"}
      </span>
    </HubBar>
  );

  return (
    <PageTransition>
      {/* keyed so switching race starts a fresh engine */}
      {hasResults ? (
        <ReplayStage
          key={`${season}-${selectedRound}`}
          race={race}
          season={season}
          filters={filters}
        />
      ) : (
        <SimStage
          key={`${season}-${selectedRound}`}
          drivers={drivers}
          race={race}
          season={season}
          filters={filters}
        />
      )}
    </PageTransition>
  );
}
