import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import API from "../../api";

const UserDriverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/drivers/${id}`)
      .then((res) => {
        setDriver(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        navigate("/drivers");
      });
  }, [id, navigate]);

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );
  if (!driver) return <div className="loading">Driver not found</div>;

  const historyData = [...(driver.history || [])].sort(
    (a, b) => a.year - b.year,
  );

  return (
    <div className="driver-profile">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => navigate("/drivers")}
        style={{ marginBottom: "20px" }}
      >
        ← Back to Drivers
      </button>

      <div className="driver-profile-header">
        <div
          className="team-color-bar"
          style={{
            background: driver.team?.color || "#666",
            minHeight: "80px",
            width: "6px",
          }}
        ></div>
        <div className="driver-profile-number">{driver.number}</div>
        <div className="driver-profile-name">
          <h1>
            {driver.firstName} {driver.lastName}
          </h1>
          <div className="team-name" style={{ color: driver.team?.color }}>
            {driver.team?.name || driver.team?.fullName}
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              marginTop: "4px",
            }}
          >
            {driver.nationality} · Born: {driver.dateOfBirth}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{driver.worldChampionships}</div>
          <div className="stat-label">World Titles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{driver.totalRaceWins}</div>
          <div className="stat-label">Race Wins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{driver.totalPodiums}</div>
          <div className="stat-label">Podiums</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{driver.totalPoints}</div>
          <div className="stat-label">Career Points</div>
        </div>
      </div>

      {/* Biography */}
      {driver.biography && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "12px" }}>Biography</h3>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: "1.8",
              fontSize: "14px",
            }}
          >
            {driver.biography}
          </p>
          {driver.seasonsActive && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              Seasons Active: {driver.seasonsActive}
            </p>
          )}
        </div>
      )}

      {/* Career History Charts */}
      {historyData.length > 0 && (
        <>
          <div className="chart-container">
            <div className="chart-title">Points Per Season</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
                <XAxis dataKey="year" stroke="#6b6b80" />
                <YAxis stroke="#6b6b80" />
                <Tooltip
                  contentStyle={{
                    background: "#1e1e2e",
                    border: "1px solid #2a2a3c",
                    borderRadius: "8px",
                    color: "#e8e8ec",
                  }}
                />
                <Bar dataKey="points" fill="#e8002d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Championship Position Over Time</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3c" />
                <XAxis dataKey="year" stroke="#6b6b80" />
                <YAxis stroke="#6b6b80" reversed domain={[1, "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "#1e1e2e",
                    border: "1px solid #2a2a3c",
                    borderRadius: "8px",
                    color: "#e8e8ec",
                  }}
                />
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

          {/* History Table */}
          <div className="card history-table">
            <h3 style={{ marginBottom: "16px" }}>Season-by-Season History</h3>
            <div className="table-container" style={{ border: "none" }}>
              <table>
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
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {h.year}
                      </td>
                      <td>{h.team}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color:
                            h.position === 1
                              ? "var(--accent-red)"
                              : h.position <= 3
                                ? "var(--accent-green)"
                                : "var(--text-secondary)",
                        }}
                      >
                        P{h.position}
                      </td>
                      <td>{h.wins}</td>
                      <td>{h.podiums}</td>
                      <td style={{ fontWeight: 600 }}>{h.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {historyData.length === 0 && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-muted)",
          }}
        >
          This driver is new to F1 — no season history available yet.
        </div>
      )}
    </div>
  );
};

export default UserDriverProfile;
