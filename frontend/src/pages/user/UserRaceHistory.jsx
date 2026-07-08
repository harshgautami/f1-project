import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import API from "../../api";

const UserRaceHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/race-history")
      .then((res) => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );

  // Data for total races per year chart
  const racesPerYear = history.map((h) => ({
    year: h.year,
    totalRaces: h.totalRaces,
  }));

  // Champions over years data
  const championsData = history.map((h) => ({
    year: h.year,
    champion: h.champion,
    team: h.championTeam,
    constructorChampion: h.constructorChampion,
  }));

  // Team wins data for stacked bar chart
  const allTeams = new Set();
  history.forEach((h) => h.teamWins.forEach((tw) => allTeams.add(tw.team)));
  const teamColors = {};
  history.forEach((h) =>
    h.teamWins.forEach((tw) => {
      teamColors[tw.team] = tw.color;
    }),
  );

  const teamWinsData = history.map((h) => {
    const obj = { year: h.year };
    h.teamWins.forEach((tw) => {
      obj[tw.team] = tw.wins;
    });
    return obj;
  });

  const selectedYearData = selectedYear
    ? history.find((h) => h.year === selectedYear)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Race</span> History 2016-2024
          </h1>
          <p className="page-subtitle">
            Team performance and championship data across seasons
          </p>
        </div>
      </div>

      {/* Champions Table */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "16px" }}>World Champions (2016-2024)</h3>
        <div className="table-container" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Driver Champion</th>
                <th>Team</th>
                <th>Constructor Champion</th>
                <th>Races</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr
                  key={h.year}
                  onClick={() => setSelectedYear(h.year)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                    {h.year}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {h.champion}
                  </td>
                  <td>{h.championTeam}</td>
                  <td style={{ fontWeight: 500 }}>{h.constructorChampion}</td>
                  <td>{h.totalRaces}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Races Per Year Chart */}
      <div className="chart-container">
        <div className="chart-title">Total Races Per Season</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={racesPerYear}>
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
            <Bar
              dataKey="totalRaces"
              fill="#e8002d"
              radius={[4, 4, 0, 0]}
              name="Total Races"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team Wins Stacked Bar Chart */}
      <div className="chart-container">
        <div className="chart-title">Team Race Wins by Season</div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={teamWinsData}>
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
            <Legend />
            {[...allTeams].map((team) => (
              <Bar
                key={team}
                dataKey={team}
                stackId="a"
                fill={teamColors[team] || "#666"}
                name={team}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dominance Line Chart */}
      <div className="chart-container">
        <div className="chart-title">Top Team Wins Trend Over Years</div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={teamWinsData}>
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
            <Legend />
            <Line
              type="monotone"
              dataKey="Mercedes"
              stroke="#00D2BE"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Red Bull Racing"
              stroke="#3671C6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Ferrari"
              stroke="#E8002D"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="McLaren"
              stroke="#FF8000"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Year Details */}
      {selectedYearData && (
        <div className="card" style={{ marginTop: "24px" }}>
          <h3 style={{ marginBottom: "16px" }}>
            {selectedYearData.year} Season Breakdown
          </h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{selectedYearData.totalRaces}</div>
              <div className="stat-label">Total Races</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: "20px" }}>
                {selectedYearData.champion}
              </div>
              <div className="stat-label">Driver Champion</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: "20px" }}>
                {selectedYearData.constructorChampion}
              </div>
              <div className="stat-label">Constructor Champion</div>
            </div>
          </div>
          <h4 style={{ marginTop: "16px", marginBottom: "12px" }}>Team Wins</h4>
          {selectedYearData.teamWins.map((tw) => (
            <div
              key={tw.team}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ width: "140px", fontWeight: 500, fontSize: "14px" }}
              >
                {tw.team}
              </div>
              <div
                style={{
                  flex: 1,
                  background: "var(--bg-primary)",
                  borderRadius: "4px",
                  height: "24px",
                }}
              >
                <div
                  style={{
                    background: tw.color,
                    height: "100%",
                    borderRadius: "4px",
                    width: `${selectedYearData.totalRaces > 0 ? (tw.wins / selectedYearData.totalRaces) * 100 : 0}%`,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#000",
                    minWidth: tw.wins > 0 ? "30px" : "0",
                  }}
                >
                  {tw.wins > 0 ? tw.wins : ""}
                </div>
              </div>
            </div>
          ))}
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setSelectedYear(null)}
            style={{ marginTop: "16px" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default UserRaceHistory;
