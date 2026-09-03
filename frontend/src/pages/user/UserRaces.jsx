import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { useSeasons } from "../../hooks/useSeasons";
import { loaders } from "../../data/loaders";
import { withStatus } from "../../data/raceStatus";
import { PageTransition, Stagger, StaggerItem } from "../../components/motion";
import { Loader, EmptyState } from "../../components/ui";
import {
  HubHero,
  HubCountdown,
  HubStat,
  HubCTA,
  HubBar,
  HubSelect,
  HubTabs,
  HubPanelFoot,
  RankList,
  RankRow,
  SectionHead,
  CircuitOutline,
  useCircuitLib,
  useCircuitPath,
  fmtDate,
  trackTemp,
} from "../../components/hub";
import { RACE_SEASON, SEASONS } from "../../config/season";
import * as Icons from "../../components/Icons";

const STATUS_TABS = [
  { value: "all", label: "All rounds" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

/** Calendar card: ghost round number, circuit outline, result or countdown. */
function RaceCard({ race, isNext, path }) {
  const done = race.status === "completed";
  return (
    <StaggerItem>
      <Link
        to="/live"
        className={`hub-race-card${isNext ? " next" : ""}${done ? " done" : ""}`}
      >
        <span className="hub-race-round mono-num" aria-hidden="true">
          {String(race.round).padStart(2, "0")}
        </span>

        <div className="hub-race-head">
          <span className={`hub-race-status ${race.status}`}>{race.status}</span>
          {isNext && <span className="hub-race-next">Next up</span>}
        </div>

        {path && (
          <svg viewBox="0 0 1000 600" className="hub-race-track">
            <path d={path} pathLength="100" />
          </svg>
        )}

        <h3 className="hub-race-name">
          <span>{race.country}</span>
          <b>{race.name.replace(/\s*Grand Prix\s*$/i, "")}</b>
        </h3>
        <div className="hub-race-circuit">{race.circuit}</div>

        <div className="hub-race-foot">
          <span className="hub-race-date mono-num">
            <Icons.IconCalendar />
            {fmtDate(race.date)}
          </span>
          {done && race.winnerName ? (
            <span className="hub-race-winner">
              <Icons.IconTrophy />
              <b>{race.winnerName}</b>
            </span>
          ) : (
            <span className="hub-race-laps mono-num">{race.laps || "—"} laps</span>
          )}
        </div>
      </Link>
    </StaggerItem>
  );
}

function UserRaces() {
  const [status, setStatus] = useState("all");
  // Only offer seasons the database actually holds (see useSeasons).
  const { season, seasons, setSeason } = useSeasons("/races", RACE_SEASON, SEASONS);
  const { data, loading, error } = useFetch(loaders.races(season).fetch, [season], {
    key: loaders.races(season).key,
  });

  const getCircuit = useCircuitLib();

  // withStatus replaces the stored status with the effective one, so a
  // calendar that has not been re-synced since lights out still reads
  // "completed" on every round that has been run.
  const races = useMemo(() => withStatus(data), [data]);
  const nextRace = races.find((r) => r.status === "upcoming") || null;
  const heroRace = nextRace || races[races.length - 1] || null;
  const heroPath = useCircuitPath(heroRace);

  const countdown = useMemo(() => {
    if (!nextRace?.date) return null;
    const ms = Math.max(0, new Date(nextRace.date) - Date.now());
    return [
      [Math.floor(ms / 86400000), "days"],
      [Math.floor((ms % 86400000) / 3600000), "hrs"],
      [Math.floor((ms % 3600000) / 60000), "min"],
    ];
  }, [nextRace]);

  if (loading) return <Loader label="Loading race calendar" />;

  const filtered = status === "all" ? races : races.filter((r) => r.status === status);
  const completed = races.filter((r) => r.status === "completed");

  return (
    <PageTransition>
      <HubHero
        chip={nextRace ? "Next race" : "Season complete"}
        chipTone={nextRace ? "next" : "muted"}
        meta={heroRace ? `${trackTemp(heroRace.round)}°C` : `${races.length} rounds`}
        title={heroRace?.country || "Calendar"}
        ghost={season}
        to="/live"
        subtitle={heroRace?.circuit || `${races.length} Grands Prix`}
        art={<CircuitOutline d={heroPath} />}
        panel={
          <>
            {countdown ? (
              <HubCountdown blocks={countdown} />
            ) : (
              <HubStat tag="Rounds run" value={completed.length} total={races.length} />
            )}
            <RankList>
              {races
                .filter((r) => r.round >= (nextRace?.round ?? 1))
                .slice(0, 3)
                .map((r, i) => (
                  <RankRow
                    key={r._id}
                    pos={`R${r.round}`}
                    color={i === 0 ? "#e10600" : "#38384c"}
                    name={r.name.replace(/\s*Grand Prix\s*$/i, " GP")}
                    right={fmtDate(r.date)}
                    index={i}
                    lead={i === 0}
                  />
                ))}
            </RankList>
            <HubCTA to="/live">Open race tracker</HubCTA>
            {heroRace && <HubPanelFoot>Round {heroRace.round} of {races.length}</HubPanelFoot>}
          </>
        }
      />

      <HubBar>
        <HubTabs tabs={STATUS_TABS} active={status} onChange={setStatus} />
        <HubSelect
          label="Season"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          options={seasons.map((s) => ({ value: s, label: s }))}
        />
        <span className="hub-bar-count mono-num">
          {filtered.length}/{races.length}
        </span>
      </HubBar>

      {error && (
        <EmptyState
          icon="⚠️"
          title="Couldn't load the calendar"
          message="There was a problem fetching the race schedule. Please try again."
        />
      )}

      {!error && filtered.length === 0 && (
        <EmptyState
          icon="🏁"
          title="No races found"
          message="No Grands Prix match this filter for the selected season."
        />
      )}

      {!error && filtered.length > 0 && (
        <>
          <SectionHead label={`${season} calendar`} />
          <Stagger className="hub-card-grid">
            {filtered.map((race) => (
              <RaceCard
                key={race._id}
                race={race}
                isNext={!!nextRace && race._id === nextRace._id}
                path={getCircuit?.(race.circuit, race.city, race.country)?.d}
              />
            ))}
          </Stagger>
        </>
      )}
    </PageTransition>
  );
}

export default UserRaces;
