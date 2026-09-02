import React, { useState } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { loaders } from "../../data/loaders";
import { PageTransition, Reveal, Stagger, StaggerItem } from "../../components/motion";
import { Loader, EmptyState, SearchBar } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubBar,
  HubSelect,
  HubStrip,
  RankList,
  RankRow,
} from "../../components/hub";

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

  const { data, loading, error } = useFetch(loaders.staff.fetch, [], { key: loaders.staff.key });

  if (loading) return <Loader label="Loading personnel" />;

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

  // Hero panel: the biggest operations on the grid.
  const biggest = Object.entries(groupedByTeam)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);
  const colorOf = (name) => teams.find((t) => t.name === name)?.color || "#666";

  return (
    <PageTransition>
      <HubHero
        chip="Personnel"
        chipTone="next"
        meta={`${staff.length} staff`}
        title="Paddock"
        ghost="Crew"
        subtitle="Mechanical · physical · pit stop · strategy · aerodynamics · management"
        panel={
          <>
            <HubStat tag="Head count" value={filtered.length} />
            <RankList>
              {biggest.map(([name, members], i) => (
                <RankRow
                  key={name}
                  pos={i + 1}
                  color={colorOf(name)}
                  name={name}
                  right={`${members.length} crew`}
                  index={i}
                  lead={i === 0}
                />
              ))}
            </RankList>
            <HubCTA to="/teams">Browse the constructors</HubCTA>
          </>
        }
      />

      <HubStrip
        items={[
          { label: "Staff listed", value: filtered.length, accent: "#e10600" },
          { label: "Teams covered", value: teamCount, accent: "#27f4d2" },
          { label: "Departments", value: deptCount, accent: "#d6ff3b" },
        ]}
      />

      <HubBar>
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search by name, role or nationality…"
        />
        <HubSelect
          label="Team"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          options={[
            { value: "", label: "All teams" },
            ...teams.map((t) => ({ value: t._id, label: t.name })),
          ]}
        />
        <HubSelect
          label="Dept"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          options={[
            { value: "", label: "All departments" },
            ...DEPARTMENTS.map((d) => ({ value: d, label: cap(d) })),
          ]}
        />
        <span className="hub-bar-count mono-num">
          {filtered.length}/{staff.length}
        </span>
      </HubBar>

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
          const color = colorOf(teamName);
          return (
            <Reveal key={teamName} delay={0.04 * gi} className="hub-group">
              <div className="hub-group-head" style={{ "--team-accent": color }}>
                <span className="hub-group-blade" />
                <h3>{teamName}</h3>
                <span className="hub-group-count mono-num">{members.length} crew</span>
              </div>

              <Stagger className="hub-card-grid tight">
                {members.map((s) => (
                  <StaggerItem key={s._id}>
                    <article className="hub-staff-card" style={{ "--team-accent": color }}>
                      <div className="hub-staff-head">
                        <div className="hub-staff-id">
                          <b>{s.name}</b>
                          <span>{s.role}</span>
                        </div>
                        <span className={`hub-dept badge-${s.department}`}>
                          {s.department}
                        </span>
                      </div>
                      <div className="hub-staff-foot">
                        <span>
                          <b className="mono-num">{s.experience ?? "—"}</b>
                          <em>Years</em>
                        </span>
                        <span>
                          <b>{s.nationality || "—"}</b>
                          <em>Nationality</em>
                        </span>
                      </div>
                    </article>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>
          );
        })}
    </PageTransition>
  );
}
