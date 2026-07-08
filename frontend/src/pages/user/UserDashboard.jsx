import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api";

const UserDashboard = () => {
  const [stats, setStats] = useState({ teams: 0, drivers: 0, races: 0 });
  const [upcomingRaces, setUpcomingRaces] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, driversRes, racesRes, standingsRes] =
          await Promise.all([
            API.get("/teams"),
            API.get("/drivers"),
            API.get("/races?season=2026&status=upcoming"),
            API.get("/standings?season=2024&type=driver"),
          ]);
        setStats({
          teams: teamsRes.data.length,
          drivers: driversRes.data.length,
          races: racesRes.data.length,
        });
        setUpcomingRaces(racesRes.data.slice(0, 5));
        setTopDrivers(standingsRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>F1</span> Dashboard
          </h1>
          <p className="page-subtitle">2026 Season Overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.teams}</div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.drivers}</div>
          <div className="stat-label">Drivers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.races}</div>
          <div className="stat-label">Races in 2026</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">24</div>
          <div className="stat-label">Grand Prix Calendar</div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        {/* Upcoming Races */}
        <div className="card">
          <div className="card-header">
            <h3>Upcoming Races</h3>
            <Link to="/races" className="btn btn-sm btn-secondary">
              View All
            </Link>
          </div>
          <div className="table-container" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Race</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRaces.map((race) => (
                  <tr key={race._id}>
                    <td>
                      <span
                        style={{ color: "var(--accent-red)", fontWeight: 700 }}
                      >
                        R{race.round}
                      </span>
                    </td>
                    <td
                      style={{ color: "var(--text-primary)", fontWeight: 500 }}
                    >
                      {race.name}
                    </td>
                    <td style={{ color: "var(--accent-green)" }}>
                      {formatDate(race.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Drivers 2024 */}
        <div className="card">
          <div className="card-header">
            <h3>2024 Champion Standings</h3>
            <Link to="/standings" className="btn btn-sm btn-secondary">
              View All
            </Link>
          </div>
          <div className="table-container" style={{ border: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
                  <th>Team</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((d) => (
                  <tr key={d._id}>
                    <td
                      style={{
                        fontWeight: 700,
                        color:
                          d.position <= 3
                            ? "var(--accent-red)"
                            : "var(--text-secondary)",
                      }}
                    >
                      P{d.position}
                    </td>
                    <td
                      style={{ color: "var(--text-primary)", fontWeight: 500 }}
                    >
                      {d.name}
                    </td>
                    <td>{d.team}</td>
                    <td style={{ fontWeight: 600 }}>{d.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
