import { useState } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Reveal } from "../../components/motion";
import { PageHeader, Loader, EmptyState, Tabs } from "../../components/ui";
import { STANDINGS_SEASON } from "../../config/season";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

function UserStandings() {
  const [activeTab, setActiveTab] = useState("driver");

  const { data, loading, error } = useFetch(
    () =>
      Promise.all([
        API.get(`/standings?season=${STANDINGS_SEASON}&type=driver`),
        API.get(`/standings?season=${STANDINGS_SEASON}&type=constructor`),
      ]).then(([dRes, cRes]) => ({
        driver: dRes.data,
        constructor: cRes.data,
      })),
    []
  );

  const standings =
    (data && (activeTab === "driver" ? data.driver : data.constructor)) || [];
  const maxPoints = standings.length > 0 ? standings[0].points : 0;
  const chartData = standings.slice(0, 10).map((s) => ({
    name: s.name,
    points: s.points,
    position: s.position,
  }));

  return (
    <PageTransition>
      <PageHeader
        eyebrow={`${STANDINGS_SEASON} Championship`}
        accent="CHAMPIONSHIP"
        title="Standings"
        subtitle={`Final classification of the ${STANDINGS_SEASON} season`}
      />

      <Tabs
        tabs={[
          { value: "driver", label: "Drivers Championship" },
          { value: "constructor", label: "Constructors Championship" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {loading ? (
        <Loader label="Loading standings…" />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load standings"
          message="Something went wrong fetching the championship data."
        />
      ) : standings.length === 0 ? (
        <EmptyState
          icon="🏁"
          title="No standings yet"
          message={`No ${activeTab} standings are available for ${STANDINGS_SEASON}.`}
        />
      ) : (
        <>
          <Reveal className="chart-container">
            <h3 className="chart-title">
              Top {chartData.length} by Points —{" "}
              {activeTab === "driver" ? "Drivers" : "Constructors"}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid stroke="#262636" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#6b6b82"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#6b6b82"
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: "rgba(225,6,0,0.08)" }}
                  contentStyle={{
                    background: "#14141e",
                    border: "1px solid #38384c",
                    borderRadius: 10,
                    color: "#f4f4f8",
                  }}
                />
                <Bar dataKey="points" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.position <= 3 ? "#e10600" : "#27f4d2"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Reveal>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>{activeTab === "driver" ? "Driver" : "Constructor"}</th>
                  {activeTab === "driver" && <th>Team</th>}
                  <th>Nationality</th>
                  <th>Wins</th>
                  <th>Points</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span
                        className={`pos-medal${
                          s.position <= 3 ? ` pos-${s.position}` : ""
                        }`}
                      >
                        {s.position}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      {s.name}
                    </td>
                    {activeTab === "driver" && (
                      <td className="text-muted">{s.team}</td>
                    )}
                    <td>{s.nationality}</td>
                    <td style={{ fontWeight: 600 }} className="mono-num">
                      {s.wins}
                    </td>
                    <td
                      className="mono-num"
                      style={{ fontWeight: 800, color: "var(--accent-red)" }}
                    >
                      {s.points}
                    </td>
                    <td style={{ minWidth: 160 }}>
                      <div
                        style={{
                          background: "var(--bg-primary)",
                          borderRadius: 4,
                          height: 8,
                          width: "100%",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background:
                              s.position <= 3
                                ? "var(--accent-red)"
                                : "var(--accent-blue)",
                            height: "100%",
                            borderRadius: 4,
                            width: `${
                              maxPoints > 0
                                ? (s.points / maxPoints) * 100
                                : 0
                            }%`,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageTransition>
  );
}

export default UserStandings;
