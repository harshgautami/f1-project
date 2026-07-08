import React, { useState, useEffect } from "react";
import API from "../../api";

const UserStandings = () => {
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);
  const [activeTab, setActiveTab] = useState("driver");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/standings?season=2024&type=driver"),
      API.get("/standings?season=2024&type=constructor"),
    ])
      .then(([dRes, cRes]) => {
        setDriverStandings(dRes.data);
        setConstructorStandings(cRes.data);
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

  const standings =
    activeTab === "driver" ? driverStandings : constructorStandings;
  const maxPoints = standings.length > 0 ? standings[0].points : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>2024</span> Championship Standings
          </h1>
          <p className="page-subtitle">Final results of the 2024 season</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "driver" ? "active" : ""}`}
          onClick={() => setActiveTab("driver")}
        >
          Drivers Championship
        </button>
        <button
          className={`tab ${activeTab === "constructor" ? "active" : ""}`}
          onClick={() => setActiveTab("constructor")}
        >
          Constructors Championship
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>{activeTab === "driver" ? "Driver" : "Constructor"}</th>
              {activeTab === "driver" && <th>Team</th>}
              <th>Nationality</th>
              <th>Wins</th>
              <th>Points</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr key={s._id}>
                <td
                  style={{
                    fontWeight: 800,
                    fontSize: "16px",
                    color:
                      s.position === 1
                        ? "#FFD700"
                        : s.position === 2
                          ? "#C0C0C0"
                          : s.position === 3
                            ? "#CD7F32"
                            : "var(--text-secondary)",
                  }}
                >
                  {s.position}
                </td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {s.name}
                </td>
                {activeTab === "driver" && <td>{s.team}</td>}
                <td>{s.nationality}</td>
                <td style={{ fontWeight: 600 }}>{s.wins}</td>
                <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                  {s.points}
                </td>
                <td style={{ width: "200px" }}>
                  <div
                    style={{
                      background: "var(--bg-primary)",
                      borderRadius: "4px",
                      height: "8px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        background:
                          s.position <= 3
                            ? "var(--accent-red)"
                            : "var(--accent-blue)",
                        height: "100%",
                        borderRadius: "4px",
                        width: `${maxPoints > 0 ? (s.points / maxPoints) * 100 : 0}%`,
                        transition: "width 0.5s",
                      }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserStandings;
