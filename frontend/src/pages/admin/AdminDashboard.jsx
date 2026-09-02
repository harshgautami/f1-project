import React from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { loaders } from "../../data/loaders";
import {
  PageTransition,
  Reveal,
  Stagger,
  StaggerItem,
  Marquee,
  AnimatedNumber,
} from "../../components/motion";
import { Loader } from "../../components/ui";
import {
  HubHero,
  HubStat,
  HubCTA,
  HubCard,
  RankList,
  RankRow,
  SectionHead,
} from "../../components/hub";
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
  ["/admin/teams", "Manage teams"],
  ["/admin/drivers", "Manage drivers"],
  ["/admin/races", "Manage races"],
  ["/admin/standings", "Manage standings"],
  ["/admin/staff", "Manage staff"],
];

export default function AdminDashboard() {
  const { data, loading } = useFetch(loaders.adminCounts.fetch, [], { key: loaders.adminCounts.key });

  if (loading) return <Loader label="Loading control room" />;
  const stats = data || { teams: 0, drivers: 0, races: 0, staff: 0 };
  const total = CARDS.reduce((a, c) => a + (stats[c.key] || 0), 0);
  const ranked = [...CARDS].sort((a, b) => stats[b.key] - stats[a.key]).slice(0, 3);

  return (
    <PageTransition>
      <HubHero
        chip="Control room"
        chipTone="live"
        meta={`${total} records`}
        title="Race Control"
        ghost={RACE_SEASON}
        subtitle="Teams · drivers · races · standings · personnel"
        panel={
          <>
            <HubStat tag="Records under management" value={total} />
            <RankList>
              {ranked.map((c, i) => (
                <RankRow
                  key={c.key}
                  pos={i + 1}
                  color={c.accent}
                  name={c.label}
                  right={`${stats[c.key]} rows`}
                  index={i}
                  lead={i === 0}
                  to={c.link}
                />
              ))}
            </RankList>
            <HubCTA to="/live">Open live timing</HubCTA>
          </>
        }
      />

      <SectionHead label="Collections" />

      <Stagger className="hub-admin-grid">
        {CARDS.map((c) => (
          <StaggerItem key={c.key}>
            <Link to={c.link} className="hub-admin-card" style={{ "--team-accent": c.accent }}>
              <span className="hub-admin-ghost mono-num" aria-hidden="true">
                {stats[c.key]}
              </span>
              <span className="hub-admin-icon">{c.icon}</span>
              <span className="hub-admin-value mono-num">
                <AnimatedNumber value={stats[c.key]} />
              </span>
              <span className="hub-admin-label">{c.label}</span>
              <span className="hub-admin-more">
                Manage <IconChevronRight />
              </span>
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

      <Reveal>
        <HubCard title="Quick actions">
          <div className="hub-quick">
            {QUICK.map(([to, label]) => (
              <Link key={to} to={to} className="hub-quick-btn">
                {label} <IconChevronRight />
              </Link>
            ))}
          </div>
        </HubCard>
      </Reveal>
    </PageTransition>
  );
}
