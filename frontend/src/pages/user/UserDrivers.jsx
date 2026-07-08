import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Stagger, StaggerItem } from "../../components/motion";
import {
  PageHeader,
  Loader,
  EmptyState,
  teamAccent,
  SearchBar,
  Avatar,
} from "../../components/ui";
import * as Icons from "../../components/Icons";

export default function UserDrivers() {
  const [filterTeam, setFilterTeam] = useState("");
  const [q, setQ] = useState("");

  const {
    data: drivers,
    loading: driversLoading,
    error: driversError,
  } = useFetch(() => API.get("/drivers").then((r) => r.data), []);

  const { data: teams } = useFetch(
    () => API.get("/teams").then((r) => r.data),
    []
  );

  // NOTE: all hooks must run before any early return (Rules of Hooks).
  const all = drivers || [];
  const teamList = teams || [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((d) => {
      if (filterTeam && d.team?._id !== filterTeam) return false;
      if (!term) return true;
      return [d.firstName, d.lastName, d.nationality]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [all, filterTeam, q]);

  if (driversLoading) return <Loader label="Loading the grid…" />;

  return (
    <PageTransition>
      <PageHeader
        eyebrow="The Grid"
        accent="F1"
        title="Drivers"
        subtitle={`${all.length} drivers on the grid`}
      />

      {driversError ? (
        <EmptyState
          icon="⚠️"
          title="Could not load drivers"
          message="Something went wrong while fetching the grid. Please try again."
        />
      ) : (
        <>
          <div className="filter-bar">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by name or nationality…"
            />
            <select
              className="form-control"
              style={{ width: "auto" }}
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="">All Teams</option>
              {teamList.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🏁"
              title="No drivers found"
              message="No drivers match the selected team filter."
              action={
                filterTeam ? (
                  <button
                    className="btn"
                    onClick={() => setFilterTeam("")}
                  >
                    Clear filter
                  </button>
                ) : null
              }
            />
          ) : (
            <Stagger className="card-grid">
              {filtered.map((driver) => (
                <StaggerItem key={driver._id}>
                  <Link
                    to={`/drivers/${driver._id}`}
                    className="driver-card"
                    style={teamAccent(driver.team?.color)}
                  >
                    <Avatar
                      src={driver.imageUrl}
                      name={`${driver.firstName} ${driver.lastName}`}
                      color={driver.team?.color}
                      size={52}
                    />
                    <div className="driver-info" style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div>
                          <h3>
                            {driver.firstName} {driver.lastName}
                          </h3>
                          <div
                            className="driver-team"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background:
                                  driver.team?.color || "var(--text-muted)",
                                flexShrink: 0,
                              }}
                            />
                            {driver.team?.name || "—"}
                          </div>
                        </div>
                        <div className="driver-number">#{driver.number}</div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          margin: "6px 0 2px",
                        }}
                      >
                        {driver.nationality}
                      </div>

                      <div className="driver-stats">
                        <div className="driver-stat">
                          <div
                            className="val"
                            style={{ color: "var(--accent-red)" }}
                          >
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
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </>
      )}
    </PageTransition>
  );
}
