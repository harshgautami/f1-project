import React from "react";
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
import { PageHeader, Loader } from "../../components/ui";
import { RACE_SEASON, STANDINGS_SEASON, CALENDAR_ROUNDS } from "../../config/season";
import { IconChevronRight } from "../../components/Icons";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function UserDashboard() {
  const { data, loading } = useFetch(async () => {
    const [teams, drivers, races, standings] = await Promise.all([
      API.get("/teams"),
      API.get("/drivers"),
      API.get(`/races?season=${RACE_SEASON}&status=upcoming`),
      API.get(`/standings?season=${STANDINGS_SEASON}&type=driver`),
    ]);
    return {
      counts: {
        teams: teams.data.length,
        drivers: drivers.data.length,
        races: races.data.length,
        calendar: CALENDAR_ROUNDS,
      },
      upcoming: races.data.slice(0, 5),
      topDrivers: standings.data.slice(0, 5),
    };
  }, []);

  if (loading) return <Loader label="Formation lap" />;

  const { counts, upcoming, topDrivers } = data;
  const maxPts = topDrivers.length ? topDrivers[0].points : 0;

  const STATS = [
    { label: "Teams", value: counts.teams, accent: "#e10600" },
    { label: "Drivers", value: counts.drivers, accent: "#3671c6" },
    { label: `Races in ${RACE_SEASON}`, value: counts.races, accent: "#27f4d2" },
    { label: "Grand Prix Calendar", value: counts.calendar, accent: "#ff8000" },
  ];

  return (
    <PageTransition>
      <PageHeader
        eyebrow={`${RACE_SEASON} Season`}
        accent="F1"
        title="Dashboard"
        subtitle="Your paddock overview — the grid, the calendar and the championship fight."
      />

      <Stagger className="stats-grid">
        {STATS.map((s) => (
          <StaggerItem key={s.label} className="stat-card" style={{ "--team-accent": s.accent }}>
            <div className="stat-value mono-num">
              <AnimatedNumber value={s.value} />
            </div>
            <div className="stat-label">{s.label}</div>
          </StaggerItem>
        ))}
      </Stagger>

      <div style={{ margin: "6px 0 28px" }}>
        <Marquee
          items={[
            `${RACE_SEASON} World Championship`,
            "23 Circuits",
            "10 Teams",
            "20 Drivers",
            "Lights Out",
            "Chequered Flag",
          ]}
        />
      </div>

      <div className="grid-2">
        <Reveal className="card">
          <div className="card-header">
            <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
              Upcoming Races
            </h3>
            <Link to="/races" className="btn btn-sm btn-ghost">
              View all <IconChevronRight />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-muted">No upcoming races.</p>
          ) : (
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Rd</th>
                    <th>Grand Prix</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((race) => (
                    <tr key={race._id}>
                      <td>
                        <span className="race-round">R{race.round}</span>
                      </td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                        {race.name}
                      </td>
                      <td style={{ color: "var(--accent-teal)" }}>
                        {fmtDate(race.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Reveal>

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
            {topDrivers.map((d) => (
              <div key={d._id}>
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
                      background:
                        d.position <= 3 ? "var(--accent-red)" : "var(--accent-blue)",
                      transition: "width 0.7s var(--ease-out)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </PageTransition>
  );
}
