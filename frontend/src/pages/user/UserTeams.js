import React, { useState, useEffect } from "react";
import API from "../../api";

const UserTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/teams")
      .then((res) => {
        setTeams(res.data);
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>F1</span> Teams 2026
          </h1>
          <p className="page-subtitle">
            All {teams.length} teams competing in the 2026 season
          </p>
        </div>
      </div>

      <div className="card-grid">
        {teams.map((team) => (
          <div className="team-card" key={team._id}>
            <div
              className="team-card-top"
              style={{ background: team.color }}
            ></div>
            <div className="team-card-body">
              <h3>{team.name}</h3>
              <div className="team-full-name">{team.fullName}</div>
              <div className="team-detail-row">
                <span className="label">Base</span>
                <span>{team.base}</span>
              </div>
              <div className="team-detail-row">
                <span className="label">Team Principal</span>
                <span>{team.teamPrincipal}</span>
              </div>
              <div className="team-detail-row">
                <span className="label">Power Unit</span>
                <span>{team.powerUnit}</span>
              </div>
              <div className="team-detail-row">
                <span className="label">Chassis</span>
                <span>{team.chassis}</span>
              </div>
              <div className="team-detail-row">
                <span className="label">First Entry</span>
                <span>{team.firstEntry}</span>
              </div>
              <div className="team-detail-row">
                <span className="label">Championships</span>
                <span
                  style={{
                    color:
                      team.worldChampionships > 0
                        ? "var(--accent-red)"
                        : "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {team.worldChampionships}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTeams;
