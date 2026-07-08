import React, { useState } from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Stagger, StaggerItem } from "../../components/motion";
import { PageHeader, Loader, EmptyState, Badge } from "../../components/ui";
import { RACE_SEASON } from "../../config/season";
import * as Icons from "../../components/Icons";

const STATUS_FILTERS = [
  { value: "all", label: "All Rounds" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function UserRaces() {
  const [status, setStatus] = useState("all");
  const { data, loading, error } = useFetch(
    () => API.get(`/races?season=${RACE_SEASON}`).then((res) => res.data),
    []
  );

  if (loading) return <Loader label="Loading race calendar…" />;

  const races = [...(data || [])].sort((a, b) => a.round - b.round);
  const now = new Date();
  const nextRace = races.find((r) => new Date(r.date) >= now);

  const filtered =
    status === "all" ? races : races.filter((r) => r.status === status);

  return (
    <PageTransition>
      <PageHeader
        eyebrow={`${RACE_SEASON} Calendar`}
        accent="RACE"
        title="Calendar"
        subtitle={`${races.length} Grands Prix scheduled for the ${RACE_SEASON} season`}
        actions={
          <div className="filter-bar">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {error && (
        <EmptyState
          icon="⚠️"
          title="Couldn't load the calendar"
          message="There was a problem fetching the race schedule. Please try again."
        />
      )}

      {!error && filtered.length === 0 && (
        <EmptyState
          icon="🏁"
          title="No races found"
          message="No Grands Prix match this filter for the current season."
        />
      )}

      {!error && filtered.length > 0 && (
        <Stagger className="card-grid">
          {filtered.map((race) => {
            const isNext = nextRace && race._id === nextRace._id;
            return (
              <StaggerItem
                key={race._id}
                className="race-card"
                style={
                  isNext ? { borderColor: "var(--accent-red)" } : undefined
                }
              >
                <div className="flex-between">
                  <span className="race-round">R{race.round}</span>
                  <span className={`race-status ${race.status}`}>
                    {race.status}
                  </span>
                </div>

                <h3 className="race-name">
                  {race.name}
                  {isNext && (
                    <span style={{ marginLeft: 8 }}>
                      <Badge>Next</Badge>
                    </span>
                  )}
                </h3>

                <div className="race-circuit">
                  <Icons.IconPin />
                  {race.circuit} · {race.country}
                </div>

                <div className="race-date">
                  <Icons.IconCalendar />
                  {formatDate(race.date)}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </PageTransition>
  );
}

export default UserRaces;
