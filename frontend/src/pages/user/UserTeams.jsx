import React from "react";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { PageTransition, Stagger, StaggerItem } from "../../components/motion";
import { PageHeader, Loader, EmptyState, teamAccent } from "../../components/ui";

export default function UserTeams() {
  const { data, loading, error } = useFetch(() => API.get("/teams"), []);

  const teams = React.useMemo(() => {
    const list = data?.data ?? [];
    return [...list].sort(
      (a, b) =>
        (b.worldChampionships || 0) - (a.worldChampionships || 0) ||
        (a.name || "").localeCompare(b.name || "")
    );
  }, [data]);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Constructors"
        accent="F1"
        title="Constructors"
        subtitle={
          teams.length
            ? `All ${teams.length} teams competing this season`
            : "Every constructor on the grid"
        }
      />

      {loading ? (
        <Loader label="Loading constructors…" />
      ) : error ? (
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
        <Stagger className="card-grid">
          {teams.map((t) => (
            <StaggerItem key={t._id}>
              <div className="team-card" style={teamAccent(t.color)}>
                <div
                  className="team-card-top"
                  style={{ background: t.color || "var(--team-accent)" }}
                />
                <div className="team-card-body">
                  <h3>{t.name}</h3>
                  <div className="team-full-name">{t.fullName}</div>

                  <div className="team-detail-row">
                    <span className="label">Base</span>
                    <span>{t.base || "—"}</span>
                  </div>
                  <div className="team-detail-row">
                    <span className="label">Principal</span>
                    <span>{t.teamPrincipal || "—"}</span>
                  </div>
                  <div className="team-detail-row">
                    <span className="label">Power Unit</span>
                    <span>{t.powerUnit || "—"}</span>
                  </div>
                  <div className="team-detail-row">
                    <span className="label">Chassis</span>
                    <span>{t.chassis || "—"}</span>
                  </div>
                  <div className="team-detail-row">
                    <span className="label">First Entry</span>
                    <span>{t.firstEntry || "—"}</span>
                  </div>
                  <div className="team-detail-row">
                    <span className="label">Titles</span>
                    <span
                      style={{
                        color:
                          t.worldChampionships > 0
                            ? "var(--accent-red)"
                            : "var(--text-secondary)",
                        fontWeight: 700,
                      }}
                    >
                      {t.worldChampionships ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageTransition>
  );
}
