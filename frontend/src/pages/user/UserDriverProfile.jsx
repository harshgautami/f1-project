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
  CartesianGrid,
} from "recharts";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Reveal, AnimatedNumber } from "../../components/motion";
import { Loader, EmptyState, StatCard, SectionTitle, teamAccent } from "../../components/ui";
import * as Icons from "../../components/Icons";

const tooltipStyle = {
  background: "#14141e",
  border: "1px solid #38384c",
  borderRadius: 10,
  color: "#f4f4f8",
};

export default function UserDriverProfile() {
  const { id } = useParams();

  const {
    data: driver,
    loading,
    error,
  } = useFetch(() => API.get(`/drivers/${id}`).then((r) => r.data), [id]);

  if (loading) return <Loader label="Loading driver profile…" />;

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

  const historyData = [...(driver.history || [])].sort((a, b) => a.year - b.year);
  const teamName = driver.team?.name || driver.team?.fullName;

  return (
    <PageTransition>
      <Link
        to="/drivers"
        className="btn btn-secondary btn-sm"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <Icons.IconArrowLeft /> Back to Drivers
      </Link>

      <Reveal
        className="driver-profile-header"
        style={teamAccent(driver.team?.color)}
      >
        <div className="driver-profile-number">{driver.number}</div>
        <div className="driver-profile-name">
          <h1>
            {driver.firstName} {driver.lastName}
          </h1>
          <div className="team-name" style={{ color: "var(--team-accent)" }}>
            {teamName}
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {driver.nationality}
            {driver.dateOfBirth ? ` · Born ${driver.dateOfBirth}` : ""}
          </div>
        </div>
      </Reveal>

      <div className="stats-grid" style={{ margin: "24px 0" }}>
        <StatCard
          label="World Titles"
          value={driver.worldChampionships}
          accent="#e10600"
        />
        <StatCard label="Race Wins" value={driver.totalRaceWins} accent="#27f4d2" />
        <StatCard label="Podiums" value={driver.totalPodiums} />
        <StatCard label="Career Points" value={driver.totalPoints} />
      </div>

      {driver.biography && (
        <Reveal className="card" style={{ marginBottom: 24 }}>
          <SectionTitle>Biography</SectionTitle>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              fontSize: 14,
            }}
          >
            {driver.biography}
          </p>
          {driver.seasonsActive && (
            <p
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Seasons Active: {driver.seasonsActive}
            </p>
          )}
        </Reveal>
      )}

      {historyData.length > 0 ? (
        <>
          <Reveal className="grid-2" style={{ marginBottom: 24 }}>
            <div className="chart-container">
              <h3 className="chart-title">Points Per Season</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262636" />
                  <XAxis dataKey="year" stroke="#6b6b82" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b6b82" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(225,6,0,0.08)" }} />
                  <Bar
                    dataKey="points"
                    fill={driver.team?.color || "#e10600"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Championship Position Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262636" />
                  <XAxis dataKey="year" stroke="#6b6b82" tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="#6b6b82"
                    tick={{ fontSize: 12 }}
                    reversed
                    domain={[1, "auto"]}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke="#27f4d2"
                    strokeWidth={2}
                    dot={{ fill: "#27f4d2", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          <Reveal className="card">
            <SectionTitle>Season-by-Season History</SectionTitle>
            <div className="table-container" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Team</th>
                    <th>Position</th>
                    <th>Wins</th>
                    <th>Podiums</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historyData].reverse().map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {h.year}
                      </td>
                      <td>{h.team}</td>
                      <td>
                        <span
                          className={
                            h.position <= 3 ? `pos-medal pos-${h.position}` : ""
                          }
                          style={
                            h.position > 3
                              ? { fontWeight: 700, color: "var(--text-secondary)" }
                              : undefined
                          }
                        >
                          P{h.position}
                        </span>
                      </td>
                      <td>{h.wins}</td>
                      <td>{h.podiums}</td>
                      <td className="mono-num" style={{ fontWeight: 600 }}>
                        {h.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
