import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Reveal } from "../../components/motion";
import { Loader, EmptyState, Avatar } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubCard,
  HubStrip,
  RankList,
  RankRow,
  SectionHead,
} from "../../components/hub";
import * as Icons from "../../components/Icons";

const CHART_TOOLTIP = {
  background: "#0d0d14",
  border: "1px solid #38384c",
  borderRadius: 10,
  color: "#f4f4f8",
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
};

export default function UserDriverProfile() {
  const { id } = useParams();

  const {
    data: driver,
    loading,
    error,
  } = useFetch(() => API.get(`/drivers/${id}`).then((r) => r.data), [id]);

  if (loading) return <Loader label="Loading driver profile" />;

  if (error || !driver) {
    return (
      <PageTransition>
        <EmptyState
          icon="🏁"
          title="Driver not found"
          message="We couldn't find this driver. They may have left the grid."
          action={
            <Link to="/drivers" className="btn">
              Back to Drivers
            </Link>
          }
        />
      </PageTransition>
    );
  }

  const color = driver.team?.color || "#e10600";
  const history = [...(driver.history || [])].sort((a, b) => a.year - b.year);
  const teamName = driver.team?.name || driver.team?.fullName;
  const bestSeasons = [...history].sort((a, b) => b.points - a.points).slice(0, 3);

  return (
    <PageTransition>
      <Link to="/drivers" className="hub-back">
        <Icons.IconArrowLeft /> All drivers
      </Link>

      <HubHero
        chip={teamName || "Driver"}
        chipTone="muted"
        chipDot={false}
        meta={driver.nationality}
        title={driver.lastName}
        ghost={driver.number}
        subtitle={`${driver.firstName} ${driver.lastName}${
          driver.dateOfBirth ? ` · born ${driver.dateOfBirth}` : ""
        }`}
        accent={color}
        art={
          <div className="hub-driver-portrait">
            <Avatar
              src={driver.imageUrl}
              name={`${driver.firstName} ${driver.lastName}`}
              color={color}
              size={96}
              rounded="16px"
            />
            <div className="hub-driver-portrait-meta">
              <span>{driver.nationality}</span>
              <b>#{driver.number}</b>
            </div>
          </div>
        }
        panel={
          <>
            <HubStat tag="Career points" value={driver.totalPoints || 0} duration={1.8} />
            <RankList>
              {bestSeasons.length ? (
                bestSeasons.map((h, i) => (
                  <RankRow
                    key={h.year}
                    pos={h.year}
                    color={color}
                    name={h.team || teamName || "—"}
                    right={`P${h.position} · ${h.points}`}
                    index={i}
                    lead={i === 0}
                  />
                ))
              ) : (
                <RankRow pos="—" color={color} name="Rookie season" right="No history" />
              )}
            </RankList>
            <HubCTA to="/standings">See the championship</HubCTA>
          </>
        }
      />

      <HubStrip
        items={[
          { label: "World titles", value: driver.worldChampionships || 0, accent: "#e10600" },
          { label: "Race wins", value: driver.totalRaceWins || 0, accent: "#27f4d2" },
          { label: "Podiums", value: driver.totalPodiums || 0, accent: "#d6ff3b" },
          { label: "Career points", value: driver.totalPoints || 0, accent: color },
        ]}
      />

      {driver.biography && (
        <Reveal>
          <HubCard title="Biography" accent={color} className="hub-bio">
            <p>{driver.biography}</p>
            {driver.seasonsActive && (
              <p className="hub-bio-foot">Seasons active: {driver.seasonsActive}</p>
            )}
          </HubCard>
        </Reveal>
      )}

      {history.length > 0 ? (
        <>
          <SectionHead label="Career form" />

          <div className="grid-2">
            <Reveal>
              <HubCard title="Points per season" accent={color}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="year"
                      stroke="#6b6b82"
                      tickLine={false}
                      axisLine={{ stroke: "#262636" }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#6b6b82"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP}
                      cursor={{ fill: "rgba(225,6,0,0.07)" }}
                    />
                    <Bar dataKey="points" fill={color} radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </HubCard>
            </Reveal>

            <Reveal delay={0.08}>
              <HubCard title="Championship position" accent={color}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="year"
                      stroke="#6b6b82"
                      tickLine={false}
                      axisLine={{ stroke: "#262636" }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#6b6b82"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      reversed
                      domain={[1, "auto"]}
                    />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Line
                      type="monotone"
                      dataKey="position"
                      stroke="#27f4d2"
                      strokeWidth={2.5}
                      dot={{ fill: "#27f4d2", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </HubCard>
            </Reveal>
          </div>

          <Reveal>
            <HubCard title="Season by season" accent={color}>
              <div className="hub-table-wrap">
                <table className="hub-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Team</th>
                      <th>Pos</th>
                      <th>Wins</th>
                      <th>Podiums</th>
                      <th className="right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((h) => (
                      <tr key={h.year}>
                        <td className="mono-num strong">{h.year}</td>
                        <td>{h.team}</td>
                        <td>
                          <span
                            className={`hub-pos${h.position <= 3 ? ` p${h.position}` : ""}`}
                          >
                            P{h.position}
                          </span>
                        </td>
                        <td className="mono-num">{h.wins}</td>
                        <td className="mono-num">{h.podiums}</td>
                        <td className="mono-num strong right">{h.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HubCard>
          </Reveal>
        </>
      ) : (
        <EmptyState
          icon="🏎️"
          title="New to the grid"
          message="This driver is new to F1 — no season history available yet."
        />
      )}
    </PageTransition>
  );
}
