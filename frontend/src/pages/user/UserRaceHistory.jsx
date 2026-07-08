import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import {
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
  AnimatedNumber,
} from "../../components/motion";
import {
  PageHeader,
  Loader,
  EmptyState,
  StatCard,
  Tabs,
  SectionTitle,
  teamAccent,
} from "../../components/ui";
import * as Icons from "../../components/Icons";

const CHART_TOOLTIP = {
  background: "#14141e",
  border: "1px solid #38384c",
  borderRadius: 10,
  color: "#f4f4f8",
};

export default function UserRaceHistory() {
  const { data, loading, error } = useFetch(() => API.get("/race-history"), []);

  const seasons = [...(data || [])].sort((a, b) => b.year - a.year);
  const [view, setView] = useState("cards");

  if (loading) return <Loader label="Loading the archives…" />;

  if (error)
    return (
      <PageTransition>
        <PageHeader eyebrow="Hall of Fame" accent="RACE" title="History" />
        <EmptyState
          icon="⚠️"
          title="Could not load history"
          message="The championship archive is unavailable right now. Please try again."
        />
      </PageTransition>
    );

  if (!seasons.length)
    return (
      <PageTransition>
        <PageHeader eyebrow="Hall of Fame" accent="RACE" title="History" />
        <EmptyState
          icon="🏁"
          title="No seasons on record"
          message="Historical championship data has not been added yet."
        />
      </PageTransition>
    );

  // Most recent season — team wins colored per bar with <Cell>
  const latest = seasons[0];
  const latestTeamWins = [...(latest.teamWins || [])].sort(
    (a, b) => b.wins - a.wins,
  );

  // Aggregate: championship titles by driver across every season
  const titlesByDriver = {};
  seasons.forEach((s) => {
    if (!s.champion) return;
    if (!titlesByDriver[s.champion]) {
      titlesByDriver[s.champion] = { name: s.champion, titles: 0, color: null };
    }
    titlesByDriver[s.champion].titles += 1;
    const tw = (s.teamWins || []).find((t) => t.team === s.championTeam);
    if (tw?.color) titlesByDriver[s.champion].color = tw.color;
  });
  const driverTitles = Object.values(titlesByDriver)
    .sort((a, b) => b.titles - a.titles)
    .slice(0, 8);

  const totalTitles = driverTitles.reduce((a, d) => a + d.titles, 0);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Hall of Fame"
        accent="RACE"
        title="History"
        subtitle="Champions, constructors and race wins across the seasons."
        actions={
          <Tabs
            tabs={[
              { value: "cards", label: "Seasons" },
              { value: "charts", label: "Insights" },
            ]}
            active={view}
            onChange={setView}
          />
        }
      />

      <Reveal className="stats-grid" delay={0.05}>
        <StatCard
          label="Seasons Archived"
          value={seasons.length}
          accent="#e10600"
        />
        <StatCard
          label="Champions Crowned"
          value={totalTitles}
          accent="#27f4d2"
        />
        <StatCard
          label="Latest Season"
          value={latest.year}
          accent="#e10600"
          decimals={0}
        />
      </Reveal>

      {view === "charts" && (
        <>
          <Reveal className="chart-container" delay={0.05}>
            <h3 className="chart-title">
              World Titles by Driver — All Seasons
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={driverTitles}
                margin={{ top: 10, right: 12, left: -8, bottom: 4 }}
              >
                <CartesianGrid stroke="#262636" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#6b6b82"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={64}
                />
                <YAxis
                  stroke="#6b6b82"
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(225,6,0,0.08)" }}
                  contentStyle={CHART_TOOLTIP}
                />
                <Bar dataKey="titles" name="Titles" radius={[6, 6, 0, 0]}>
                  {driverTitles.map((d) => (
                    <Cell key={d.name} fill={d.color || "#e10600"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Reveal>

          <Reveal className="chart-container" delay={0.1}>
            <h3 className="chart-title">
              Race Wins by Team — {latest.year} Season
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={latestTeamWins}
                margin={{ top: 10, right: 12, left: -8, bottom: 4 }}
              >
                <CartesianGrid stroke="#262636" vertical={false} />
                <XAxis
                  dataKey="team"
                  stroke="#6b6b82"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={64}
                />
                <YAxis
                  stroke="#6b6b82"
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(39,244,210,0.08)" }}
                  contentStyle={CHART_TOOLTIP}
                />
                <Bar dataKey="wins" name="Wins" radius={[6, 6, 0, 0]}>
                  {latestTeamWins.map((tw) => (
                    <Cell key={tw.team} fill={tw.color || "#27f4d2"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Reveal>
        </>
      )}

      {view === "cards" && (
        <>
          <SectionTitle>Season Archive</SectionTitle>
          <Stagger className="card-grid">
            {seasons.map((s) => {
              const championColor = (s.teamWins || []).find(
                (t) => t.team === s.championTeam,
              )?.color;
              const topWins = [...(s.teamWins || [])].sort(
                (a, b) => b.wins - a.wins,
              );
              return (
                <StaggerItem key={s.year}>
                  <div
                    className="card"
                    style={teamAccent(championColor || "#e10600")}
                  >
                    <div className="flex-between">
                      <div
                        style={{
                          fontStyle: "italic",
                          fontWeight: 800,
                          fontSize: "2.6rem",
                          lineHeight: 1,
                          color: "var(--team-accent)",
                        }}
                      >
                        {s.year}
                      </div>
                      <div
                        className="text-muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                        }}
                      >
                        <Icons.IconCalendar />
                        <AnimatedNumber value={s.totalRaces} /> races
                      </div>
                    </div>

                    <div
                      className="section"
                      style={{ display: "grid", gap: 12 }}
                    >
                      <div className="team-detail-row">
                        <span
                          className="label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Icons.IconTrophy /> World Champion
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {s.champion}
                          {s.championTeam ? (
                            <span
                              className="text-muted"
                              style={{ fontWeight: 500 }}
                            >
                              {" "}
                              · {s.championTeam}
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <div className="team-detail-row">
                        <span
                          className="label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Icons.IconFlag /> Constructors' Champion
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {s.constructorChampion}
                        </span>
                      </div>
                    </div>

                    {topWins.length > 0 && (
                      <div className="section" style={{ display: "grid", gap: 8 }}>
                        {topWins.map((tw) => {
                          const pct =
                            s.totalRaces > 0
                              ? (tw.wins / s.totalRaces) * 100
                              : 0;
                          return (
                            <div
                              key={tw.team}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 120,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "var(--text-secondary)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {tw.team}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  background: "var(--bg-primary)",
                                  borderRadius: 6,
                                  height: 20,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    minWidth: tw.wins > 0 ? 26 : 0,
                                    height: "100%",
                                    background: tw.color || "#e10600",
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: 6,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: "#0b0b12",
                                  }}
                                >
                                  {tw.wins > 0 ? tw.wins : ""}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </>
      )}
    </PageTransition>
  );
}
