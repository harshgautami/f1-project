import React, { useState } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import {
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/motion";
import {
  PageHeader,
  Loader,
  EmptyState,
  StatCard,
  SearchBar,
  teamAccent,
} from "../../components/ui";

const DEPARTMENTS = [
  "mechanical",
  "physical",
  "pitstop",
  "strategy",
  "management",
  "aerodynamics",
];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function UserTeamStaff() {
  const [filterTeam, setFilterTeam] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [q, setQ] = useState("");

  const { data, loading, error } = useFetch(
    () => Promise.all([API.get("/team-staff"), API.get("/teams")]),
    []
  );

  if (loading) return <Loader label="Loading personnel…" />;

  const staff = data?.[0]?.data || [];
  const teams = data?.[1]?.data || [];

  const query = q.trim().toLowerCase();
  const filtered = staff.filter((s) => {
    if (filterTeam && s.team?._id !== filterTeam) return false;
    if (filterDept && s.department !== filterDept) return false;
    if (query) {
      const haystack = [s.name, s.role, s.nationality]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // Group by team
  const groupedByTeam = {};
  filtered.forEach((s) => {
    const teamName = s.teamName || s.team?.name || "Unknown";
    if (!groupedByTeam[teamName]) groupedByTeam[teamName] = [];
    groupedByTeam[teamName].push(s);
  });

  const teamCount = Object.keys(groupedByTeam).length;
  const deptCount = new Set(filtered.map((s) => s.department)).size;

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Personnel"
        accent="TEAM"
        title="Management & Staff"
        subtitle="Mechanical, physical, pit stop & strategy personnel across the grid"
        actions={
          <div className="stats-grid" style={{ minWidth: 0 }}>
            <StatCard label="Staff" value={filtered.length} accent="#e10600" />
            <StatCard label="Teams" value={teamCount} accent="#27f4d2" />
            <StatCard label="Depts" value={deptCount} accent="#3b82f6" />
          </div>
        }
      />

      <div className="filter-bar">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search by name, role or nationality…"
        />
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
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {cap(d)}
            </option>
          ))}
        </select>
        <span className="text-muted" style={{ fontSize: 13 }}>
          {filtered.length} staff members
        </span>
      </div>

      {error && (
        <EmptyState
          icon="⚠️"
          title="Couldn't load personnel"
          message="There was a problem fetching the staff roster. Please try again."
        />
      )}

      {!error && teamCount === 0 && (
        <EmptyState
          icon="🧰"
          title="No staff found"
          message="No personnel match your current filters. Try widening your selection."
        />
      )}

      {!error &&
        Object.entries(groupedByTeam).map(([teamName, members], gi) => {
          const teamData = teams.find((t) => t.name === teamName);
          const color = teamData?.color || "#666";
          return (
            <Reveal
              key={teamName}
              delay={0.04 * gi}
              className="section"
            >
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 26,
                      borderRadius: 2,
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  <h3 style={{ margin: 0 }}>{teamName}</h3>
                </div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {members.length} staff
                </span>
              </div>

              <Stagger className="card-grid">
                {members.map((s) => (
                  <StaggerItem key={s._id}>
                    <div
                      className="card"
                      style={{
                        ...teamAccent(color),
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <div className="card-header">
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 16,
                              color: "var(--text-primary)",
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: 13, marginTop: 2 }}
                          >
                            {s.role}
                          </div>
                        </div>
                        <span
                          className={`badge badge-department badge-${s.department}`}
                        >
                          {s.department}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          margin: "12px 0",
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        {teamName}
                      </div>

                      <div
                        className="driver-stats"
                        style={{
                          display: "flex",
                          gap: 20,
                          borderTop: "1px solid var(--border, #262636)",
                          paddingTop: 12,
                        }}
                      >
                        <div className="driver-stat">
                          <span
                            className="val mono-num"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {s.experience ?? "—"}
                          </span>
                          <span className="lbl text-muted">Experience</span>
                        </div>
                        <div className="driver-stat">
                          <span
                            className="val"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {s.nationality || "—"}
                          </span>
                          <span className="lbl text-muted">Nationality</span>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>
          );
        })}
    </PageTransition>
  );
}
