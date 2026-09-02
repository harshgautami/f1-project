import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { loaders } from "../../data/loaders";
import { PageTransition, Stagger, StaggerItem } from "../../components/motion";
import { Loader, EmptyState, SearchBar, Avatar } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubBar,
  HubSelect,
  RankList,
  RankRow,
  SectionHead,
} from "../../components/hub";
import { RACE_SEASON } from "../../config/season";

const fullName = (d) => `${d.firstName || ""} ${d.lastName || ""}`.trim();

/** F1.com-style driver card: ghost race number, team wash, career strip. */
function DriverCard({ driver }) {
  const color = driver.team?.color || "#e10600";
  return (
    <StaggerItem>
      <Link
        to={`/drivers/${driver._id}`}
        className="hub-driver-card"
        style={{ "--team-accent": color }}
      >
        <span className="hub-driver-num mono-num" aria-hidden="true">
          {driver.number}
        </span>

        <div className="hub-driver-top">
          <Avatar
            src={driver.imageUrl}
            name={fullName(driver)}
            color={color}
            size={54}
            rounded="12px"
          />
          <span className="hub-driver-flag">{driver.nationality}</span>
        </div>

        <h3 className="hub-driver-name">
          <span>{driver.firstName}</span>
          <b>{driver.lastName}</b>
        </h3>

        <div className="hub-driver-team">
          <span className="hub-driver-team-bar" />
          {driver.team?.name || "—"}
        </div>

        <div className="hub-driver-stats">
          {[
            ["Titles", driver.worldChampionships],
            ["Wins", driver.totalRaceWins],
            ["Podiums", driver.totalPodiums],
            ["Points", driver.totalPoints],
          ].map(([label, value]) => (
            <div key={label} className="hub-driver-stat">
              <span className="mono-num">{value ?? 0}</span>
              <em>{label}</em>
            </div>
          ))}
        </div>
      </Link>
    </StaggerItem>
  );
}

export default function UserDrivers() {
  const [filterTeam, setFilterTeam] = useState("");
  const [q, setQ] = useState("");

  const {
    data: drivers,
    loading: driversLoading,
    error: driversError,
  } = useFetch(loaders.drivers.fetch, [], { key: loaders.drivers.key });

  const { data: teams } = useFetch(loaders.teams.fetch, [], { key: loaders.teams.key });

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

  // Hero panel: the most decorated drivers currently on the grid.
  const decorated = useMemo(
    () =>
      [...all]
        .sort(
          (a, b) =>
            (b.worldChampionships || 0) - (a.worldChampionships || 0) ||
            (b.totalRaceWins || 0) - (a.totalRaceWins || 0),
        )
        .slice(0, 3),
    [all],
  );

  if (driversLoading) return <Loader label="Loading the grid" />;

  return (
    <PageTransition>
      <HubHero
        chip="The grid"
        chipTone="next"
        meta={`${all.length} drivers`}
        title="Drivers"
        ghost={RACE_SEASON}
        subtitle={`Every driver contesting the ${RACE_SEASON} world championship`}
        panel={
          <>
            <HubStat tag="On the grid" value={all.length} total={teamList.length * 2} />
            <RankList>
              {decorated.map((d, i) => (
                <RankRow
                  key={d._id}
                  pos={i + 1}
                  color={d.team?.color}
                  name={fullName(d)}
                  right={`${d.worldChampionships || 0} ${
                    d.worldChampionships === 1 ? "title" : "titles"
                  }`}
                  index={i}
                  lead={i === 0}
                  to={`/drivers/${d._id}`}
                />
              ))}
            </RankList>
            <HubCTA to="/standings">See the championship</HubCTA>
          </>
        }
      />

      {driversError ? (
        <EmptyState
          icon="⚠️"
          title="Could not load drivers"
          message="Something went wrong while fetching the grid. Please try again."
        />
      ) : (
        <>
          <SectionHead label="The line-up" />

          <HubBar>
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by name or nationality…"
            />
            <HubSelect
              label="Team"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              options={[
                { value: "", label: "All teams" },
                ...teamList.map((t) => ({ value: t._id, label: t.name })),
              ]}
            />
            <span className="hub-bar-count mono-num">
              {filtered.length}/{all.length}
            </span>
          </HubBar>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🏁"
              title="No drivers found"
              message="No drivers match the current search or team filter."
              action={
                filterTeam || q ? (
                  <button
                    className="btn"
                    onClick={() => {
                      setFilterTeam("");
                      setQ("");
                    }}
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          ) : (
            <Stagger className="hub-card-grid">
              {filtered.map((driver) => (
                <DriverCard key={driver._id} driver={driver} />
              ))}
            </Stagger>
          )}
        </>
      )}
    </PageTransition>
  );
}
