import React, { useState, useEffect } from "react";
import API from "../../api";

const UserRaces = () => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/races?season=2026")
      .then((res) => {
        setRaces(res.data);
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

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const now = new Date();
  const nextRace = races.find((r) => new Date(r.date) >= now);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>2026</span> Race Calendar
          </h1>
          <p className="page-subtitle">{races.length} Grands Prix scheduled</p>
        </div>
      </div>

      {/* Next Race Highlight */}
      {nextRace && (
        <div
          className="card"
          style={{
            marginBottom: "24px",
            borderLeft: "4px solid var(--accent-red)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--accent-red)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Next Race
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800 }}>
                {nextRace.name}
              </h2>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                {nextRace.circuit} · {nextRace.city}, {nextRace.country}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--accent-green)",
                }}
              >
                {formatDate(nextRace.date)}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Round {nextRace.round} · {nextRace.laps} Laps ·{" "}
                {nextRace.circuitLength}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Races */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Grand Prix</th>
              <th>Circuit</th>
              <th>Location</th>
              <th>Date</th>
              <th>Laps</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => {
              const isPast = new Date(race.date) < now;
              const isNext = nextRace && race._id === nextRace._id;
              return (
                <tr
                  key={race._id}
                  style={isNext ? { background: "rgba(232, 0, 45, 0.05)" } : {}}
                >
                  <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                    R{race.round}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {race.name}
                    {isNext && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "10px",
                          background: "var(--accent-red)",
                          color: "#fff",
                          padding: "1px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        NEXT
                      </span>
                    )}
                  </td>
                  <td>{race.circuit}</td>
                  <td>
                    {race.city}, {race.country}
                  </td>
                  <td
                    style={{
                      color: isPast
                        ? "var(--text-muted)"
                        : "var(--accent-green)",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(race.date)}
                  </td>
                  <td>{race.laps}</td>
                  <td>
                    <span className={`race-status ${race.status}`}>
                      {race.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRaces;
