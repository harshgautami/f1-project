import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import {
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/motion";
import { Loader, EmptyState } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubBar,
  HubTabs,
  HubCard,
  HubStrip,
  RankList,
  RankRow,
  SectionHead,
  splitName,
  driverCode,
} from "../../components/hub";

const CHART_TOOLTIP = {
  background: "#0d0d14",
  border: "1px solid #38384c",
  borderRadius: 10,
  color: "#f4f4f8",
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
};

/** Season card: ghost year, both champions, and the team win split. */
function SeasonCard({ season }) {
  const championColor =
    (season.teamWins || []).find((t) => t.team === season.championTeam)?.color ||
    "#e10600";
  const wins = [...(season.teamWins || [])].sort((a, b) => b.wins - a.wins);
  const { first, last } = splitName(season.champion || "");

  return (
    <StaggerItem>
      <article className="hub-season-card" style={{ "--team-accent": championColor }}>
        <span className="hub-season-year mono-num" aria-hidden="true">
          {season.year}
        </span>

        <div className="hub-season-head">
          <span className="hub-season-tag">Season</span>
          <span className="hub-season-races mono-num">{season.totalRaces} races</span>
        </div>

        <div className="hub-season-champ">
          <span className="hub-season-label">World champion</span>
          <h3>
            {first} <b>{last}</b>
          </h3>
          <span className="hub-season-team">{season.championTeam}</span>
        </div>

        <div className="hub-season-champ">
          <span className="hub-season-label">Constructors' champion</span>
          <h4>{season.constructorChampion}</h4>
        </div>

        {wins.length > 0 && (
          <div className="hub-meters compact">
            {wins.map((tw, i) => (
              <div
                key={tw.team}
                className="hub-meter-row"
                style={{ "--team-accent": tw.color || "#e10600", "--i": i }}
              >
                <span className="hub-meter-name">{tw.team}</span>
                <span className="hub-meter-track">
                  <span
                    className="hub-meter-fill"
                    style={{
                      width: `${
                        season.totalRaces > 0 ? (tw.wins / season.totalRaces) * 100 : 0
                      }%`,
                    }}
                  />
                </span>
                <span className="hub-meter-val mono-num">{tw.wins}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </StaggerItem>
  );
}

export default function UserRaceHistory() {
  const { data, loading, error } = useFetch(
    () => API.get("/race-history").then((r) => r.data),
    [],
  );
  const [view, setView] = useState("seasons");

  const seasons = [...(data || [])].sort((a, b) => b.year - a.year);

  if (loading) return <Loader label="Loading the archives" />;

  if (error || !seasons.length)
    return (
      <PageTransition>
        <HubHero
          chip="Hall of fame"
          chipTone="muted"
          title="Archive"
          ghost="F1"
          subtitle="Champions, constructors and race wins across the seasons"
        />
        <EmptyState
          icon={error ? "⚠️" : "🏁"}
          title={error ? "Could not load history" : "No seasons on record"}
          message={
            error
              ? "The championship archive is unavailable right now. Please try again."
              : "Historical championship data has not been added yet."
          }
        />
      </PageTransition>
    );

  const latest = seasons[0];
  const latestTeamWins = [...(latest.teamWins || [])].sort((a, b) => b.wins - a.wins);

  // Aggregate: championship titles by driver across every archived season.
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
  const totalRaces = seasons.reduce((a, s) => a + (s.totalRaces || 0), 0);

  return (
    <PageTransition>
      <HubHero
        chip="Hall of fame"
        chipTone="muted"
        meta={`${seasons.length} seasons`}
        title="Archive"
        ghost={latest.year}
        subtitle="Champions, constructors and race wins across the seasons"
        accent={driverTitles[0]?.color}
        panel={
          <>
            <HubStat tag="Seasons archived" value={seasons.length} />
            <RankList>
              {driverTitles.slice(0, 3).map((d, i) => (
                <RankRow
                  key={d.name}
                  pos={i + 1}
                  color={d.color || "#e10600"}
                  name={d.name}
                  right={`${d.titles} ${d.titles === 1 ? "title" : "titles"}`}
                  index={i}
                  lead={i === 0}
                />
              ))}
            </RankList>
            <HubCTA to="/standings">Current championship</HubCTA>
          </>
        }
      />

      <HubStrip
        items={[
          { label: "Seasons archived", value: seasons.length, accent: "#e10600" },
          { label: "Titles awarded", value: totalTitles, accent: "#27f4d2" },
          { label: "Grands Prix", value: totalRaces, accent: "#d6ff3b" },
          { label: "Latest season", value: String(latest.year), accent: "#3671c6" },
        ]}
      />

      <HubBar>
        <HubTabs
          tabs={[
            { value: "seasons", label: "Seasons" },
            { value: "insights", label: "Insights" },
          ]}
          active={view}
          onChange={setView}
        />
      </HubBar>

      {view === "insights" && (
        <div className="grid-2">
          <Reveal>
            <HubCard title="World titles by driver">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={driverTitles.map((d) => ({ ...d, code: driverCode(d.name) }))}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="code"
                    stroke="#6b6b82"
                    tickLine={false}
                    axisLine={{ stroke: "#262636" }}
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    interval={0}
                  />
                  <YAxis
                    stroke="#6b6b82"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(225,6,0,0.07)" }}
                    contentStyle={CHART_TOOLTIP}
                    labelFormatter={(_, p) => p?.[0]?.payload?.name || ""}
                  />
                  <Bar dataKey="titles" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {driverTitles.map((d) => (
                      <Cell key={d.name} fill={d.color || "#e10600"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </HubCard>
          </Reveal>

          <Reveal delay={0.08}>
            <HubCard title={`Race wins by team — ${latest.year}`}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={latestTeamWins}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="team"
                    stroke="#6b6b82"
                    tickLine={false}
                    axisLine={{ stroke: "#262636" }}
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis
                    stroke="#6b6b82"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(39,244,210,0.07)" }}
                    contentStyle={CHART_TOOLTIP}
                  />
                  <Bar dataKey="wins" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {latestTeamWins.map((tw) => (
                      <Cell key={tw.team} fill={tw.color || "#27f4d2"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </HubCard>
          </Reveal>
        </div>
      )}

      {view === "seasons" && (
        <>
          <SectionHead label="Season archive" />
          <Stagger className="hub-card-grid">
            {seasons.map((s) => (
              <SeasonCard key={s.year} season={s} />
            ))}
          </Stagger>
        </>
      )}
    </PageTransition>
  );
}
