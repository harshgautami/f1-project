import React, { useState, useEffect } from "react";
import API from "../../api";

const UserTeamStaff = () => {
  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filterTeam, setFilterTeam] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get("/team-staff"), API.get("/teams")])
      .then(([staffRes, teamsRes]) => {
        setStaff(staffRes.data);
        setTeams(teamsRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const departments = [
    "mechanical",
    "physical",
    "pitstop",
    "strategy",
    "management",
    "aerodynamics",
  ];

  const filtered = staff.filter((s) => {
    if (filterTeam && s.team?._id !== filterTeam) return false;
    if (filterDept && s.department !== filterDept) return false;
    return true;
  });

  // Group by team
  const groupedByTeam = {};
  filtered.forEach((s) => {
    const teamName = s.teamName || s.team?.name || "Unknown";
    if (!groupedByTeam[teamName]) groupedByTeam[teamName] = [];
    groupedByTeam[teamName].push(s);
  });

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
            <span>Team</span> Management & Staff
          </h1>
          <p className="page-subtitle">
            Mechanical, Physical, Pit Stop & Strategy personnel
          </p>
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
        <select
          className="form-control"
          style={{ width: "auto" }}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          {filtered.length} staff members
        </span>
      </div>

      {Object.entries(groupedByTeam).map(([teamName, members]) => {
        const teamData = teams.find((t) => t.name === teamName);
        return (
          <div key={teamName} className="card" style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                className="team-color-bar"
                style={{
                  background: teamData?.color || "#666",
                  minHeight: "30px",
                  width: "4px",
                }}
              ></div>
              <h3>{teamName}</h3>
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                ({members.length} staff)
              </span>
            </div>
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Experience</th>
                    <th>Nationality</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((s) => (
                    <tr key={s._id}>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {s.name}
                      </td>
                      <td>{s.role}</td>
                      <td>
                        <span
                          className={`badge badge-department badge-${s.department}`}
                        >
                          {s.department}
                        </span>
                      </td>
                      <td>{s.experience}</td>
                      <td>{s.nationality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {Object.keys(groupedByTeam).length === 0 && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-muted)",
          }}
        >
          No staff found matching your filters.
        </div>
      )}
    </div>
  );
};

export default UserTeamStaff;
