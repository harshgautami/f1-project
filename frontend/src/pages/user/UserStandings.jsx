import { useState } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { loaders } from "../../data/loaders";
import { PageTransition, Reveal, Stagger, StaggerItem } from "../../components/motion";
import { Loader, EmptyState } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubBar,
  HubSelect,
  HubTabs,
  HubCard,
  RankList,
  RankRow,
  SectionHead,
  splitName,
  driverCode,
} from "../../components/hub";
import { teamColor } from "../../data/teamColors";
import { STANDINGS_SEASON, STANDINGS_SEASONS } from "../../config/season";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const CHART_TOOLTIP = {
  background: "#0d0d14",
  border: "1px solid #38384c",
  borderRadius: 10,
  color: "#f4f4f8",
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
};

/** Championship row: ghost position, team blade, split name, points bar. */
function StandingRow({ row, maxPoints, isDriver, index }) {
  const color = teamColor(isDriver ? row.team : row.name);
  const { first, last } = splitName(row.name);
  return (
    <StaggerItem>
      <div className="hub-standing-row" style={{ "--team-accent": color, "--i": index }}>
        <span className="hub-standing-pos mono-num">
          {String(row.position).padStart(2, "0")}
        </span>
        <span className="hub-standing-blade" />
        <span className="hub-standing-id">
          <b className="hub-standing-name">
            {isDriver ? (
              <>
                {first} <strong>{last}</strong>
              </>
            ) : (
              <strong>{row.name}</strong>
            )}
          </b>
          <span className="hub-standing-sub">
            {isDriver ? row.team : row.nationality}
          </span>
        </span>
        <span className="hub-standing-bar">
          <span
            className="hub-standing-fill"
            style={{ width: `${maxPoints ? (row.points / maxPoints) * 100 : 0}%` }}
          />
        </span>
        <span className="hub-standing-wins mono-num" title="Race wins">
          {row.wins ?? 0}W
        </span>
        <span className="hub-standing-pts mono-num">{row.points}</span>
      </div>
    </StaggerItem>
  );
}

function UserStandings() {
  const [activeTab, setActiveTab] = useState("driver");
  const [season, setSeason] = useState(STANDINGS_SEASON);

  const { data, loading, error } = useFetch(loaders.standings(season).fetch, [season], {
    key: loaders.standings(season).key,
  });

  const isDriver = activeTab === "driver";
  const standings =
    (data && (isDriver ? data.driver : data.constructor)) || [];
  const maxPoints = standings.length > 0 ? standings[0].points : 0;
  const leader = standings[0];
  const chartData = standings.slice(0, 10).map((s) => ({
    name: isDriver ? driverCode(s.name) : (s.name || "").slice(0, 3).toUpperCase(),
    full: s.name,
    points: s.points,
    fill: teamColor(isDriver ? s.team : s.name),
  }));

  return (
    <PageTransition>
      <HubHero
        chip="Championship"
        chipTone="next"
        meta={`${standings.length} classified`}
        title="Standings"
        ghost={season}
        subtitle={
          leader
            ? `${leader.name} leads the ${isDriver ? "drivers'" : "constructors'"} championship`
            : `${season} world championship classification`
        }
        accent={leader && teamColor(isDriver ? leader.team : leader.name)}
        panel={
          <>
            <HubStat tag="Leader points" value={leader?.points ?? 0} duration={1.8} />
            <RankList>
              {standings.slice(0, 3).map((s, i) => (
                <RankRow
                  key={s._id || s.position}
                  pos={s.position}
                  color={teamColor(isDriver ? s.team : s.name)}
                  name={s.name}
                  right={
                    i === 0
                      ? "Leader"
                      : `-${Math.round(standings[0].points - s.points)}`
                  }
                  index={i}
                  lead={i === 0}
                />
              ))}
            </RankList>
            <HubCTA to="/races">See the calendar</HubCTA>
          </>
        }
      />

      <HubBar>
        <HubTabs
          tabs={[
            { value: "driver", label: "Drivers" },
            { value: "constructor", label: "Constructors" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
        <HubSelect
          label="Season"
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          options={STANDINGS_SEASONS.map((s) => ({ value: s, label: s }))}
        />
      </HubBar>

      {loading ? (
        <Loader label="Loading standings" />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load standings"
          message="Something went wrong fetching the championship data."
        />
      ) : standings.length === 0 ? (
        <EmptyState
          icon="🏁"
          title="No standings yet"
          message={`No ${activeTab} standings are available for ${season}.`}
        />
      ) : (
        <>
          <Reveal>
            <HubCard title={`Top ${chartData.length} by points`}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
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
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(225,6,0,0.07)" }}
                    contentStyle={CHART_TOOLTIP}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full || ""}
                  />
                  <Bar dataKey="points" radius={[4, 4, 0, 0]} maxBarSize={54}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </HubCard>
          </Reveal>

          <SectionHead label={isDriver ? "Drivers' championship" : "Constructors' championship"} />

          <Stagger className="hub-standings">
            {standings.map((s, i) => (
              <StandingRow
                key={s._id || s.position}
                row={s}
                maxPoints={maxPoints}
                isDriver={isDriver}
                index={i}
              />
            ))}
          </Stagger>
        </>
      )}
    </PageTransition>
  );
}

export default UserStandings;
