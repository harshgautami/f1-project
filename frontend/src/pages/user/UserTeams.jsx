import React from "react";
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
  RankList,
  RankRow,
  SectionHead,
} from "../../components/hub";
import { RACE_SEASON } from "../../config/season";

const SPECS = [
  ["Base", "base"],
  ["Principal", "teamPrincipal"],
  ["Power unit", "powerUnit"],
  ["Chassis", "chassis"],
  ["First entry", "firstEntry"],
];

/** Constructor card: colour crown, ghost short code, spec sheet. */
function TeamCard({ team }) {
  const color = team.color || "#e10600";
  const code = (team.name || "").slice(0, 3).toUpperCase();
  return (
    <StaggerItem>
      <article className="hub-team-card" style={{ "--team-accent": color }}>
        <span className="hub-team-crown" />
        <span className="hub-team-ghost" aria-hidden="true">
          {code}
        </span>

        <div className="hub-team-head">
          <Avatar src={team.logoUrl} name={team.name} color={color} size={44} rounded="11px" />
          <div>
            <h3>{team.name}</h3>
            <div className="hub-team-full">{team.fullName}</div>
          </div>
        </div>

        <dl className="hub-spec">
          {SPECS.map(([label, key]) => (
            <div key={key} className="hub-spec-row">
              <dt>{label}</dt>
              <dd>{team[key] || "—"}</dd>
            </div>
          ))}
          <div className="hub-spec-row titles">
            <dt>Titles</dt>
            <dd className="mono-num">{team.worldChampionships ?? 0}</dd>
          </div>
        </dl>
      </article>
    </StaggerItem>
  );
}

export default function UserTeams() {
  const { data, loading, error } = useFetch(loaders.teamsRes.fetch, [], { key: loaders.teamsRes.key });
  const [q, setQ] = React.useState("");

  const teams = React.useMemo(() => {
    const list = data?.data ?? [];
    return [...list].sort(
      (a, b) =>
        (b.worldChampionships || 0) - (a.worldChampionships || 0) ||
        (a.name || "").localeCompare(b.name || ""),
    );
  }, [data]);

  const filteredTeams = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return teams;
    return teams.filter((t) =>
      [t.name, t.fullName, t.base]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [teams, q]);

  const totalTitles = teams.reduce((a, t) => a + (t.worldChampionships || 0), 0);

  if (loading) return <Loader label="Loading constructors" />;

  return (
    <PageTransition>
      <HubHero
        chip="Constructors"
        chipTone="next"
        meta={`${teams.length} teams`}
        title="Constructors"
        ghost={RACE_SEASON}
        subtitle={`The ${teams.length} teams building for the ${RACE_SEASON} championship`}
        accent={teams[0]?.color}
        panel={
          <>
            <HubStat tag="Titles won" value={totalTitles} />
            <RankList>
              {teams.slice(0, 3).map((t, i) => (
                <RankRow
                  key={t._id}
                  pos={i + 1}
                  color={t.color}
                  name={t.name}
                  right={`${t.worldChampionships ?? 0} ${
                    t.worldChampionships === 1 ? "title" : "titles"
                  }`}
                  index={i}
                  lead={i === 0}
                />
              ))}
            </RankList>
            <HubCTA to="/team-staff">Meet the paddock</HubCTA>
          </>
        }
      />

      {error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load teams"
          message="There was a problem fetching the constructors. Please try again."
        />
      ) : teams.length === 0 ? (
        <EmptyState
          icon="🏁"
          title="No constructors yet"
          message="Team data will appear here once it's available."
        />
      ) : (
        <>
          <SectionHead label="The field" />

          <HubBar>
            <SearchBar value={q} onChange={setQ} placeholder="Search teams…" />
            <span className="hub-bar-count mono-num">
              {filteredTeams.length}/{teams.length}
            </span>
          </HubBar>

          {filteredTeams.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No teams found"
              message="Try adjusting your search."
            />
          ) : (
            <Stagger className="hub-card-grid">
              {filteredTeams.map((t) => (
                <TeamCard key={t._id} team={t} />
              ))}
            </Stagger>
          )}
        </>
      )}
    </PageTransition>
  );
}
