import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Stagger, Marquee } from "../../components/motion";
import { Loader, EmptyState } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCountdown,
  HubCTA,
  HubPanelFoot,
  HubCard,
  RankList,
  RankRow,
  SectionHead,
  EditorialCard,
  CircuitOutline,
  useCircuitPath,
  splitName,
  driverCode,
  fmtDate,
  trackTemp,
} from "../../components/hub";
import { teamColor } from "../../data/teamColors";
import { RACE_SEASON, STANDINGS_SEASON } from "../../config/season";

/* ---- Hero ---------------------------------------------------------------- */

function Hero({ race, isReplay, top3, nextRace }) {
  const circuitPath = useCircuitPath(race);
  const countdown = useMemo(() => {
    if (isReplay || !race?.date) return null;
    const ms = Math.max(0, new Date(race.date) - Date.now());
    return {
      days: Math.floor(ms / 86400000),
      hours: Math.floor((ms % 86400000) / 3600000),
      mins: Math.floor((ms % 3600000) / 60000),
    };
  }, [race, isReplay]);

  return (
    <HubHero
      chip={isReplay ? "Live" : "Next race"}
      chipTone={isReplay ? "live" : "next"}
      meta={`${trackTemp(race?.round)}°C`}
      title={race?.country || "Grand Prix"}
      ghost={race?.season || RACE_SEASON}
      to="/live"
      subtitle={race?.circuit || race?.name}
      art={<CircuitOutline d={circuitPath} />}
      panel={
        <>
          {isReplay ? (
            <HubStat tag="Lap" value={race?.laps || 0} total={race?.laps || "—"} />
          ) : (
            <HubCountdown
              blocks={[
                [countdown?.days ?? 0, "days"],
                [countdown?.hours ?? 0, "hrs"],
                [countdown?.mins ?? 0, "min"],
              ]}
            />
          )}

          <RankList>
            {top3.map((row, i) => (
              <RankRow
                key={row.name || i}
                pos={i + 1}
                color={row.color}
                name={row.name}
                right={row.gap}
                index={i}
                lead={i === 0}
              />
            ))}
          </RankList>

          <HubCTA to="/live">
            {isReplay ? "Join live session" : "Open race tracker"}
          </HubCTA>
          {!isReplay && nextRace && <HubPanelFoot>{fmtDate(nextRace.date)}</HubPanelFoot>}
        </>
      }
    />
  );
}

/* ---- Featured editorial cards, generated from real season data ----------- */

function Featured({ lastRace, standings, nextRace }) {
  const winner = lastRace?.results?.[0];
  const leader = standings[0];
  const chaser = standings[1];
  const podium = standings.slice(0, 3);
  const nextCircuitPath = useCircuitPath(nextRace);

  const cards = [];

  if (winner) {
    cards.push(
      <EditorialCard
        key="report"
        to="/history"
        tag="Race report"
        accent={winner.color || "#e10600"}
        headline={`How ${splitName(winner.driver).last} won the ${lastRace.name} from P${winner.grid || 1}`}
        meta={fmtDate(lastRace.date)}
      >
        <div className="hub-art-report">
          <span className="hub-art-checkers" />
          <span className="hub-art-num mono-num">{winner.number ?? 1}</span>
          <span className="hub-art-report-name">{splitName(winner.driver).last}</span>
        </div>
      </EditorialCard>,
    );
  }

  if (leader) {
    cards.push(
      <EditorialCard
        key="standings"
        to="/standings"
        tag="Standings"
        accent={teamColor(leader.team)}
        headline={
          chaser
            ? `${leader.name} leads the drivers' championship by ${Math.round(
                leader.points - chaser.points,
              )} points`
            : `${leader.name} tops the drivers' championship`
        }
        meta={`Season ${STANDINGS_SEASON}`}
      >
        <div className="hub-art-podium">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((s) => (
            <div
              key={s.position}
              className={`hub-podium-bar pos-${s.position}`}
              style={{ "--team-accent": teamColor(s.team) }}
            >
              <span className="hub-podium-code">{driverCode(s.name)}</span>
              <span className="hub-podium-pts mono-num">{s.points}</span>
            </div>
          ))}
        </div>
      </EditorialCard>,
    );
  }

  if (nextRace) {
    cards.push(
      <EditorialCard
        key="preview"
        to="/races"
        tag="Preview"
        accent="#e10600"
        headline={`What to watch for at the ${nextRace.name}: the circuit, the stakes and the strategy`}
        meta={fmtDate(nextRace.date)}
      >
        <div className="hub-art-watch">
          {nextCircuitPath && (
            <svg viewBox="0 0 1000 600" className="hub-art-watch-track">
              <path d={nextCircuitPath} pathLength="100" />
            </svg>
          )}
          <span className="hub-watch-line">What to</span>
          <span className="hub-watch-line red">Watch</span>
          <span className="hub-watch-line">For</span>
        </div>
      </EditorialCard>,
    );
  }

  if (!cards.length) return null;
  return (
    <section className="hub-featured">
      <SectionHead label="Featured" to="/races" action="Full calendar" />
      <Stagger className="hub-featured-grid">{cards}</Stagger>
    </section>
  );
}

/* ---- Lower zone: schedule + title fight --------------------------------- */

function Schedule({ races }) {
  return (
    <HubCard title="Schedule" to="/races">
      {races.length === 0 ? (
        <p className="text-muted">No upcoming races — season complete.</p>
      ) : (
        <div className="hub-sched">
          {races.map((race) => (
            <Link key={race._id} to="/races" className="hub-sched-row">
              <span className="hub-sched-round">
                R{String(race.round).padStart(2, "0")}
              </span>
              <span className="hub-sched-gp">
                <b>{race.name}</b>
                <span>{race.circuit}</span>
              </span>
              <span className="hub-sched-date mono-num">{fmtDate(race.date)}</span>
            </Link>
          ))}
        </div>
      )}
    </HubCard>
  );
}

function TitleFight({ standings }) {
  const top = standings.slice(0, 5);
  const maxPts = top.length ? top[0].points : 0;
  return (
    <HubCard title={`${STANDINGS_SEASON} Drivers' Title`} to="/standings">
      <div className="hub-meters">
        {top.map((d, i) => (
          <div
            key={d._id || d.position}
            className="hub-meter-row"
            style={{ "--team-accent": teamColor(d.team), "--i": i }}
          >
            <span className="hub-meter-pos mono-num">P{d.position}</span>
            <span className="hub-meter-name">{d.name}</span>
            <span className="hub-meter-track">
              <span
                className="hub-meter-fill"
                style={{ width: `${maxPts ? (d.points / maxPts) * 100 : 0}%` }}
              />
            </span>
            <span className="hub-meter-val mono-num">{d.points}</span>
          </div>
        ))}
      </div>
    </HubCard>
  );
}

/* ---- Page --------------------------------------------------------------- */

export default function UserDashboard() {
  const { data, loading } = useFetch(async () => {
    const [races, standings] = await Promise.all([
      API.get(`/races?season=${RACE_SEASON}`),
      API.get(`/standings?season=${STANDINGS_SEASON}&type=driver`),
    ]);
    return { races: races.data, standings: standings.data };
  }, []);

  if (loading) return <Loader label="Formation lap" />;

  const races = (data?.races || []).slice().sort((a, b) => a.round - b.round);
  const standings = data?.standings || [];

  if (!races.length) {
    return (
      <PageTransition>
        <EmptyState
          icon="🏎️"
          title="No season data yet"
          message="Sync the season calendar to light up the home hub."
        />
      </PageTransition>
    );
  }

  const completed = races.filter((r) => r.results && r.results.length > 0);
  const lastRace = completed[completed.length - 1] || null;
  const now = Date.now();
  const nextRace =
    races.find((r) => new Date(r.date).getTime() > now) ||
    races.find((r) => r.status === "upcoming") ||
    null;

  const isReplay = !!lastRace;
  const heroRace = lastRace || nextRace || races[0];

  // Replay hero: real podium + real gaps. Upcoming hero: championship top 3.
  const top3 = isReplay
    ? heroRace.results.slice(0, 3).map((r) => ({
        name: r.driver,
        color: r.color || "#e10600",
        gap: r.position === 1 ? "Leader" : r.time || r.status || "—",
      }))
    : standings.slice(0, 3).map((s) => ({
        name: s.name,
        color: teamColor(s.team),
        gap:
          s.position === 1
            ? "Leader"
            : `-${Math.round(standings[0].points - s.points)} pts`,
      }));

  const upcoming = nextRace
    ? races.filter((r) => r.round >= nextRace.round).slice(0, 5)
    : [];

  return (
    <PageTransition>
      <Hero race={heroRace} isReplay={isReplay} top3={top3} nextRace={nextRace} />

      <Featured lastRace={lastRace} standings={standings} nextRace={nextRace} />

      <div style={{ margin: "6px 0 28px" }}>
        <Marquee
          items={[
            `${RACE_SEASON} World Championship`,
            heroRace?.name || "Grand Prix",
            `${races.length} Rounds`,
            "Lights Out",
            "Chequered Flag",
            "Box Box",
          ]}
        />
      </div>

      <div className="grid-2">
        <Schedule races={upcoming} />
        <TitleFight standings={standings} />
      </div>
    </PageTransition>
  );
}
