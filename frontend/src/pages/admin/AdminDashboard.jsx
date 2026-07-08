import React from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import {
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
  Marquee,
  AnimatedNumber,
} from "../../components/motion";
import { PageHeader, Loader } from "../../components/ui";
import { RACE_SEASON } from "../../config/season";
import {
  IconGrid,
  IconHelmet,
  IconCalendar,
  IconUsers,
  IconChevronRight,
} from "../../components/Icons";

const CARDS = [
  { label: "Teams", key: "teams", link: "/admin/teams", accent: "#e10600", icon: <IconGrid /> },
  { label: "Drivers", key: "drivers", link: "/admin/drivers", accent: "#3671c6", icon: <IconHelmet /> },
  { label: "Races", key: "races", link: "/admin/races", accent: "#27f4d2", icon: <IconCalendar /> },
  { label: "Staff", key: "staff", link: "/admin/staff", accent: "#ff8000", icon: <IconUsers /> },
];

const QUICK = [
  ["/admin/teams", "Manage Teams", "btn-primary"],
  ["/admin/drivers", "Manage Drivers", "btn-primary"],
  ["/admin/races", "Manage Races", "btn-primary"],
  ["/admin/standings", "Manage Standings", "btn-secondary"],
  ["/admin/staff", "Manage Staff", "btn-secondary"],
];

export default function AdminDashboard() {
  const { data, loading } = useFetch(async () => {
    const [t, d, r, s] = await Promise.all([
      API.get("/teams"),
      API.get("/drivers"),
      API.get(`/races?season=${RACE_SEASON}`),
      API.get("/team-staff"),
    ]);
    return {
      teams: t.data.length,
      drivers: d.data.length,
      races: r.data.length,
      staff: s.data.length,
    };
  }, []);

  if (loading) return <Loader label="Loading control room" />;
  const stats = data || { teams: 0, drivers: 0, races: 0, staff: 0 };

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Control Room"
        accent="Admin"
        title="Dashboard"
        subtitle="Manage every corner of your F1 world — teams, drivers, races, standings & staff."
      />

      <Stagger className="stats-grid">
        {CARDS.map((c) => (
          <StaggerItem key={c.key}>
            <Link
              to={c.link}
              className="stat-card"
              style={{ display: "block", textDecoration: "none", "--team-accent": c.accent }}
            >
              <div className="flex-between">
                <span className="stat-value mono-num" style={{ color: c.accent }}>
                  <AnimatedNumber value={stats[c.key]} />
                </span>
                <span style={{ color: c.accent, fontSize: 22, opacity: 0.9 }}>
                  {c.icon}
                </span>
              </div>
              <div className="stat-label">{c.label}</div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent-red)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Manage <IconChevronRight />
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div style={{ margin: "8px 0 28px" }}>
        <Marquee
          items={[
            "Box, box",
            "Lights out",
            "Purple sector",
            "DRS enabled",
            "Fastest lap",
            "Hammer time",
            "Full send",
          ]}
        />
      </div>

      <Reveal className="card">
        <div className="card-header">
          <h3 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
            Quick Actions
          </h3>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {QUICK.map(([to, label, variant]) => (
            <Link key={to} to={to} className={`btn ${variant}`}>
              {label}
            </Link>
          ))}
        </div>
      </Reveal>
    </PageTransition>
  );
}
