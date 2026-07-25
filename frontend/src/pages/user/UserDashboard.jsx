import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import {
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
  Marquee,
  AnimatedNumber,
} from "../../components/motion";
import { Loader, EmptyState } from "../../components/ui";
import F1Car from "../../components/F1Car";
import { teamColor } from "../../data/teamColors";
import { RACE_SEASON, STANDINGS_SEASON } from "../../config/season";
import { IconChevronRight } from "../../components/Icons";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const splitName = (full = "") => {
  const parts = String(full).trim().split(/\s+/);
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1] || "",
  };
};

/* Deterministic per-round "track temp" so the readout is stable per GP. */
const trackTemp = (round = 3) => (21 + ((round * 53) % 90) / 10).toFixed(1);

/* The circuit library is ~350KB, so it stays out of the landing chunk: load
   it on demand and let the outline draw itself in whenever it arrives (the
   draw-in animation makes the late paint feel intentional). Shared with the
   Live page's chunk, so it's fetched at most once. */
function useCircuitPath(race) {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!race) return undefined;
    let alive = true;
    import("../../data/circuits")
      .then((m) => {
        if (!alive) return;
        const c = m.getCircuit(race.circuit, race.city, race.country);
        setD(c?.d || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [race]);
  return d;
}

/* Animated circuit outline: asphalt base, draw-in racing line, and a red
   "comet" endlessly lapping the track. pathLength=100 normalises every
   circuit so the dash keyframes work for any outline. */
function CircuitOutline({ d, className = "" }) {
  if (!d) return null;
  return (
    <svg viewBox="0 0 1000 600" className={`hub-track-svg ${className}`}>
      <path d={d} className="hub-track-asphalt" pathLength="100" />
      <path d={d} className="hub-track-line" pathLength="100" />
      <path d={d} className="hub-track-comet" pathLength="100" />
    </svg>
  );
}

function KineticTitle({ country, season }) {
  let i = 0;
  return (
    <h1 className="hub-title">
      {String(country)
        .toUpperCase()
        .split(" ")
        .map((word, w) => (
          <span key={w} className="hub-title-word">
            {word.split("").map((ch) => (
              <span key={i} className="hub-title-letter" style={{ "--i": i++ }}>
                {ch}
              </span>
            ))}{" "}
          </span>
        ))}
      <span className="hub-title-season hub-title-letter" style={{ "--i": i + 1 }}>
        {season}
      </span>
      <span className="hub-title-chev" aria-hidden="true">
        ›
      </span>
    </h1>
  );
}

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
    <section className="hub-hero">
      <div className="hub-hero-car" aria-hidden="true">
        <F1Car />
      </div>

      <div className="hub-hero-main">
        <div className="hub-status">
          <span className={`hub-live-chip ${isReplay ? "" : "next"}`}>
            <span className="hub-live-dot" />
            {isReplay ? "Live" : "Next race"}
          </span>
          <span className="hub-temp mono-num">{trackTemp(race?.round)}°C</span>
        </div>

        <Link to="/live" className="hub-title-link" aria-label="Open the live race tracker">
          <KineticTitle country={race?.country || "Grand Prix"} season={race?.season || RACE_SEASON} />
        </Link>
        <div className="hub-circuit">{race?.circuit || race?.name}</div>

        <div className="hub-track">
          <CircuitOutline d={circuitPath} />
        </div>
      </div>

      <aside className="hub-session">
        {isReplay ? (
          <div className="hub-lap">
            <span className="hub-lap-tag">Lap</span>
            <div className="hub-lap-count mono-num">
              <AnimatedNumber value={race?.laps || 0} duration={2.4} />
              <span className="hub-lap-total">/{race?.laps || "—"}</span>
            </div>
          </div>
        ) : (
          <div className="hub-lap">
            <span className="hub-lap-tag">Lights out in</span>
            <div className="hub-countdown mono-num">
              {[
                [countdown?.days ?? 0, "days"],
                [countdown?.hours ?? 0, "hrs"],
                [countdown?.mins ?? 0, "min"],
              ].map(([v, l]) => (
                <span key={l} className="hub-count-block">
                  <span className="hub-count-num">
                    <AnimatedNumber value={v} duration={1.6} />
                  </span>
                  <span className="hub-count-label">{l}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="hub-top3">
          {top3.map((row, i) => {
            const { first, last } = splitName(row.name);
            return (
              <div
                key={row.name || i}
                className="hub-top3-row"
                style={{ "--team-accent": row.color, "--i": i }}
              >
                <span className="hub-top3-pos mono-num">{i + 1}</span>
                <span className="hub-top3-bar" />
                <span className="hub-top3-name">
                  {first} <b>{last}</b>
                </span>
                <span className="hub-top3-gap mono-num">{row.gap}</span>
              </div>
            );
          })}
        </div>

        <Link to="/live" className="hub-cta">
          {isReplay ? "Join live session" : "Open race tracker"}
        </Link>
        {!isReplay && nextRace && (
          <div className="hub-session-foot">{fmtDate(nextRace.date)}</div>
        )}
      </aside>
    </section>
  );
}

/* ---- Featured editorial cards, generated from real season data ---------- */

function FeaturedCard({ to, tag, headline, meta, children, accent }) {
  return (
    <StaggerItem className="hub-featured-item">
      <Link to={to} className="hub-featured-card">
        <div className="hub-featured-media" style={{ "--team-accent": accent }}>
          <div className="hub-media-art">{children}</div>
          <span className="hub-featured-tag">{tag}</span>
        </div>
        <h3 className="hub-featured-headline">{headline}</h3>
        <div className="hub-featured-meta">
          {meta} <IconChevronRight />
        </div>
      </Link>
    </StaggerItem>
  );
}

function Featured({ lastRace, standings, nextRace }) {
  const winner = lastRace?.results?.[0];
  const leader = standings[0];
  const chaser = standings[1];
  const podium = standings.slice(0, 3);
  const nextCircuitPath = useCircuitPath(nextRace);

  const cards = [];

  if (winner) {
    cards.push(
      <FeaturedCard
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
          <span className="hub-art-report-name">
            {splitName(winner.driver).last}
          </span>
        </div>
      </FeaturedCard>,
    );
  }

  if (leader) {
    cards.push(
      <FeaturedCard
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
              <span className="hub-podium-code">
                {splitName(s.name).last.slice(0, 3)}
              </span>
              <span className="hub-podium-pts mono-num">{s.points}</span>
            </div>
          ))}
        </div>
      </FeaturedCard>,
    );
  }

  if (nextRace) {
    cards.push(
      <FeaturedCard
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
      </FeaturedCard>,
    );
  }

  if (!cards.length) return null;
  return (
    <section className="hub-featured">
      <div className="hub-featured-head">
        <span className="eyebrow">Featured</span>
        <Link to="/races" className="btn btn-sm btn-ghost">
          Full calendar <IconChevronRight />
        </Link>
      </div>
      <Stagger className="hub-featured-grid">{cards}</Stagger>
    </section>
  );
}

/* ---- Lower zone: schedule + title fight --------------------------------- */

function Schedule({ races }) {
  return (
    <Reveal className="card">
      <div className="card-header">
        <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
          Schedule
        </h3>
        <Link to="/races" className="btn btn-sm btn-ghost">
          View all <IconChevronRight />
        </Link>
      </div>
      {races.length === 0 ? (
        <p className="text-muted">No upcoming races — season complete.</p>
      ) : (
        <div className="hub-sched">
          {races.map((race) => (
            <div key={race._id} className="hub-sched-row">
              <span className="hub-sched-round">
                R{String(race.round).padStart(2, "0")}
              </span>
              <span className="hub-sched-gp">
                <b>{race.name}</b>
                <span>{race.circuit}</span>
              </span>
              <span className="hub-sched-date mono-num">{fmtDate(race.date)}</span>
            </div>
          ))}
        </div>
      )}
    </Reveal>
  );
}

function TitleFight({ standings }) {
  const top = standings.slice(0, 5);
  const maxPts = top.length ? top[0].points : 0;
  return (
    <Reveal className="card" delay={0.08}>
      <div className="card-header">
        <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
          {STANDINGS_SEASON} Drivers&apos; Title
        </h3>
        <Link to="/standings" className="btn btn-sm btn-ghost">
          View all <IconChevronRight />
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {top.map((d) => (
          <div key={d._id || d.position}>
            <div className="flex-between" style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                <span
                  className={`pos-medal ${d.position <= 3 ? `pos-${d.position}` : ""}`}
                  style={{ marginRight: 8 }}
                >
                  P{d.position}
                </span>
                {d.name}
              </span>
              <span style={{ fontWeight: 700 }} className="mono-num">
                {d.points} pts
              </span>
            </div>
            <div
              style={{
                height: 7,
                borderRadius: 4,
                background: "var(--bg-primary)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${maxPts ? (d.points / maxPts) * 100 : 0}%`,
                  borderRadius: 4,
                  background: teamColor(d.team),
                  transition: "width 0.7s var(--ease-out)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

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
