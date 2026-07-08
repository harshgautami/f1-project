import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

const UserDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filterTeam, setFilterTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([API.get("/drivers"), API.get("/teams")])
      .then(([driversRes, teamsRes]) => {
        setDrivers(driversRes.data);
        setTeams(teamsRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filterTeam
    ? drivers.filter((d) => d.team?._id === filterTeam)
    : drivers;

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>F1</span> Drivers 2026
          </h1>
          <p className="page-subtitle">{drivers.length} drivers on the grid</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="form-control"
          style={{ width: "auto" }}
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card-grid">
        {filtered.map((driver) => (
          <div
            className="driver-card"
            key={driver._id}
            onClick={() => navigate(`/drivers/${driver._id}`)}
          >
            <div style={{ display: "flex", gap: "16px", flex: 1 }}>
              <div
                className="team-color-bar"
                style={{ background: driver.team?.color || "#666" }}
              ></div>
              <div className="driver-info" style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3>
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <div
                      className="driver-team"
                      style={{ color: driver.team?.color || "#999" }}
                    >
                      {driver.team?.name}
                    </div>
                  </div>
                  <div className="driver-number">#{driver.number}</div>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: "4px 0",
                  }}
                >
                  {driver.nationality}
                </div>
                <div className="driver-stats">
                  <div className="driver-stat">
                    <div className="val" style={{ color: "var(--accent-red)" }}>
                      {driver.worldChampionships}
                    </div>
                    <div className="lbl">Titles</div>
                  </div>
                  <div className="driver-stat">
                    <div className="val">{driver.totalRaceWins}</div>
                    <div className="lbl">Wins</div>
                  </div>
                  <div className="driver-stat">
                    <div className="val">{driver.totalPodiums}</div>
                    <div className="lbl">Podiums</div>
                  </div>
                  <div className="driver-stat">
                    <div className="val">{driver.totalPoints}</div>
                    <div className="lbl">Points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDrivers;
