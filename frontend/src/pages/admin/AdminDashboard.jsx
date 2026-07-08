import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    teams: 0,
    drivers: 0,
    races: 0,
    staff: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/teams"),
      API.get("/drivers"),
      API.get("/races?season=2026"),
      API.get("/team-staff"),
    ])
      .then(([t, d, r, s]) => {
        setStats({
          teams: t.data.length,
          drivers: d.data.length,
          races: r.data.length,
          staff: s.data.length,
        });
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

  const cards = [
    {
      label: "Teams",
      count: stats.teams,
      link: "/admin/teams",
      color: "#e8002d",
    },
    {
      label: "Drivers",
      count: stats.drivers,
      link: "/admin/drivers",
      color: "#3671c6",
    },
    {
      label: "Races",
      count: stats.races,
      link: "/admin/races",
      color: "#27f4d2",
    },
    {
      label: "Staff",
      count: stats.staff,
      link: "/admin/staff",
      color: "#ff8000",
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Admin</span> Dashboard
          </h1>
          <p className="page-subtitle">
            Manage all F1 data — teams, drivers, races, standings & staff
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <Link to={c.link} key={c.label} style={{ textDecoration: "none" }}>
            <div
              className="stat-card"
              style={{ cursor: "pointer", borderTop: `3px solid ${c.color}` }}
            >
              <div className="stat-value" style={{ color: c.color }}>
                {c.count}
              </div>
              <div className="stat-label">{c.label}</div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "var(--accent-red)",
                }}
              >
                Manage →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3 style={{ marginBottom: "16px" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link to="/admin/teams" className="btn btn-primary">
            Manage Teams
          </Link>
          <Link to="/admin/drivers" className="btn btn-primary">
            Manage Drivers
          </Link>
          <Link to="/admin/races" className="btn btn-primary">
            Manage Races
          </Link>
          <Link to="/admin/standings" className="btn btn-secondary">
            Manage Standings
          </Link>
          <Link to="/admin/staff" className="btn btn-secondary">
            Manage Staff
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
